import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import {
  verifyAccessToken,
} from "./accessToken";

import {
  DynamoDbGroupRepository,
} from "./dynamoDbGroupRepository";

import {
  DynamoDbWishItemRepository,
} from "./dynamoDbWishItemRepository";

import type {
  GroupRepository,
} from "./groupRepository";

import {
  updateWishItem,
} from "./updateWishItem";

import type {
  WishItemRepository,
} from "./wishItemRepository";

type Handler = (
  event: APIGatewayProxyEventV2,
) => Promise<APIGatewayProxyStructuredResultV2>;

function createJsonResponse(
  statusCode: number,
  body: object,
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      "content-type":
        "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

function extractBearerToken(
  authorizationHeader:
    string | undefined,
): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] =
    authorizationHeader.split(" ");

  if (
    scheme?.toLowerCase()
      !== "bearer" ||
    !token
  ) {
    return null;
  }

  return token;
}

function isUpdateInput(
  value: unknown,
): value is {
  content: string;
  displayName: string;
} {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof record.content
      === "string" &&
    typeof record.displayName
      === "string"
  );
}

export function createUpdateWishItemHandler(
  groupRepository:
    GroupRepository,
  wishItemRepository:
    WishItemRepository,
): Handler {
  return async (
    event:
      APIGatewayProxyEventV2,
  ) => {
    const groupId =
      event.pathParameters
        ?.groupId;

    const itemId =
      event.pathParameters
        ?.itemId;

    if (!groupId || !itemId) {
      return createJsonResponse(
        400,
        {
          message:
            "グループIDとItem IDが必要です",
        },
      );
    }

    const accessToken =
      extractBearerToken(
        event.headers
          .authorization,
      );

    if (!accessToken) {
      return createJsonResponse(
        401,
        {
          message:
            "アクセストークンが必要です",
        },
      );
    }

    const group =
      await groupRepository
        .findById(groupId);

    if (!group) {
      return createJsonResponse(
        404,
        {
          message:
            "グループが見つかりません",
        },
      );
    }

    if (
      !verifyAccessToken(
        accessToken,
        group.accessTokenHash,
      )
    ) {
      return createJsonResponse(
        401,
        {
          message:
            "アクセストークンが正しくありません",
        },
      );
    }

    const existingItem =
      await wishItemRepository
        .findById(
          groupId,
          itemId,
        );

    if (!existingItem) {
      return createJsonResponse(
        404,
        {
          message:
            "やりたいことが見つかりません",
        },
      );
    }

    if (!event.body) {
      return createJsonResponse(
        400,
        {
          message:
            "リクエストボディが必要です",
        },
      );
    }

    let requestBody:
      unknown;

    try {
      requestBody =
        JSON.parse(
          event.body,
        );
    } catch {
      return createJsonResponse(
        400,
        {
          message:
            "JSONの形式が正しくありません",
        },
      );
    }

    if (
      !isUpdateInput(
        requestBody,
      )
    ) {
      return createJsonResponse(
        400,
        {
          message:
            "やりたいことと表示名を文字列で指定してください",
        },
      );
    }

    let updatedItem;

    try {
      updatedItem =
        updateWishItem({
          item:
            existingItem,
          content:
            requestBody.content,
          displayName:
            requestBody
              .displayName,
        });
    } catch (error) {
      if (
        error instanceof Error
      ) {
        return createJsonResponse(
          400,
          {
            message:
              error.message,
          },
        );
      }

      return createJsonResponse(
        400,
        {
          message:
            "入力内容が正しくありません",
        },
      );
    }

    try {
      await wishItemRepository
        .update(
          updatedItem,
        );
    } catch (error) {
      console.error(
        "やりたいことの更新に失敗しました",
        error,
      );

      return createJsonResponse(
        500,
        {
          message:
            "やりたいことの更新に失敗しました",
        },
      );
    }

    return createJsonResponse(
      200,
      updatedItem,
    );
  };
}

let configuredHandler:
  | Handler
  | undefined;

function getConfiguredHandler():
  | Handler
  | undefined {
  if (configuredHandler) {
    return configuredHandler;
  }

  const groupsTableName =
    process.env
      .GROUPS_TABLE_NAME;

  const wishItemsTableName =
    process.env
      .WISH_ITEMS_TABLE_NAME;

  if (
    !groupsTableName ||
    !wishItemsTableName
  ) {
    return undefined;
  }

  configuredHandler =
    createUpdateWishItemHandler(
      new DynamoDbGroupRepository(
        groupsTableName,
      ),
      new DynamoDbWishItemRepository(
        wishItemsTableName,
      ),
    );

  return configuredHandler;
}

export async function handler(
  event:
    APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const currentHandler =
    getConfiguredHandler();

  if (!currentHandler) {
    return createJsonResponse(
      500,
      {
        message:
          "サーバーの設定が不足しています",
      },
    );
  }

  return currentHandler(
    event,
  );
}