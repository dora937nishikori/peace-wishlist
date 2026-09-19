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
  createGetWishItemsHandler,
} from "../getWishItemsHandler";
import type {
  GroupRepository,
} from "../groupRepository";
import type {
  WishItemRepository,
} from "../wishItemRepository";

const validAccessToken = "valid-token";

const group: Group = {
  groupId: "group-001",
  groupName: "休日にやりたいこと",
  accessTokenHash:
    hashAccessToken(validAccessToken),
  createdByDisplayName: "こり",
  createdAt: "2026-08-10T00:00:00.000Z",
};

const items: WishItem[] = [
  {
    groupId: "group-001",
    itemId: "item-002",
    content: "焼肉を食べる",
    comment: "駅の近くで探す",
    url: "https://example.com/yakiniku",
    createdByDisplayName: "こり",
    updatedByDisplayName: "こり",
    createdAt: "2026-08-10T02:00:00.000Z",
    updatedAt: "2026-08-10T02:00:00.000Z",
    createdAtItemId:
      "2026-08-10T02:00:00.000Z#item-002",
  },
  {
    groupId: "group-001",
    itemId: "item-001",
    content: "箱根に行く",
    createdByDisplayName: "こり",
    updatedByDisplayName: "こり",
    createdAt: "2026-08-10T01:00:00.000Z",
    updatedAt: "2026-08-10T01:00:00.000Z",
    createdAtItemId:
      "2026-08-10T01:00:00.000Z#item-001",
  },
];

class FakeGroupRepository
  implements GroupRepository
{
  async save(
    _group: Group,
  ): Promise<void> {}

  async findById(
    groupId: string,
  ): Promise<Group | null> {
    return groupId === group.groupId
      ? group
      : null;
  }
}

class FakeWishItemRepository
  implements WishItemRepository
{
  async save(
    _item: WishItem,
  ): Promise<void> {}

  async findByGroupId(
    groupId: string,
  ): Promise<WishItem[]> {
    return groupId === "group-001"
      ? items
      : [];
  }

  async findById(
    groupId: string,
    itemId: string,
  ): Promise<WishItem | null> {
    return (
      items.find(
        (item) =>
          item.groupId
            === groupId &&
          item.itemId
            === itemId,
      ) ?? null
    );
  }

  async update(
    _item: WishItem,
  ): Promise<void> {}

  async delete(
    _groupId: string,
    _itemId: string,
  ): Promise<void> {}
}

class FailingWishItemRepository
  implements WishItemRepository
{
  async save(
    _item: WishItem,
  ): Promise<void> {}

  async findByGroupId(
    _groupId: string,
  ): Promise<WishItem[]> {
    throw new Error("DB取得失敗");
  }

  async findById(
    _groupId: string,
    _itemId: string,
  ): Promise<WishItem | null> {
    return null;
  }

  async update(
    _item: WishItem,
  ): Promise<void> {}

  async delete(
    _groupId: string,
    _itemId: string,
  ): Promise<void> {}
}

function createEvent(
  options?: {
    groupId?: string;
    accessToken?: string;
  },
): APIGatewayProxyEventV2 {
  const headers: Record<string, string> = {};

  if (options?.accessToken) {
    headers.authorization =
      `Bearer ${options.accessToken}`;
  }

  return {
    version: "2.0",
    routeKey:
      "GET /groups/{groupId}/items",
    rawPath:
      `/groups/${options?.groupId ?? ""}/items`,
    rawQueryString: "",
    headers,
    pathParameters:
      options?.groupId
        ? {
            groupId: options.groupId,
          }
        : undefined,
    requestContext: {
      accountId: "test-account",
      apiId: "test-api",
      domainName: "test.example.com",
      domainPrefix: "test",
      http: {
        method: "GET",
        path:
          `/groups/${options?.groupId ?? ""}/items`,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
      requestId: "test-request",
      routeKey:
        "GET /groups/{groupId}/items",
      stage: "$default",
      time:
        "10/Aug/2026:16:00:00 +0900",
      timeEpoch: 0,
    },
    isBase64Encoded: false,
  };
}

describe("getWishItemsHandler", () => {
  const testHandler =
    createGetWishItemsHandler(
      new FakeGroupRepository(),
      new FakeWishItemRepository(),
    );

  it(
    "正しいトークンでItem一覧を取得できる",
    async () => {
      const response =
        await testHandler(
          createEvent({
            groupId: "group-001",
            accessToken:
              validAccessToken,
          }),
        );

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(
        response.body ?? "{}",
      );

      expect(body.items).toHaveLength(2);
      expect(body.items[0].itemId).toBe(
        "item-002",
      );
      expect(body.items[1].itemId).toBe(
        "item-001",
      );
      expect(body.items[0].comment).toBeUndefined();
      expect(body.items[0].url).toBeUndefined();
    },
  );

  it(
    "トークンがない場合は401を返す",
    async () => {
      const response =
        await testHandler(
          createEvent({
            groupId: "group-001",
          }),
        );

      expect(response.statusCode).toBe(401);
    },
  );

  it(
    "トークンが不正な場合は401を返す",
    async () => {
      const response =
        await testHandler(
          createEvent({
            groupId: "group-001",
            accessToken:
              "wrong-token",
          }),
        );

      expect(response.statusCode).toBe(401);
    },
  );

  it(
    "グループが存在しない場合は404を返す",
    async () => {
      const response =
        await testHandler(
          createEvent({
            groupId: "unknown-group",
            accessToken:
              validAccessToken,
          }),
        );

      expect(response.statusCode).toBe(404);
    },
  );

  it(
    "Itemが存在しない場合は空配列を返す",
    async () => {
      const emptyHandler =
        createGetWishItemsHandler(
          new FakeGroupRepository(),
          {
            async save(
              _item: WishItem,
            ): Promise<void> {},

            async findByGroupId(
              _groupId: string,
            ): Promise<WishItem[]> {
              return [];
            },

            async findById(
              _groupId: string,
              _itemId: string,
            ): Promise<WishItem | null> {
              return null;
            },

            async update(
              _item: WishItem,
            ): Promise<void> {},

            async delete(
              _groupId: string,
              _itemId: string,
            ): Promise<void> {},
          },
        );

      const response =
        await emptyHandler(
          createEvent({
            groupId: "group-001",
            accessToken:
              validAccessToken,
          }),
        );

      const body = JSON.parse(
        response.body ?? "{}",
      );

      expect(response.statusCode).toBe(200);
      expect(body.items).toEqual([]);
    },
  );

  it(
    "Item一覧の取得に失敗した場合は500を返す",
    async () => {
      const failingHandler =
        createGetWishItemsHandler(
          new FakeGroupRepository(),
          new FailingWishItemRepository(),
        );

      const response =
        await failingHandler(
          createEvent({
            groupId: "group-001",
            accessToken:
              validAccessToken,
          }),
        );

      expect(response.statusCode).toBe(500);
    },
  );
});
