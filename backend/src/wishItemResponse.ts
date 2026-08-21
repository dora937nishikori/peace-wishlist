import type {
  WishItem,
} from "./createWishItem.js";

export type WishItemResponse = {
  groupId: string;
  itemId: string;
  content: string;

  createdByDisplayName: string;
  updatedByDisplayName: string;

  createdAt: string;
  updatedAt: string;
};

export function toWishItemResponse(
  item: WishItem,
): WishItemResponse {
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