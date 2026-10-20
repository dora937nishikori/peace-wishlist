import { randomUUID } from "node:crypto";
import type { Photo } from "./photoStore";

import {
  normalizeWishItemFields,
} from "./wishItemFields";

export type CreateWishItemInput = {
  groupId: string;
  content: string;
  comment?: string;
  url?: string;
  coverImageUrl?: string;
  displayName: string;
};

export type WishItem = {
  groupId: string;
  itemId: string;
  content: string;
  comment?: string;
  url?: string;
  coverImageUrl?: string;
  status?: "wish" | "memory";
  completedAt?: string;
  photos?: Photo[];
  createdByDisplayName: string;
  updatedByDisplayName: string;
  createdAt: string;
  updatedAt: string;
  createdAtItemId: string;
};

export function createWishItem(
  input: CreateWishItemInput,
): WishItem {
  const fields = normalizeWishItemFields(input);
  const displayName = input.displayName.trim();

  if (displayName.length === 0) {
    throw new Error(
      "表示名を入力してください",
    );
  }

  const now = new Date().toISOString();
  const itemId = randomUUID();

  return {
    groupId: input.groupId,
    itemId,
    ...fields,
    status: "wish",
    completedAt: "",
    photos: [],
    createdByDisplayName: displayName,
    updatedByDisplayName: displayName,
    createdAt: now,
    updatedAt: now,
    createdAtItemId: `${now}#${itemId}`,
  };
}
