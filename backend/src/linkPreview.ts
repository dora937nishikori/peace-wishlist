import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import * as cheerio from "cheerio";
import ipaddr from "ipaddr.js";
import { HttpError } from "./http";

export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

export function publicWebUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(value.trim())
        ? value.trim()
        : `https://${value.trim()}`,
    );
  } catch {
    throw new HttpError(400, "正しいURLを入力してください");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && url.port !== "80" && url.port !== "443") ||
    (!host.includes(".") && !host.includes(":")) ||
    /(^|\.)(localhost|local|internal|test|invalid)$/i.test(host) ||
    (ipaddr.isValid(host) && !isPublicAddress(host))
  ) {
    throw new HttpError(400, "公開されているWebページのURLを入力してください");
  }
  url.hash = "";
  return url;
}

async function resolveHost(host: string, signal: AbortSignal) {
  return Promise.race([
    lookup(host, { all: true, verbatim: true }),
    new Promise<never>((_, reject) => {
      if (signal.aborted) reject(new Error("timeout"));
      else
        signal.addEventListener("abort", () => reject(new Error("timeout")), {
          once: true,
        });
    }),
  ]);
}

async function requestPage(
  url: URL,
  signal: AbortSignal,
): Promise<{ body?: string; redirect?: string }> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await resolveHost(host, signal);
  if (
    !addresses.length ||
    addresses.some(({ address }) => !isPublicAddress(address))
  ) {
    throw new HttpError(400, "このURLからは情報を取得できません");
  }
  // Connect to the validated IP, while preserving Host and TLS certificate verification.
  // A second DNS lookup must never bypass the address validation.
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      {
        hostname: addresses[0].address,
        family: addresses[0].family,
        servername: host,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        method: "GET",
        agent: false,
        signal,
        headers: {
          host: url.host,
          "user-agent": "Soreshiyo/1.0 (+link preview)",
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "identity",
        },
      },
      (response) => {
        if (
          [301, 302, 303, 307, 308].includes(response.statusCode ?? 0) &&
          response.headers.location
        ) {
          response.destroy();
          resolve({ redirect: response.headers.location });
          return;
        }
        if (
          response.statusCode !== 200 ||
          !/text\/html|application\/xhtml\+xml/i.test(
            response.headers["content-type"] ?? "",
          )
        ) {
          response.destroy();
          reject(new Error("unsupported response"));
          return;
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        response.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 1024 * 1024) {
            response.destroy(new Error("page too large"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("end", () =>
          resolve({ body: Buffer.concat(chunks).toString("utf8") }),
        );
      },
    );
    request.on("error", reject);
    request.end();
  });
}

export function parsePreview(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const meta = (key: string) =>
    $(`meta[property="${key}"], meta[name="${key}"]`)
      .first()
      .attr("content")
      ?.trim() ?? "";
  const title = (
    meta("og:title") ||
    meta("twitter:title") ||
    $("title").first().text()
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  let imageUrl = "";
  const image =
    meta("og:image:secure_url") || meta("og:image") || meta("twitter:image");
  if (image) {
    try {
      const candidate = publicWebUrl(new URL(image, pageUrl).href);
      if (candidate.protocol === "https:" && candidate.href.length <= 2048)
        imageUrl = candidate.href;
    } catch {
      /* A usable title does not depend on an image. */
    }
  }
  return { title, imageUrl, url: pageUrl };
}

export async function fetchLinkPreview(value: string) {
  let url = publicWebUrl(value);
  const signal = AbortSignal.timeout(8000);
  try {
    for (let redirects = 0; redirects <= 3; redirects++) {
      const result = await requestPage(url, signal);
      if (result.redirect) {
        url = publicWebUrl(new URL(result.redirect, url).href);
        continue;
      }
      const preview = parsePreview(result.body ?? "", url.href);
      if (preview.imageUrl) {
        const imageHost = new URL(preview.imageUrl).hostname;
        const addresses = await resolveHost(
          imageHost.replace(/^\[|\]$/g, ""),
          signal,
        );
        if (
          !addresses.length ||
          addresses.some(({ address }) => !isPublicAddress(address))
        )
          preview.imageUrl = "";
      }
      return preview;
    }
    throw new Error("too many redirects");
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      422,
      "このページの情報を取得できませんでした。名前を入力して保存できます",
    );
  }
}
