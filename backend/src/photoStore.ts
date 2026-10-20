import { randomUUID } from "node:crypto";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HttpError } from "./http";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS = 50;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type Photo = {
  id: string;
  key: string;
  createdAt: string;
  addedBy: string;
};
export type Upload = {
  key: string;
  url: string;
  method: "POST" | "PUT";
  fields: Record<string, string>;
};

export interface PhotoStore {
  createUpload(
    groupId: string,
    itemId: string,
    contentType: string,
  ): Promise<Upload>;
  commit(key: string): Promise<string>;
  url(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export function validatePhoto(bytes: Uint8Array, contentType: string): void {
  const data = Buffer.from(bytes);
  const valid =
    contentType === "image/jpeg"
      ? data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
      : contentType === "image/png"
        ? data
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : contentType === "image/webp"
          ? data.toString("ascii", 0, 4) === "RIFF" &&
            data.toString("ascii", 8, 12) === "WEBP"
          : false;
  if (!valid || data.length < 12 || data.length > MAX_PHOTO_BYTES) {
    throw new HttpError(400, "8MB以内のJPEG・PNG・WebPの写真を選んでください");
  }
}

export function validPhotoKey(
  key: unknown,
  groupId: string,
  itemId: string,
): key is string {
  return (
    typeof key === "string" &&
    key.startsWith(`uploads/${groupId}/${itemId}/`) &&
    /^[a-f0-9-]{36}$/.test(key.split("/").at(-1) ?? "") &&
    key.split("/").length === 4
  );
}

export class S3PhotoStore implements PhotoStore {
  private client = new S3Client({});
  constructor(private bucket: string) {}

  async createUpload(
    groupId: string,
    itemId: string,
    contentType: string,
  ): Promise<Upload> {
    const key = `uploads/${groupId}/${itemId}/${randomUUID()}`;
    const upload = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: key,
      Expires: 300,
      Fields: { "Content-Type": contentType },
      Conditions: [
        ["content-length-range", 12, MAX_PHOTO_BYTES],
        ["eq", "$Content-Type", contentType],
      ],
    });
    return { key, url: upload.url, fields: upload.fields, method: "POST" };
  }

  async commit(key: string): Promise<string> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (
      !result.ContentLength ||
      result.ContentLength > MAX_PHOTO_BYTES ||
      !result.Body
    ) {
      throw new HttpError(400, "写真のサイズを確認してください");
    }
    const bytes = await result.Body.transformToByteArray();
    validatePhoto(bytes, result.ContentType ?? "");
    const finalKey = key
      .replace(/^uploads\//, "photos/")
      .replace(/[^/]+$/, randomUUID());
    // Upload a verified snapshot, rather than copying a key the presigned POST can still overwrite.
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: finalKey,
        Body: bytes,
        ContentType: result.ContentType,
        CacheControl: "private, max-age=3600",
      }),
    );
    return finalKey;
  }

  async url(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: 3600 },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
