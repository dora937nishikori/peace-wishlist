import { randomUUID } from "node:crypto";

export type CreateWishItemInput = {
  groupId: string;
  content: string;
  displayName: string;
};

export type WishItem = {
  groupId: string;
  itemId: string;
  content: string;
  createdByDisplayName: string;
  updatedByDisplayName: string;
  createdAt: string;
  updatedAt: string;
  createdAtItemId: string;
};

export function createWishItem(
  input: CreateWishItemInput,
): WishItem {
  const content = input.content.trim();
  const displayName = input.displayName.trim();

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

  const now = new Date().toISOString();
  const itemId = randomUUID();

  return {
    groupId: input.groupId,
    itemId,
    content,
    createdByDisplayName: displayName,
    updatedByDisplayName: displayName,
    createdAt: now,
    updatedAt: now,
    createdAtItemId: `${now}#${itemId}`,
  };
}