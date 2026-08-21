const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

export type Group = {
  groupId: string;
  groupName: string;
  createdByDisplayName: string;
  createdAt: string;
};

export type WishItem = {
  groupId: string;
  itemId: string;
  content: string;
  createdByDisplayName: string;
  updatedByDisplayName: string;
  createdAt: string;
  updatedAt: string;
};

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
  displayName: string;
};

export type UpdateWishItemInput = {
  content: string;
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
): Promise<WishItem[]> {
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
    items: WishItem[];
  } = await response.json();

  return body.items;
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

  return response.json();
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

  return response.json();
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