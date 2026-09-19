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
        comment: "秋に行きたい",
        url: "example.com/hakone",
        displayName: "こり",
      });

      expect(item.groupId).toBe(
        "group-001",
      );

      expect(item.itemId).not.toBe("");

      expect(item.content).toBe(
        "箱根に行く",
      );

      expect(item.comment).toBe(
        "秋に行きたい",
      );

      expect(item.url).toBe(
        "https://example.com/hakone",
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

  it(
    "コメントとURLを省略した場合は空文字になる",
    () => {
      const item = createWishItem({
        groupId: "group-001",
        content: "箱根に行く",
        displayName: "こり",
      });

      expect(item.comment).toBe("");
      expect(item.url).toBe("");
    },
  );

  it(
    "httpとhttps以外のURLはエラーになる",
    () => {
      expect(() =>
        createWishItem({
          groupId: "group-001",
          content: "箱根に行く",
          url: "javascript:alert(1)",
          displayName: "こり",
        }),
      ).toThrow(
        "httpまたはhttpsのURLを入力してください",
      );
    },
  );
});
