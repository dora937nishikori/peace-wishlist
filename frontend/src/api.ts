const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

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
};

export type WishItem = WishItemSummary & {
  comment: string;
  url: string;
};

function normalizeWishItemResponse(
  value: unknown,
): WishItem {
  if (typeof value !== "object" || value === null) {
    throw new Error(
      "やりたいことのデータ形式が正しくありません。",
    );
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

  if (
    requiredStringFields.some(
      (field) => typeof record[field] !== "string",
    )
  ) {
    throw new Error(
      "やりたいことのデータ形式が正しくありません。",
    );
  }

  return {
    groupId: record.groupId as string,
    itemId: record.itemId as string,
    content: record.content as string,
    comment:
      typeof record.comment === "string"
        ? record.comment
        : "",
    url:
      typeof record.url === "string"
        ? record.url
        : "",
    createdByDisplayName:
      record.createdByDisplayName as string,
    updatedByDisplayName:
      record.updatedByDisplayName as string,
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
  content: string;
  comment: string;
  url: string;
  displayName: string;
};

export type UpdateWishItemInput = {
  content: string;
  comment: string;
  url: string;
  displayName: string;
};

async function getErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const body = await response.json();

    if (
      typeof body.message === "string"
    ) {
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
  const response = await fetch(
    `${API_BASE_URL}/groups`,
    {
      method: "POST",

      headers: {
        "content-type":
          "application/json",
      },

      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}

export async function getGroup(
  groupId: string,
  accessToken: string,
): Promise<Group> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(
      groupId,
    )}`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}

export async function getWishItems(
  groupId: string,
  accessToken: string,
): Promise<WishItemSummary[]> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(
      groupId,
    )}/items`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const body: {
    items: WishItemSummary[];
  } = await response.json();

  return body.items;
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
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return normalizeWishItemResponse(
    await response.json(),
  );
}

export async function createWishItem(
  groupId: string,
  accessToken: string,
  input: CreateWishItemInput,
): Promise<WishItem> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(
      groupId,
    )}/items`,
    {
      method: "POST",

      headers: {
        "content-type":
          "application/json",

        Authorization:
          `Bearer ${accessToken}`,
      },

      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return normalizeWishItemResponse(
    await response.json(),
  );
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
    )}/items/${encodeURIComponent(
      itemId,
    )}`,
    {
      method: "PATCH",

      headers: {
        "content-type":
          "application/json",

        Authorization:
          `Bearer ${accessToken}`,
      },

      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return normalizeWishItemResponse(
    await response.json(),
  );
}

export async function deleteWishItem(
  groupId: string,
  itemId: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${encodeURIComponent(
      groupId,
    )}/items/${encodeURIComponent(
      itemId,
    )}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
}
