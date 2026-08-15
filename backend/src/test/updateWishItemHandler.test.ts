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
  createUpdateWishItemHandler,
} from "../updateWishItemHandler";

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
  groupName:
    "休日にやりたいこと",
  accessTokenHash:
    hashAccessToken(
      validAccessToken,
    ),
  createdByDisplayName:
    "こり",
  createdAt:
    "2026-08-10T00:00:00.000Z",
};

const existingItem: WishItem = {
  groupId: "group-001",
  itemId: "item-001",
  content: "箱根に行く",
  createdByDisplayName:
    "こり",
  updatedByDisplayName:
    "こり",
  createdAt:
    "2026-08-10T01:00:00.000Z",
  updatedAt:
    "2026-08-10T01:00:00.000Z",
  createdAtItemId:
    "2026-08-10T01:00:00.000Z#item-001",
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
    return groupId
      === group.groupId
      ? group
      : null;
  }
}

class FakeWishItemRepository
  implements WishItemRepository
{
  item:
    WishItem | null =
      existingItem;

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
      this.item &&
      this.item.groupId
        === groupId &&
      this.item.itemId
        === itemId
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
    _groupId: string,
    _itemId: string,
  ): Promise<void> {}
}

function createEvent(
  options?: {
    groupId?: string;
    itemId?: string;
    accessToken?: string;
    body?: object;
  },
): APIGatewayProxyEventV2 {
  const headers:
    Record<string, string> = {};

  if (
    options?.accessToken
  ) {
    headers.authorization =
      `Bearer ${options.accessToken}`;
  }

  return {
    version: "2.0",

    routeKey:
      "PATCH /groups/{groupId}/items/{itemId}",

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
      accountId:
        "test-account",

      apiId:
        "test-api",

      domainName:
        "test.example.com",

      domainPrefix:
        "test",

      http: {
        method: "PATCH",

        path:
          `/groups/${
            options?.groupId ?? ""
          }/items/${
            options?.itemId ?? ""
          }`,

        protocol:
          "HTTP/1.1",

        sourceIp:
          "127.0.0.1",

        userAgent:
          "vitest",
      },

      requestId:
        "test-request",

      routeKey:
        "PATCH /groups/{groupId}/items/{itemId}",

      stage:
        "$default",

      time:
        "11/Aug/2026:10:00:00 +0900",

      timeEpoch: 0,
    },

    body:
      options?.body
        ? JSON.stringify(
            options.body,
          )
        : undefined,

    isBase64Encoded:
      false,
  };
}

describe(
  "updateWishItemHandler",
  () => {
    it(
      "正しいトークンでItemを更新できる",
      async () => {
        const repository =
          new FakeWishItemRepository();

        const handler =
          createUpdateWishItemHandler(
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

              body: {
                content:
                  "秋に箱根へ行く",

                displayName:
                  "山田",
              },
            }),
          );

        expect(
          response.statusCode,
        ).toBe(200);

        expect(
          repository.item?.content,
        ).toBe(
          "秋に箱根へ行く",
        );

        expect(
          repository.item
            ?.updatedByDisplayName,
        ).toBe("山田");
      },
    );

    it(
      "トークンがない場合は401",
      async () => {
        const handler =
          createUpdateWishItemHandler(
            new FakeGroupRepository(),
            new FakeWishItemRepository(),
          );

        const response =
          await handler(
            createEvent({
              groupId:
                "group-001",
              itemId:
                "item-001",
              body: {
                content:
                  "秋に箱根へ行く",
                displayName:
                  "山田",
              },
            }),
          );

        expect(
          response.statusCode,
        ).toBe(401);
      },
    );

    it(
      "不正トークンの場合は401",
      async () => {
        const handler =
          createUpdateWishItemHandler(
            new FakeGroupRepository(),
            new FakeWishItemRepository(),
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
              body: {
                content:
                  "秋に箱根へ行く",
                displayName:
                  "山田",
              },
            }),
          );

        expect(
          response.statusCode,
        ).toBe(401);
      },
    );

    it(
      "Itemが存在しない場合は404",
      async () => {
        const repository =
          new FakeWishItemRepository();

        repository.item =
          null;

        const handler =
          createUpdateWishItemHandler(
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
              body: {
                content:
                  "秋に箱根へ行く",
                displayName:
                  "山田",
              },
            }),
          );

        expect(
          response.statusCode,
        ).toBe(404);
      },
    );

    it(
      "内容が空の場合は400",
      async () => {
        const handler =
          createUpdateWishItemHandler(
            new FakeGroupRepository(),
            new FakeWishItemRepository(),
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
              body: {
                content:
                  "   ",
                displayName:
                  "山田",
              },
            }),
          );

        expect(
          response.statusCode,
        ).toBe(400);
      },
    );
  },
);
