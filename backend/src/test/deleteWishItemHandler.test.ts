import type {
  APIGatewayProxyEventV2,
} from "aws-lambda";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  hashAccessToken,
} from "../accessToken";

import type {
  Group,
} from "../createGroup";

import type {
  WishItem,
} from "../createWishItem";

import {
  createDeleteWishItemHandler,
} from "../deleteWishItemHandler";

import type {
  GroupRepository,
} from "../groupRepository";

import type {
  WishItemRepository,
} from "../wishItemRepository";

const validAccessToken =
  "valid-token";

const group: Group = {
  groupId: "group-001",
  groupName: "休日にやりたいこと",
  accessTokenHash:
    hashAccessToken(
      validAccessToken,
    ),
  createdByDisplayName: "こり",
  createdAt:
    "2026-08-11T00:00:00.000Z",
};

const existingItem: WishItem = {
  groupId: "group-001",
  itemId: "item-001",
  content: "箱根に行く",
  createdByDisplayName: "こり",
  updatedByDisplayName: "こり",
  createdAt:
    "2026-08-11T01:00:00.000Z",
  updatedAt:
    "2026-08-11T01:00:00.000Z",
  createdAtItemId:
    "2026-08-11T01:00:00.000Z#item-001",
};

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
  item: WishItem | null = {
    ...existingItem,
  };

  async save(
    _item: WishItem,
  ): Promise<void> {}

  async findByGroupId(
    _groupId: string,
  ): Promise<WishItem[]> {
    return this.item
      ? [this.item]
      : [];
  }

  async findById(
    groupId: string,
    itemId: string,
  ): Promise<WishItem | null> {
    if (
      this.item?.groupId === groupId &&
      this.item?.itemId === itemId
    ) {
      return this.item;
    }

    return null;
  }

  async update(
    item: WishItem,
  ): Promise<void> {
    this.item = item;
  }

  async delete(
    groupId: string,
    itemId: string,
  ): Promise<void> {
    if (
      this.item?.groupId === groupId &&
      this.item?.itemId === itemId
    ) {
      this.item = null;
    }
  }
}

function createEvent(
  options?: {
    groupId?: string;
    itemId?: string;
    accessToken?: string;
  },
): APIGatewayProxyEventV2 {
  const headers:
    Record<string, string> = {};

  if (options?.accessToken) {
    headers.authorization =
      `Bearer ${options.accessToken}`;
  }

  return {
    version: "2.0",

    routeKey:
      "DELETE /groups/{groupId}/items/{itemId}",

    rawPath:
      `/groups/${
        options?.groupId ?? ""
      }/items/${
        options?.itemId ?? ""
      }`,

    rawQueryString: "",

    headers,

    pathParameters: {
      groupId:
        options?.groupId ?? "",
      itemId:
        options?.itemId ?? "",
    },

    requestContext: {
      accountId: "test-account",
      apiId: "test-api",
      domainName:
        "test.example.com",
      domainPrefix: "test",

      http: {
        method: "DELETE",
        path:
          `/groups/${
            options?.groupId ?? ""
          }/items/${
            options?.itemId ?? ""
          }`,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },

      requestId: "test-request",

      routeKey:
        "DELETE /groups/{groupId}/items/{itemId}",

      stage: "$default",

      time:
        "11/Aug/2026:16:00:00 +0900",

      timeEpoch: 0,
    },

    isBase64Encoded: false,
  };
}

describe(
  "deleteWishItemHandler",
  () => {
    it(
      "正しいトークンでItemを削除できる",
      async () => {
        const repository =
          new FakeWishItemRepository();

        const handler =
          createDeleteWishItemHandler(
            new FakeGroupRepository(),
            repository,
          );

        const response =
          await handler(
            createEvent({
              groupId:
                "group-001",
              itemId:
                "item-001",
              accessToken:
                validAccessToken,
            }),
          );

        expect(
          response.statusCode,
        ).toBe(204);

        expect(
          repository.item,
        ).toBeNull();
      },
    );

    it(
      "トークンがない場合は401",
      async () => {
        const repository =
          new FakeWishItemRepository();

        const handler =
          createDeleteWishItemHandler(
            new FakeGroupRepository(),
            repository,
          );

        const response =
          await handler(
            createEvent({
              groupId:
                "group-001",
              itemId:
                "item-001",
            }),
          );

        expect(
          response.statusCode,
        ).toBe(401);

        // 認証失敗なので削除されていない
        expect(
          repository.item,
        ).not.toBeNull();
      },
    );

    it(
      "不正なトークンの場合は401",
      async () => {
        const repository =
          new FakeWishItemRepository();

        const handler =
          createDeleteWishItemHandler(
            new FakeGroupRepository(),
            repository,
          );

        const response =
          await handler(
            createEvent({
              groupId:
                "group-001",
              itemId:
                "item-001",
              accessToken:
                "wrong-token",
            }),
          );

        expect(
          response.statusCode,
        ).toBe(401);

        expect(
          repository.item,
        ).not.toBeNull();
      },
    );

    it(
      "Itemが存在しない場合は404",
      async () => {
        const repository =
          new FakeWishItemRepository();

        repository.item = null;

        const handler =
          createDeleteWishItemHandler(
            new FakeGroupRepository(),
            repository,
          );

        const response =
          await handler(
            createEvent({
              groupId:
                "group-001",
              itemId:
                "item-999",
              accessToken:
                validAccessToken,
            }),
          );

        expect(
          response.statusCode,
        ).toBe(404);
      },
    );

    it(
      "グループが存在しない場合は404",
      async () => {
        const repository =
          new FakeWishItemRepository();

        const handler =
          createDeleteWishItemHandler(
            new FakeGroupRepository(),
            repository,
          );

        const response =
          await handler(
            createEvent({
              groupId:
                "group-999",
              itemId:
                "item-001",
              accessToken:
                validAccessToken,
            }),
          );

        expect(
          response.statusCode,
        ).toBe(404);

        expect(
          repository.item,
        ).not.toBeNull();
      },
    );
  },
);