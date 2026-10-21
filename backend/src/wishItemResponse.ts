import type { WishItem } from "./createWishItem.js";
import type { Photo, PhotoStore } from "./photoStore";

export type WishItemResponse = {
  groupId: string;
  itemId: string;
  content: string;
  comment: string;
  url: string;
  coverImageUrl: string;
  status: "wish" | "memory";
  completedAt: string;
  photoCount: number;
  photos: (Omit<Photo, "key"> & { url: string })[];

  createdByDisplayName: string;
  updatedByDisplayName: string;

  createdAt: string;
  updatedAt: string;
};

export type WishItemSummaryResponse = Omit<
  WishItemResponse,
  "comment" | "url" | "photos"
>;

export function toWishItemResponse(item: WishItem): WishItemResponse {
  return {
    groupId: item.groupId,
    itemId: item.itemId,
    content: item.content,
    comment: item.comment ?? "",
    url: item.url ?? "",
    coverImageUrl: item.coverImageUrl ?? "",
    status: item.status ?? "wish",
    completedAt: item.completedAt ?? "",
    photoCount: item.photos?.length ?? 0,
    photos: [],

    createdByDisplayName: item.createdByDisplayName,

    updatedByDisplayName: item.updatedByDisplayName,

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
    coverImageUrl: item.coverImageUrl ?? "",
    status: item.status ?? "wish",
    completedAt: item.completedAt ?? "",
    photoCount: item.photos?.length ?? 0,
    createdByDisplayName: item.createdByDisplayName,
    updatedByDisplayName: item.updatedByDisplayName,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function presentItem(
  item: WishItem,
  store?: PhotoStore,
): Promise<WishItemResponse> {
  const response = toWishItemResponse(item);
  if (store) {
    response.photos = await Promise.all(
      (item.photos ?? []).map(async ({ key, ...photo }) => ({
        ...photo,
        url: await store.url(key),
      })),
    );
  }
  return response;
}

export async function presentSummary(
  item: WishItem,
  store?: PhotoStore,
): Promise<WishItemSummaryResponse> {
  const response = toWishItemSummaryResponse(item);
  if (store && item.photos?.[0]) {
    response.coverImageUrl = await store.url(item.photos[0].key);
  }
  return response;
}
