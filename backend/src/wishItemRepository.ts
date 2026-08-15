import type { WishItem } from "./createWishItem";

export interface WishItemRepository {
  save(item: WishItem): Promise<void>;

  findByGroupId(
    groupId: string,
  ): Promise<WishItem[]>;

  findById(
    groupId: string,
    itemId: string,
  ): Promise<WishItem | null>;

  update(
    item: WishItem,
  ): Promise<void>;

  delete(
    groupId: string,
    itemId: string,
  ): Promise<void>;
}