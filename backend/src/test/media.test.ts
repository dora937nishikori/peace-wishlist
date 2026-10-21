import { describe, expect, it, vi } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { hashAccessToken } from "../accessToken";
import { createWishItem } from "../createWishItem";
import { updateWishItem } from "../updateWishItem";
import { isPublicAddress, parsePreview, publicWebUrl } from "../linkPreview";
import { createLinkPreviewHandler } from "../linkPreviewHandler";
import { createPhotosHandler } from "../photosHandler";
import { validatePhoto, validPhotoKey, type PhotoStore } from "../photoStore";
import { presentItem, presentSummary } from "../wishItemResponse";
import type { GroupRepository } from "../groupRepository";
import type { WishItemRepository } from "../wishItemRepository";
import { createWishItemUpdateInput } from "../dynamoDbWishItemRepository";

const group = {
  groupId: "group-a",
  groupName: "家族",
  createdByDisplayName: "あおい",
  createdAt: "",
  accessTokenHash: hashAccessToken("test-token"),
};
const groups: GroupRepository = {
  save: async () => {},
  findById: async (id) => (id === group.groupId ? group : null),
};
const key = "uploads/group-a/item-a/12345678-1234-1234-1234-123456789abc";
const event = (
  path: string,
  body: object,
  token = "test-token",
  method = "POST",
) =>
  ({
    rawPath: path,
    headers: { authorization: `Bearer ${token}` },
    pathParameters: {
      groupId: "group-a",
      itemId: "item-a",
      photoId: "photo-a",
    },
    requestContext: { http: { method } },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  }) as unknown as APIGatewayProxyEventV2;

function setup() {
  let item = {
    ...createWishItem({
      groupId: "group-a",
      content: "海に行く",
      displayName: "あおい",
    }),
    itemId: "item-a",
    status: "memory" as const,
  };
  const repository: WishItemRepository = {
    save: async () => {},
    findById: async () => item,
    findByGroupId: async () => [item],
    delete: async () => {},
    update: vi.fn(async (next) => {
      item = next as typeof item;
    }),
  };
  const store: PhotoStore = {
    createUpload: vi.fn(async () => ({
      key,
      url: "https://s3.example/upload",
      method: "POST" as const,
      fields: {},
    })),
    commit: vi.fn(async () => "photos/group-a/item-a/final"),
    url: vi.fn(async () => "https://s3.example/photo?signed=true"),
    delete: vi.fn(async () => {}),
  };
  return {
    repository,
    store,
    get item() {
      return item;
    },
  };
}

