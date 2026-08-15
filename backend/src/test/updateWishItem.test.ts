import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  WishItem,
} from "../createWishItem";

import {
  updateWishItem,
} from "../updateWishItem";

const existingItem: WishItem = {
  groupId: "group-001",
  itemId: "item-001",
  content: "箱根に行く",
  createdByDisplayName: "こり",
  updatedByDisplayName: "こり",
  createdAt: "2026-08-10T01:00:00.000Z",
  updatedAt: "2026-08-10T01:00:00.000Z",
  createdAtItemId:
    "2026-08-10T01:00:00.000Z#item-001",
};

describe("updateWishItem", () => {
  it("内容と更新者を変更できる", () => {
    const updatedItem =
      updateWishItem({
        item: existingItem,
        content: "秋に箱根へ行く",
        displayName: "山田",
      });

    expect(updatedItem.content).toBe(
      "秋に箱根へ行く",
    );

    expect(
      updatedItem.updatedByDisplayName,
    ).toBe("山田");

    expect(
      updatedItem.updatedAt,
    ).not.toBe(existingItem.updatedAt);
  });

  it(
    "作成者と作成日時は変更しない",
    () => {
      const updatedItem =
        updateWishItem({
          item: existingItem,
          content: "秋に箱根へ行く",
          displayName: "山田",
        });

      expect(
        updatedItem.createdByDisplayName,
      ).toBe(
        existingItem.createdByDisplayName,
      );

      expect(
        updatedItem.createdAt,
      ).toBe(existingItem.createdAt);

      expect(
        updatedItem.createdAtItemId,
      ).toBe(
        existingItem.createdAtItemId,
      );
    },
  );

  it(
    "前後の空白を除去する",
    () => {
      const updatedItem =
        updateWishItem({
          item: existingItem,
          content:
            "  秋に箱根へ行く  ",
          displayName:
            "  山田  ",
        });

      expect(updatedItem.content).toBe(
        "秋に箱根へ行く",
      );

      expect(
        updatedItem.updatedByDisplayName,
      ).toBe("山田");
    },
  );

  it(
    "内容が空の場合はエラーになる",
    () => {
      expect(() =>
        updateWishItem({
          item: existingItem,
          content: "   ",
          displayName: "山田",
        }),
      ).toThrow(
        "やりたいことを入力してください",
      );
    },
  );

  it(
    "表示名が空の場合はエラーになる",
    () => {
      expect(() =>
        updateWishItem({
          item: existingItem,
          content: "秋に箱根へ行く",
          displayName: "   ",
        }),
      ).toThrow(
        "表示名を入力してください",
      );
    },
  );
});