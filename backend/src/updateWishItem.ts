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
  coverImageUrl?: string;
  status?: "wish" | "memory";
  completedAt?: string;
  expectedUpdatedAt?: string;
  displayName: string;
};

export function updateWishItem(
  input: UpdateWishItemInput,
): WishItem {
  const fields = normalizeWishItemFields({
    ...input,
    coverImageUrl: input.coverImageUrl ?? input.item.coverImageUrl,
  });
  if (input.status !== undefined && input.status !== "wish" && input.status !== "memory") {
    throw new Error("状態が正しくありません");
  }
  const status = input.status ?? input.item.status ?? "wish";
  const completedAt = status === "memory"
    ? (input.completedAt ?? input.item.completedAt) || new Date().toISOString().slice(0, 10)
    : "";
  if (completedAt && (!/^\d{4}-\d{2}-\d{2}$/.test(completedAt) ||
      Number.isNaN(Date.parse(completedAt)) || new Date(completedAt).toISOString().slice(0, 10) !== completedAt)) {
    throw new Error("思い出の日付を確認してください");
  }

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
    status,
    completedAt,

    updatedByDisplayName:
      displayName,

    updatedAt:
      new Date().toISOString(),
  };
}
