import type { GroupRepository } from "./groupRepository";
import type { WishItemRepository } from "./wishItemRepository";
import { DynamoDbGroupRepository } from "./dynamoDbGroupRepository";
import { DynamoDbWishItemRepository } from "./dynamoDbWishItemRepository";
import { authorizeGroup, HttpError, json, readBody, withErrors } from "./http";
import {
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
  PHOTO_TYPES,
  S3PhotoStore,
  validPhotoKey,
  type PhotoStore,
} from "./photoStore";
import { presentItem } from "./wishItemResponse";

export function createPhotosHandler(
  groups: GroupRepository,
  items: WishItemRepository,
  store: PhotoStore,
) {
  return withErrors(async (event) => {
    const groupId = await authorizeGroup(event, groups);
    const itemId = event.pathParameters?.itemId;
    if (!itemId) throw new HttpError(400, "項目を指定してください");
    const item = await items.findById(groupId, itemId);
    if (!item) throw new HttpError(404, "思い出が見つかりません");
    const photoId = event.pathParameters?.photoId;
    const photos = item.photos ?? [];

    if (event.requestContext.http.method === "DELETE") {
      const photo = photos.find((entry) => entry.id === photoId);
      if (!photo) throw new HttpError(404, "写真が見つかりません");
      const updated = {
        ...item,
        photos: photos.filter((entry) => entry.id !== photoId),
        updatedAt: new Date().toISOString(),
      };
      await items.update(updated, item.updatedAt);
      // Removing the database reference first makes retries safe.
      await store
        .delete(photo.key)
        .catch(() => console.error("Photo object cleanup failed"));
      return json(200, await presentItem(updated, store));
    }

    if (item.status !== "memory")
      throw new HttpError(
        400,
        "「思い出に残す」を選んでから写真を追加してください",
      );
    const body = readBody(event);
    if (event.rawPath.endsWith("/photos/upload")) {
      if (photos.length >= MAX_PHOTOS)
        throw new HttpError(
          400,
          `写真は1つの思い出につき${MAX_PHOTOS}枚まで追加できます`,
        );

      if (
        typeof body.contentType !== "string" ||
        !PHOTO_TYPES.includes(
          body.contentType as (typeof PHOTO_TYPES)[number],
        ) ||
        typeof body.size !== "number" ||
        !Number.isInteger(body.size) ||
        body.size < 12 ||
        body.size > MAX_PHOTO_BYTES
      ) {
        throw new HttpError(
          400,
          "8MB以内のJPEG・PNG・WebPの写真を選んでください",
        );
      }
      return json(
        200,
        await store.createUpload(groupId, itemId, body.contentType),
      );
    }
    if (
      !validPhotoKey(body.key, groupId, itemId) ||
      typeof body.displayName !== "string" ||
      !body.displayName.trim() ||
      body.displayName.length > 30
    ) {
      throw new HttpError(400, "写真の情報が正しくありません");
    }
    const id = body.key.split("/").at(-1)!;
    if (photos.some((photo) => photo.id === id))
      return json(200, await presentItem(item, store));
    if (photos.length >= MAX_PHOTOS)
      throw new HttpError(
        400,
        `写真は1つの思い出につき${MAX_PHOTOS}枚まで追加できます`,
      );
    let key: string;
    try {
      key = await store.commit(body.key);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(
        400,
        "写真をアップロードできませんでした。もう一度選んでください",
      );
    }
    const now = new Date().toISOString();
    const updated = {
      ...item,
      photos: [
        ...photos,
        { id, key, addedBy: body.displayName.trim(), createdAt: now },
      ],
      updatedAt: now,
      updatedByDisplayName: body.displayName.trim(),
    };
    try {
      await items.update(updated, item.updatedAt);
    } catch (error) {
      await store.delete(key).catch(() => undefined);
      throw error;
    }
    await store.delete(body.key).catch(() => undefined);
    return json(201, await presentItem(updated, store));
  });
}

export const handler = createPhotosHandler(
  new DynamoDbGroupRepository(process.env.GROUPS_TABLE_NAME ?? ""),
  new DynamoDbWishItemRepository(process.env.WISH_ITEMS_TABLE_NAME ?? ""),
  new S3PhotoStore(process.env.PHOTOS_BUCKET_NAME ?? ""),
);
