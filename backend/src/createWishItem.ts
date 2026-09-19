import { randomUUID } from "node:crypto";

import {
  normalizeWishItemFields,
} from "./wishItemFields";

export type CreateWishItemInput = {
  groupId: string;
  content: string;
  comment?: string;
  url?: string;
  displayName: string;
};

export type WishItem = {
  groupId: string;
  itemId: string;
  content: string;
  comment?: string;
  url?: string;
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
    createdByDisplayName: displayName,
    updatedByDisplayName: displayName,
    createdAt: now,
    updatedAt: now,
    createdAtItemId: `${now}#${itemId}`,
  };
}
