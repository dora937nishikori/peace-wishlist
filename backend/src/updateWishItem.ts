import type {
  WishItem,
} from "./createWishItem";

export type UpdateWishItemInput = {
  item: WishItem;
  content: string;
  displayName: string;
};

export function updateWishItem(
  input: UpdateWishItemInput,
): WishItem {
  const content =
    input.content.trim();

  const displayName =
    input.displayName.trim();

  if (content.length === 0) {
    throw new Error(
      "やりたいことを入力してください",
    );
  }

  if (displayName.length === 0) {
    throw new Error(
      "表示名を入力してください",
    );
  }

  return {
    ...input.item,

    content,

    updatedByDisplayName:
      displayName,

    updatedAt:
      new Date().toISOString(),
  };
}