import type {
  WishItem,
} from "./createWishItem";
import {
  normalizeWishItemFields,
} from "./wishItemFields";

export type UpdateWishItemInput = {
  item: WishItem;
  content: string;
  comment?: string;
  url?: string;
  displayName: string;
};

export function updateWishItem(
  input: UpdateWishItemInput,
): WishItem {
  const fields = normalizeWishItemFields(input);

  const displayName =
    input.displayName.trim();

  if (displayName.length === 0) {
    throw new Error(
      "表示名を入力してください",
    );
  }

  return {
    ...input.item,

    ...fields,

    updatedByDisplayName:
      displayName,

    updatedAt:
      new Date().toISOString(),
  };
}
