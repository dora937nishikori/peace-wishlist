import type {
  WishItem,
} from "./createWishItem.js";

export type WishItemResponse = {
  groupId: string;
  itemId: string;
  content: string;
  comment: string;
  url: string;

  createdByDisplayName: string;
  updatedByDisplayName: string;

  createdAt: string;
  updatedAt: string;
};

export type WishItemSummaryResponse = Omit<
  WishItemResponse,
  "comment" | "url"
>;

export function toWishItemResponse(
  item: WishItem,
): WishItemResponse {
  return {
    groupId: item.groupId,
    itemId: item.itemId,
    content: item.content,
    comment: item.comment ?? "",
    url: item.url ?? "",

    createdByDisplayName:
      item.createdByDisplayName,

    updatedByDisplayName:
      item.updatedByDisplayName,

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function toWishItemSummaryResponse(
  item: WishItem,
): WishItemSummaryResponse {
  return {
    groupId: item.groupId,
    itemId: item.itemId,
    content: item.content,
    createdByDisplayName:
      item.createdByDisplayName,
    updatedByDisplayName:
      item.updatedByDisplayName,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
