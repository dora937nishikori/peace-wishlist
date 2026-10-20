const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type Group = {
  groupId: string;
  groupName: string;
  createdByDisplayName: string;
  createdAt: string;
};

export type WishItemSummary = {
  groupId: string;
  itemId: string;
  content: string;
  createdByDisplayName: string;
  updatedByDisplayName: string;
  createdAt: string;
  updatedAt: string;
  coverImageUrl: string;
  status: "wish" | "memory";
  completedAt: string;
  photoCount: number;
};

export type Photo = {
  id: string;
  url: string;
  createdAt: string;
  addedBy: string;
};

export type WishItem = WishItemSummary & {
  photos: Photo[];
  comment: string;
  url: string;
};

function normalizeWishItemResponse(value: unknown): WishItem {
  if (typeof value !== "object" || value === null) {
    throw new Error("やりたいことのデータ形式が正しくありません。");
  }

  const record = value as Record<string, unknown>;
  const requiredStringFields = [
    "groupId",
    "itemId",
    "content",
    "createdByDisplayName",
    "updatedByDisplayName",
    "createdAt",
    "updatedAt",
  ] as const;

  if (requiredStringFields.some((field) => typeof record[field] !== "string")) {
    throw new Error("やりたいことのデータ形式が正しくありません。");
  }

  return {
    groupId: record.groupId as string,
    itemId: record.itemId as string,
    content: record.content as string,
    coverImageUrl:
      typeof record.coverImageUrl === "string" ? record.coverImageUrl : "",
    status: record.status === "memory" ? "memory" : "wish",
    completedAt:
      typeof record.completedAt === "string" ? record.completedAt : "",
    photoCount: typeof record.photoCount === "number" ? record.photoCount : 0,
    photos: Array.isArray(record.photos)
      ? record.photos.filter((photo): photo is Photo =>
          Boolean(
            photo &&
            typeof photo.id === "string" &&
            typeof photo.url === "string",
          ),
        )
      : [],
    comment: typeof record.comment === "string" ? record.comment : "",
    url: typeof record.url === "string" ? record.url : "",
    createdByDisplayName: record.createdByDisplayName as string,
    updatedByDisplayName: record.updatedByDisplayName as string,
    createdAt: record.createdAt as string,
    updatedAt: record.updatedAt as string,
  };
}

export type CreateGroupInput = {
  groupName: string;
  createdByDisplayName: string;
};

export type CreateGroupResponse = {
  groupId: string;
  groupName: string;
  createdByDisplayName: string;
  createdAt: string;
  accessToken: string;
};

export type CreateWishItemInput = {
  coverImageUrl?: string;
  content: string;
  comment: string;
  url: string;
  displayName: string;
};

export type UpdateWishItemInput = {
  coverImageUrl?: string;
  status?: "wish" | "memory";
  completedAt?: string;
  expectedUpdatedAt?: string;
  content: string;
  comment: string;
  url: string;
  displayName: string;
};

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();

    if (typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // JSONでなければ下のデフォルトメッセージを使う
  }

  return `HTTPエラー: ${response.status}`;
}

export async function createGroup(
  input: CreateGroupInput,
): Promise<CreateGroupResponse> {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    method: "POST",

    headers: {
      "content-type": "application/json",
    },

    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function getGroup(
  groupId: string,
  accessToken: string,
): Promise<Group> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(groupId)}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function getWishItems(
  groupId: string,
  accessToken: string,
): Promise<WishItemSummary[]> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(groupId)}/items`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body: {
    items: WishItemSummary[];
  } = await response.json();

  return body.items.map((item) => ({
    ...item,
    status: item.status ?? "wish",
    coverImageUrl: item.coverImageUrl ?? "",
    completedAt: item.completedAt ?? "",
    photoCount: item.photoCount ?? 0,
  }));
}

export async function getWishItem(
  groupId: string,
  itemId: string,
  accessToken: string,
): Promise<WishItem> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(
      groupId,
    )}/items/${encodeURIComponent(itemId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return normalizeWishItemResponse(await response.json());
}

export async function createWishItem(
  groupId: string,
  accessToken: string,
  input: CreateWishItemInput,
): Promise<WishItem> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(groupId)}/items`,
    {
      method: "POST",

      headers: {
        "content-type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },

      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return normalizeWishItemResponse(await response.json());
}

export async function updateWishItem(
  groupId: string,
  itemId: string,
  accessToken: string,
  input: UpdateWishItemInput,
): Promise<WishItem> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(
      groupId,
    )}/items/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",

      headers: {
        "content-type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },

      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return normalizeWishItemResponse(await response.json());
}

export async function deleteWishItem(
  groupId: string,
  itemId: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(
      groupId,
    )}/items/${encodeURIComponent(itemId)}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

async function mediaRequest(
  groupId: string,
  token: string,
  path: string,
  body?: object,
  method = "POST",
) {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(groupId)}${path}`,
    {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return response.json();
}

export async function getLinkPreview(
  groupId: string,
  token: string,
  url: string,
): Promise<{ title: string; imageUrl: string; url: string }> {
  return mediaRequest(groupId, token, "/link-preview", { url });
}

export async function uploadPhoto(
  groupId: string,
  itemId: string,
  token: string,
  file: File,
  displayName: string,
): Promise<WishItem> {
  const path = `/items/${encodeURIComponent(itemId)}/photos`;
  const upload: {
    key: string;
    url: string;
    fields: Record<string, string>;
    method: "POST" | "PUT";
  } = await mediaRequest(groupId, token, `${path}/upload`, {
    contentType: file.type,
    size: file.size,
  });
  let body: FormData | File = file;
  if (upload.method === "POST") {
    body = new FormData();
    Object.entries(upload.fields).forEach(([key, value]) =>
      (body as FormData).append(key, value),
    );
    body.append("file", file);
  }
  const response = await fetch(upload.url, { method: upload.method, body });
  if (!response.ok)
    throw new Error("写真を送信できませんでした。もう一度お試しください。");
  return normalizeWishItemResponse(
    await mediaRequest(groupId, token, path, { key: upload.key, displayName }),
  );
}

export async function deletePhoto(
  groupId: string,
  itemId: string,
  photoId: string,
  token: string,
): Promise<WishItem> {
  return normalizeWishItemResponse(
    await mediaRequest(
      groupId,
      token,
      `/items/${encodeURIComponent(itemId)}/photos/${encodeURIComponent(photoId)}`,
      undefined,
      "DELETE",
    ),
  );
}