describe("URL previews", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.1",
    "172.16.0.1",
    "0.0.0.0",
    "::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "100.64.0.1",
  ])("rejects non-public IP %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
  it.each([
    "http://127.0.0.1",
    "http://2130706433",
    "http://[::1]",
    "file:///etc/passwd",
    "https://user:pass@example.com",
    "http://example.com:8080",
    "http://localhost",
    "http://app.internal",
  ])("rejects unsafe URL %s", (url) => {
    expect(() => publicWebUrl(url)).toThrow();
  });
  it("allows public addresses and normalizes URLs", () => {
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(publicWebUrl("example.com/path#secret").href).toBe(
      "https://example.com/path",
    );
  });
  it("extracts escaped OG titles and relative images without executing HTML", () => {
    expect(
      parsePreview(
        '<title>fallback</title><meta content="海 &amp; カフェ" property="og:title"><meta property="og:image" content="/cover.jpg">',
        "https://example.com/cafe",
      ),
    ).toEqual({
      title: "海 & カフェ",
      imageUrl: "https://example.com/cover.jpg",
      url: "https://example.com/cafe",
    });
  });
  it("keeps the title when an image is invalid or private", () => {
    expect(
      parsePreview(
        '<title>カフェ</title><meta property="og:image" content="http://127.0.0.1/x">',
        "https://example.com",
      ).imageUrl,
    ).toBe("");
  });
  it("never fetches a URL before checking group access", async () => {
    const fetcher = vi.fn();
    const handler = createLinkPreviewHandler(groups, fetcher);
    expect(
      (
        await handler(
          event(
            "/groups/group-a/link-preview",
            { url: "https://example.com" },
            "wrong",
          ),
        )
      ).statusCode,
    ).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("memories", () => {
  it("moves legacy items to memories, validates dates, and preserves photos when restored", () => {
    const original = createWishItem({
      groupId: "g",
      content: "餃子を作る",
      displayName: "あおい",
    });
    const memory = updateWishItem({
      item: original,
      content: original.content,
      displayName: "あおい",
      status: "memory",
      completedAt: "2026-10-21",
    });
    expect(memory.status).toBe("memory");
    expect(memory.completedAt).toBe("2026-10-21");
    expect(() =>
      updateWishItem({
        item: memory,
        content: memory.content,
        displayName: "あおい",
        completedAt: "2026-02-31",
      }),
    ).toThrow();
    const restored = updateWishItem({
      item: {
        ...memory,
        photos: [{ id: "p", key: "private", createdAt: "", addedBy: "あおい" }],
      },
      content: memory.content,
      displayName: "あおい",
      status: "wish",
    });
    expect(restored.completedAt).toBe("");
    expect(restored.photos).toHaveLength(1);
  });
  it("uses optimistic locking to protect concurrent photo and content changes", () => {
    const { item } = setup();
    const input = createWishItemUpdateInput("table", item, "previous");
    expect(input.ConditionExpression).toContain(
      "#updatedAt = :expectedUpdatedAt",
    );
    expect(input.ExpressionAttributeValues?.[":expectedUpdatedAt"]).toBe(
      "previous",
    );
  });
});

describe("private photo uploads", () => {
  it("allows photos on wishes and keeps the same cover after completion", async () => {
    const state = setup();
    await state.repository.update({ ...state.item, status: "wish" });
    const handler = createPhotosHandler(groups, state.repository, state.store);
    const upload = await handler(
      event("/photos/upload", { contentType: "image/jpeg", size: 500 }),
    );
    expect(upload.statusCode).toBe(200);
    const result = await handler(
      event("/photos", { key, displayName: "あおい" }),
    );
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body!).status).toBe("wish");
    expect(JSON.parse(result.body!).photos).toHaveLength(1);
    const before = await presentSummary(state.item, state.store);
    const after = await presentSummary(
      { ...state.item, status: "memory" },
      state.store,
    );
    expect(before.coverImageUrl).toContain("signed=true");
    expect(after.coverImageUrl).toBe(before.coverImageUrl);
    expect(after.photoCount).toBe(before.photoCount);
  });

  it("checks actual image bytes and group ownership", () => {
    expect(() =>
      validatePhoto(Buffer.from("<svg onload=alert(1)>"), "image/jpeg"),
    ).toThrow();
    expect(validPhotoKey(key, "group-a", "item-a")).toBe(true);
    expect(validPhotoKey(key, "group-b", "item-a")).toBe(false);
    expect(validPhotoKey(key + "/../../x", "group-a", "item-a")).toBe(false);
  });
  it("does not issue an upload URL to an unauthorized caller", async () => {
    const { repository, store } = setup();
    const result = await createPhotosHandler(
      groups,
      repository,
      store,
    )(
      event(
        "/photos/upload",
        { contentType: "image/jpeg", size: 500 },
        "wrong",
      ),
    );
    expect(result.statusCode).toBe(401);
    expect(store.createUpload).not.toHaveBeenCalled();
  });
  it("rejects excessive sizes and non-photo content", async () => {
    const { repository, store } = setup();
    const handler = createPhotosHandler(groups, repository, store);
    expect(
      (
        await handler(
          event("/photos/upload", { contentType: "image/svg+xml", size: 500 }),
        )
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await handler(
          event("/photos/upload", {
            contentType: "image/jpeg",
            size: 9 * 1024 * 1024,
          }),
        )
      ).statusCode,
    ).toBe(400);
    expect(store.createUpload).not.toHaveBeenCalled();
  });
  it("commits photos and returns signed URLs without leaking S3 object keys", async () => {
    const state = setup();
    const handler = createPhotosHandler(groups, state.repository, state.store);
    const result = await handler(
      event("/photos", { key, displayName: "あおい" }),
    );
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body!);
    expect(body.photos[0].url).toContain("signed=true");
    expect(body.photos[0]).not.toHaveProperty("key");
    expect(state.repository.update).toHaveBeenCalledWith(
      expect.objectContaining({ photos: expect.any(Array) }),
      expect.any(String),
    );
    // A lost HTTP response can be retried without adding a second photo.
    expect(
      (await handler(event("/photos", { key, displayName: "あおい" })))
        .statusCode,
    ).toBe(200);
    expect(state.store.commit).toHaveBeenCalledTimes(1);
  });
  it("removes the new object when a concurrent database update wins", async () => {
    const { repository, store } = setup();
    repository.update = async () => {
      const error = new Error();
      error.name = "ConditionalCheckFailedException";
      throw error;
    };
    const result = await createPhotosHandler(
      groups,
      repository,
      store,
    )(event("/photos", { key, displayName: "あおい" }));
    expect(result.statusCode).toBe(409);
    expect(store.delete).toHaveBeenCalledWith("photos/group-a/item-a/final");
  });
  it("uses the first memory photo on the list, while keeping the source cover editable", async () => {
    const { item, store } = setup();
    item.coverImageUrl = "https://example.com/cover.jpg";
    item.photos = [
      { id: "p", key: "private", addedBy: "あおい", createdAt: "" },
    ];
    expect((await presentSummary(item, store)).coverImageUrl).toContain(
      "signed=true",
    );
    expect((await presentItem(item, store)).coverImageUrl).toBe(
      "https://example.com/cover.jpg",
    );
  });
});
