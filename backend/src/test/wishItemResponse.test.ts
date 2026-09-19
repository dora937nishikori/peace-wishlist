import {
  describe,
  expect,
  it,
} from "vitest";

import type { WishItem } from "../createWishItem";
import {
  toWishItemResponse,
} from "../wishItemResponse";

describe("toWishItemResponse", () => {
  it(
    "既存データにコメントとURLがなくても空文字で返す",
    () => {
      const legacyItem: WishItem = {
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

      expect(toWishItemResponse(legacyItem)).toMatchObject({
        content: "箱根に行く",
        comment: "",
        url: "",
      });
    },
  );
});
