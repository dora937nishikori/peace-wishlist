import type {
  APIGatewayProxyEventV2,
} from "aws-lambda";
import {
  describe,
  expect,
  it,
} from "vitest";

import { hashAccessToken } from "../accessToken";
import type { Group } from "../createGroup";
import type { WishItem } from "../createWishItem";
import {
  createGetWishItemHandler,
} from "../getWishItemHandler";
import type { GroupRepository } from "../groupRepository";
import type {
  WishItemRepository,
} from "../wishItemRepository";

const validAccessToken = "valid-token";

const group: Group = {
  groupId: "group-001",
  groupName: "休日にやりたいこと",
  accessTokenHash: hashAccessToken(validAccessToken),
  createdByDisplayName: "こり",
  createdAt: "2026-08-10T00:00:00.000Z",
};

const item: WishItem = {
  groupId: "group-001",
  itemId: "item-001",
  content: "箱根に行く",
  comment: "秋に行きたい",
  url: "https://example.com/hakone",
  createdByDisplayName: "こり",
  updatedByDisplayName: "こり",
  createdAt: "2026-08-10T01:00:00.000Z",
  updatedAt: "2026-08-10T01:00:00.000Z",
  createdAtItemId:
    "2026-08-10T01:00:00.000Z#item-001",
};

class FakeGroupRepository implements GroupRepository {
  async save(_group: Group): Promise<void> {}

  async findById(groupId: string): Promise<Group | null> {
    return groupId === group.groupId ? group : null;
  }
}

class FakeWishItemRepository
  implements WishItemRepository
{
  async save(_item: WishItem): Promise<void> {}

  async findByGroupId(
    _groupId: string,
  ): Promise<WishItem[]> {
    return [item];
  }

  async findById(
    groupId: string,
    itemId: string,
  ): Promise<WishItem | null> {
    return groupId === item.groupId &&
      itemId === item.itemId
      ? item
      : null;
  }

  async update(_item: WishItem): Promise<void> {}

  async delete(
    _groupId: string,
    _itemId: string,
  ): Promise<void> {}
}

function createEvent(options: {
  groupId?: string;
  itemId?: string;
  accessToken?: string;
}): APIGatewayProxyEventV2 {
  const headers: Record<string, string> = {};

  if (options.accessToken) {
    headers.authorization =
      `Bearer ${options.accessToken}`;
  }

  return {
    version: "2.0",
    routeKey:
      "GET /groups/{groupId}/items/{itemId}",
    rawPath:
      `/groups/${options.groupId ?? ""}/items/${options.itemId ?? ""}`,
    rawQueryString: "",
    headers,
    pathParameters: {
      groupId: options.groupId ?? "",
      itemId: options.itemId ?? "",
    },
    requestContext: {
      accountId: "test-account",
      apiId: "test-api",
      domainName: "test.example.com",
      domainPrefix: "test",
      http: {
        method: "GET",
        path: "/groups/group-001/items/item-001",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
      requestId: "test-request",
      routeKey:
        "GET /groups/{groupId}/items/{itemId}",
      stage: "$default",
      time: "10/Aug/2026:16:00:00 +0900",
      timeEpoch: 0,
    },
    isBase64Encoded: false,
  };
}

describe("getWishItemHandler", () => {
  const testHandler = createGetWishItemHandler(
    new FakeGroupRepository(),
    new FakeWishItemRepository(),
  );

  it("詳細をコメントとURLを含めて取得できる", async () => {
    const response = await testHandler(
      createEvent({
        groupId: "group-001",
        itemId: "item-001",
        accessToken: validAccessToken,
      }),
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? "{}")).toMatchObject({
      itemId: "item-001",
      comment: "秋に行きたい",
      url: "https://example.com/hakone",
    });
  });

  it("Itemが存在しない場合は404を返す", async () => {
    const response = await testHandler(
      createEvent({
        groupId: "group-001",
        itemId: "unknown-item",
        accessToken: validAccessToken,
      }),
    );

    expect(response.statusCode).toBe(404);
  });

  it("トークンが不正な場合は401を返す", async () => {
    const response = await testHandler(
      createEvent({
        groupId: "group-001",
        itemId: "item-001",
        accessToken: "wrong-token",
      }),
    );

    expect(response.statusCode).toBe(401);
  });
});
