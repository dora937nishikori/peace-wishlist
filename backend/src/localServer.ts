import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import {
  verifyAccessToken,
} from "./accessToken";
import {
  createGroup,
  type Group,
} from "./createGroup";
import {
  createWishItem,
  type WishItem,
} from "./createWishItem";
import {
  updateWishItem,
} from "./updateWishItem";
import {
  toWishItemResponse,
  toWishItemSummaryResponse,
} from "./wishItemResponse";

const DEFAULT_PORT = 4174;
const MAX_BODY_BYTES = 1024 * 1024;

const groups = new Map<string, Group>();
const wishItems = new Map<string, Map<string, WishItem>>();

function setCorsHeaders(response: ServerResponse): void {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader(
    "access-control-allow-headers",
    "authorization, content-type",
  );
  response.setHeader(
    "access-control-allow-methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: object,
): void {
  setCorsHeaders(response);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function sendEmpty(
  response: ServerResponse,
  statusCode: number,
): void {
  setCorsHeaders(response);
  response.writeHead(statusCode);
  response.end();
}

async function readJson(
  request: IncomingMessage,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error("リクエストが大きすぎます");
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    throw new Error("リクエストボディが必要です");
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("JSONの形式が正しくありません");
  }
}

function asRecord(
  value: unknown,
): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : null;
}

function extractBearerToken(
  request: IncomingMessage,
): string | null {
  const authorization = request.headers.authorization;
  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token
    ? token
    : null;
}

function authorize(
  request: IncomingMessage,
  response: ServerResponse,
  groupId: string,
): Group | null {
  const group = groups.get(groupId);

  if (!group) {
    sendJson(response, 404, {
      message: "グループが見つかりません",
    });
    return null;
  }

  const accessToken = extractBearerToken(request);

  if (
    !accessToken ||
    !verifyAccessToken(
      accessToken,
      group.accessTokenHash,
    )
  ) {
    sendJson(response, 401, {
      message: "アクセストークンが正しくありません",
    });
    return null;
  }

  return group;
}

function getPathSegments(request: IncomingMessage): string[] {
  const url = new URL(
    request.url ?? "/",
    "http://127.0.0.1",
  );

  return url.pathname
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  if (request.method === "OPTIONS") {
    sendEmpty(response, 204);
    return;
  }

  const segments = getPathSegments(request);

  if (
    request.method === "POST" &&
    segments.length === 1 &&
    segments[0] === "groups"
  ) {
    const record = asRecord(await readJson(request));

    if (
      !record ||
      typeof record.groupName !== "string" ||
      typeof record.createdByDisplayName !== "string"
    ) {
      sendJson(response, 400, {
        message: "グループ名と表示名を入力してください",
      });
      return;
    }

    const result = createGroup({
      groupName: record.groupName,
      createdByDisplayName: record.createdByDisplayName,
    });
    groups.set(result.group.groupId, result.group);
    wishItems.set(result.group.groupId, new Map());

    sendJson(response, 201, {
      groupId: result.group.groupId,
      groupName: result.group.groupName,
      createdByDisplayName:
        result.group.createdByDisplayName,
      createdAt: result.group.createdAt,
      accessToken: result.accessToken,
    });
    return;
  }

  if (
    segments[0] !== "groups" ||
    !segments[1]
  ) {
    sendJson(response, 404, {
      message: "APIが見つかりません",
    });
    return;
  }

  const groupId = segments[1];
  const group = authorize(
    request,
    response,
    groupId,
  );
  if (!group) return;

  if (
    request.method === "GET" &&
    segments.length === 2
  ) {
    sendJson(response, 200, {
      groupId: group.groupId,
      groupName: group.groupName,
      createdByDisplayName:
        group.createdByDisplayName,
      createdAt: group.createdAt,
    });
    return;
  }

  if (
    segments[2] !== "items"
  ) {
    sendJson(response, 404, {
      message: "APIが見つかりません",
    });
    return;
  }

  const groupItems = wishItems.get(groupId) ?? new Map();

  if (
    request.method === "GET" &&
    segments.length === 3
  ) {
    const items = [...groupItems.values()]
      .sort((left, right) =>
        right.createdAtItemId.localeCompare(
          left.createdAtItemId,
        ),
      )
      .map(toWishItemSummaryResponse);

    sendJson(response, 200, { items });
    return;
  }

  if (
    request.method === "POST" &&
    segments.length === 3
  ) {
    const record = asRecord(await readJson(request));

    if (
      !record ||
      typeof record.content !== "string" ||
      typeof record.displayName !== "string" ||
      (record.comment !== undefined &&
        typeof record.comment !== "string") ||
      (record.url !== undefined &&
        typeof record.url !== "string")
    ) {
      sendJson(response, 400, {
        message: "入力内容が正しくありません",
      });
      return;
    }

    const item = createWishItem({
      groupId,
      content: record.content,
      comment: record.comment as string | undefined,
      url: record.url as string | undefined,
      displayName: record.displayName,
    });
    groupItems.set(item.itemId, item);
    wishItems.set(groupId, groupItems);

    sendJson(response, 201, toWishItemResponse(item));
    return;
  }

  const itemId = segments[3];
  const item = itemId ? groupItems.get(itemId) : null;

  if (!item || segments.length !== 4) {
    sendJson(response, 404, {
      message: "やりたいことが見つかりません",
    });
    return;
  }

  if (request.method === "GET") {
    sendJson(response, 200, toWishItemResponse(item));
    return;
  }

  if (request.method === "PATCH") {
    const record = asRecord(await readJson(request));

    if (
      !record ||
      typeof record.content !== "string" ||
      typeof record.displayName !== "string" ||
      (record.comment !== undefined &&
        typeof record.comment !== "string") ||
      (record.url !== undefined &&
        typeof record.url !== "string")
    ) {
      sendJson(response, 400, {
        message: "入力内容が正しくありません",
      });
      return;
    }

    const updatedItem = updateWishItem({
      item,
      content: record.content,
      comment: record.comment as string | undefined,
      url: record.url as string | undefined,
      displayName: record.displayName,
    });
    groupItems.set(itemId, updatedItem);

    sendJson(
      response,
      200,
      toWishItemResponse(updatedItem),
    );
    return;
  }

  if (request.method === "DELETE") {
    groupItems.delete(itemId);
    sendEmpty(response, 204);
    return;
  }

  sendJson(response, 405, {
    message: "この操作には対応していません",
  });
}

const configuredPort = Number.parseInt(
  process.env.LOCAL_API_PORT ?? "",
  10,
);
const port = Number.isInteger(configuredPort)
  ? configuredPort
  : DEFAULT_PORT;

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error) => {
    if (error instanceof Error) {
      sendJson(response, 400, {
        message: error.message,
      });
      return;
    }

    console.error(error);
    sendJson(response, 500, {
      message: "ローカルAPIでエラーが発生しました",
    });
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(
    `Peace Wishlist local API: http://127.0.0.1:${port}`,
  );
  console.log("データはプロセス終了時に消去されます。");
});

function closeServer(): void {
  server.close(() => process.exit(0));
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
