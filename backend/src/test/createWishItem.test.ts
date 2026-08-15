import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createWishItem,
} from "../createWishItem";

describe("createWishItem", () => {
  it(
    "有効な入力からItemを作成できる",
    () => {
      const item = createWishItem({
        groupId: "group-001",
        content: "箱根に行く",
        displayName: "こり",
      });

      expect(item.groupId).toBe(
        "group-001",
      );

      expect(item.itemId).not.toBe("");

      expect(item.content).toBe(
        "箱根に行く",
      );

      expect(
        item.createdByDisplayName,
      ).toBe("こり");

      expect(
        item.updatedByDisplayName,
      ).toBe("こり");

      expect(item.createdAt).toBe(
        item.updatedAt,
      );

      expect(
        item.createdAtItemId,
      ).toBe(
        `${item.createdAt}#${item.itemId}`,
      );
    },
  );

  it(
    "入力値の前後の空白を除去する",
    () => {
      const item = createWishItem({
        groupId: "group-001",
        content: "  箱根に行く  ",
        displayName: "  こり  ",
      });

      expect(item.content).toBe(
        "箱根に行く",
      );

      expect(
        item.createdByDisplayName,
      ).toBe("こり");
    },
  );

  it(
    "内容が空の場合はエラーになる",
    () => {
      expect(() =>
        createWishItem({
          groupId: "group-001",
          content: "   ",
          displayName: "こり",
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
        createWishItem({
          groupId: "group-001",
          content: "箱根に行く",
          displayName: "   ",
        }),
      ).toThrow(
        "表示名を入力してください",
      );
    },
  );
});