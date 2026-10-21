import { createServer, type IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { Group } from "./createGroup";
import type { WishItem } from "./createWishItem";
import type { GroupRepository } from "./groupRepository";
import type { WishItemRepository } from "./wishItemRepository";
import { createGroupHandler } from "./createGroupHandler";
import { createGetGroupHandler } from "./getGroupHandler";
import { createWishItemHandler } from "./createWishItemHandler";
import { createGetWishItemsHandler } from "./getWishItemsHandler";
import { createGetWishItemHandler } from "./getWishItemHandler";
import { createUpdateWishItemHandler } from "./updateWishItemHandler";
import { createDeleteWishItemHandler } from "./deleteWishItemHandler";
import { createLinkPreviewHandler } from "./linkPreviewHandler";
import { createPhotosHandler } from "./photosHandler";
import {
  MAX_PHOTO_BYTES,
  validatePhoto,
  type PhotoStore,
  type Upload,
} from "./photoStore";
import { HttpError, json, type Handler } from "./http";

const port = Number(process.env.LOCAL_API_PORT || 4174);
const origin = `http://127.0.0.1:${port}`;
const groupData = new Map<string, Group>();
const itemData = new Map<string, WishItem>();
const groups: GroupRepository = {
  async save(group) {
    groupData.set(group.groupId, group);
  },
  async findById(id) {
    return groupData.get(id) ?? null;
  },
};
const itemKey = (groupId: string, itemId: string) => `${groupId}/${itemId}`;
const items: WishItemRepository = {
  async save(item) {
    itemData.set(itemKey(item.groupId, item.itemId), item);
  },
  async findById(groupId, itemId) {
    return itemData.get(itemKey(groupId, itemId)) ?? null;
  },
  async findByGroupId(groupId) {
    return [...itemData.values()]
      .filter((item) => item.groupId === groupId)
      .sort((a, b) => b.createdAtItemId.localeCompare(a.createdAtItemId));
  },
  async update(item, expectedUpdatedAt) {
    const old = itemData.get(itemKey(item.groupId, item.itemId));
    if (!old || (expectedUpdatedAt && old.updatedAt !== expectedUpdatedAt)) {
      const error = new Error("conflict");
      error.name = "ConditionalCheckFailedException";
      throw error;
    }
    itemData.set(itemKey(item.groupId, item.itemId), item);
  },
  async delete(groupId, itemId) {
    itemData.delete(itemKey(groupId, itemId));
  },
};

type StoredPhoto = { bytes: Buffer; type: string };
const photoData = new Map<string, StoredPhoto>();
// An explicit local fixture can preserve preview data across a developer restart.
if (process.env.LOCAL_SEED_FILE) {
  const seed = JSON.parse(
    readFileSync(process.env.LOCAL_SEED_FILE, "utf8"),
  ) as {
    groups: Group[];
    items: WishItem[];
    photos: { key: string; bytes: string; type: string }[];
  };
  seed.groups.forEach((group) => groupData.set(group.groupId, group));
  seed.items.forEach((item) =>
    itemData.set(itemKey(item.groupId, item.itemId), item),
  );
  seed.photos.forEach((photo) =>
    photoData.set(photo.key, {
      bytes: Buffer.from(photo.bytes, "base64"),
      type: photo.type,
    }),
  );
}

const uploads = new Map<
  string,
  { key: string; type: string; expires: number }
>();
const downloads = new Map<string, { key: string; expires: number }>();
const photoStore: PhotoStore = {
  async createUpload(groupId, itemId, contentType): Promise<Upload> {
    const token = randomUUID();
    const key = `uploads/${groupId}/${itemId}/${randomUUID()}`;
    uploads.set(token, {
      key,
      type: contentType,
      expires: Date.now() + 300000,
    });
    return {
      key,
      url: `${origin}/local-uploads/${token}`,
      method: "PUT",
      fields: {},
    };
  },
  async commit(key) {
    const photo = photoData.get(key);
    if (!photo) throw new HttpError(400, "写真をもう一度選んでください");
    validatePhoto(photo.bytes, photo.type);
    const finalKey = key
      .replace(/^uploads\//, "photos/")
      .replace(/[^/]+$/, randomUUID());
    photoData.set(finalKey, photo);
    return finalKey;
  },
  async url(key) {
    const token = randomUUID();
    downloads.set(token, { key, expires: Date.now() + 3600000 });
    return `${origin}/local-photos/${token}`;
  },
  async delete(key) {
    photoData.delete(key);
  },
};

const handlers: Record<string, Handler> = {
  "POST /groups": createGroupHandler(groups),
  "GET /groups/:group": createGetGroupHandler(groups),
  "POST /groups/:group/link-preview": createLinkPreviewHandler(groups),
  "POST /groups/:group/items": createWishItemHandler(groups, items, photoStore),
  "GET /groups/:group/items": createGetWishItemsHandler(
    groups,
    items,
    photoStore,
  ),
  "GET /groups/:group/items/:item": createGetWishItemHandler(
    groups,
    items,
    photoStore,
  ),
  "PATCH /groups/:group/items/:item": createUpdateWishItemHandler(
    groups,
    items,
    photoStore,
  ),
  "DELETE /groups/:group/items/:item": createDeleteWishItemHandler(
    groups,
    items,
    photoStore,
  ),
  "POST /groups/:group/items/:item/photos/upload": createPhotosHandler(
    groups,
    items,
    photoStore,
  ),
  "POST /groups/:group/items/:item/photos": createPhotosHandler(
    groups,
    items,
    photoStore,
  ),
  "DELETE /groups/:group/items/:item/photos/:photo": createPhotosHandler(
    groups,
    items,
    photoStore,
  ),
};

async function readBytes(
  request: IncomingMessage,
  limit: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > limit) throw new HttpError(413, "ファイルが大きすぎます");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

const server = createServer((request, response) => {
  response.setHeader("access-control-allow-origin", "http://localhost:5173");
  response.setHeader(
    "access-control-allow-headers",
    "authorization, content-type",
  );
  response.setHeader(
    "access-control-allow-methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  );
  response.setHeader("cache-control", "no-store");
  void (async () => {
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }
    const path = new URL(request.url ?? "/", origin).pathname;
    const segments = path.split("/").filter(Boolean).map(decodeURIComponent);
    if (segments[0] === "local-uploads" && request.method === "PUT") {
      const upload = uploads.get(segments[1]);
      if (!upload || upload.expires < Date.now())
        throw new HttpError(403, "アップロードの有効期限が切れました");
      const bytes = await readBytes(request, MAX_PHOTO_BYTES);
      validatePhoto(bytes, upload.type);
      photoData.set(upload.key, { bytes, type: upload.type });
      uploads.delete(segments[1]);
      response.writeHead(204);
      response.end();
      return;
    }
    if (segments[0] === "local-photos" && request.method === "GET") {
      const download = downloads.get(segments[1]);
      const photo =
        download && download.expires > Date.now()
          ? photoData.get(download.key)
          : undefined;
      if (!photo) throw new HttpError(404, "写真が見つかりません");
      response.writeHead(200, {
        "content-type": photo.type,
        "x-content-type-options": "nosniff",
      });
      response.end(photo.bytes);
      return;
    }
    const pattern = segments
      .map((segment, index) =>
        index === 1
          ? ":group"
          : index === 3
            ? ":item"
            : index === 5 && segment !== "upload"
              ? ":photo"
              : segment,
      )
      .join("/");
    const route = `${request.method} /${pattern}`;
    const handler = handlers[route];
    if (!handler) throw new HttpError(404, "APIが見つかりません");
    const event = {
      version: "2.0",
      routeKey: route,
      rawPath: path,
      rawQueryString: "",
      headers: Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(",") : value,
        ]),
      ),
      pathParameters: {
        groupId: segments[1],
        itemId: segments[3],
        photoId: segments[5],
      },
      requestContext: {
        accountId: "local",
        apiId: "local",
        domainName: "localhost",
        domainPrefix: "local",
        requestId: randomUUID(),
        routeKey: route,
        stage: "$default",
        time: new Date().toISOString(),
        timeEpoch: Date.now(),
        http: {
          method: request.method ?? "GET",
          path,
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: "local",
        },
      },
      body: (await readBytes(request, 1024 * 1024)).toString("utf8"),
      isBase64Encoded: false,
    } as APIGatewayProxyEventV2;
    const result = await handler(event);
    response.writeHead(
      result.statusCode ?? 200,
      result.headers as Record<string, string>,
    );
    response.end(result.body ?? "");
  })().catch((error) => {
    const result = json(error instanceof HttpError ? error.statusCode : 500, {
      message:
        error instanceof HttpError
          ? error.message
          : "ローカルAPIでエラーが発生しました",
    });
    if (!(error instanceof HttpError)) console.error(error);
    response.writeHead(
      result.statusCode!,
      result.headers as Record<string, string>,
    );
    response.end(result.body);
  });
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Peace Wishlist local API: ${origin}\n写真を含むデータはプロセス終了時に消去されます。`,
  ),
);
process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
