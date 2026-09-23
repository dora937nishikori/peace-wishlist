import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  WishItem,
} from "../createWishItem";

import {
  createWishItemUpdateInput,
} from "../dynamoDbWishItemRepository";

const item: WishItem = {
  groupId: "group-001",
  itemId: "item-001",
  content: "箱根に行く",
  comment: "秋に行きたい",
  url: "https://example.com/hakone",
  createdByDisplayName: "こり",
  updatedByDisplayName: "山田",
  createdAt: "2026-08-10T01:00:00.000Z",
  updatedAt: "2026-09-23T01:00:00.000Z",
  createdAtItemId:
    "2026-08-10T01:00:00.000Z#item-001",
};

describe(
  "createWishItemUpdateInput",
  () => {
    it(
      "予約語を含む属性名をプレースホルダー化する",
      () => {
        const input =
          createWishItemUpdateInput(
            "WishItemsTable",
            item,
          );

        expect(
          input.ExpressionAttributeNames,
        ).toMatchObject({
          "#content": "content",
          "#comment": "comment",
          "#url": "url",
          "#updatedByDisplayName":
            "updatedByDisplayName",
          "#updatedAt": "updatedAt",
        });

        expect(
          input.UpdateExpression,
        ).toContain(
          "#comment = :comment",
        );

        expect(
          input.ExpressionAttributeValues,
        ).toMatchObject({
          ":content": "箱根に行く",
          ":comment": "秋に行きたい",
          ":url":
            "https://example.com/hakone",
          ":updatedByDisplayName": "山田",
        });
      },
    );

    it(
      "既存項目にURLを初めて設定する入力を作れる",
      () => {
        const input =
          createWishItemUpdateInput(
            "WishItemsTable",
            {
              ...item,
              comment: undefined,
              url: "https://example.com/new",
            },
          );

        expect(
          input.ExpressionAttributeValues,
        ).toMatchObject({
          ":comment": "",
          ":url":
            "https://example.com/new",
        });
      },
    );
  },
);
