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
    scheme?.toLowerCase() !== "bearer" ||
    !token
  ) {
    return null;
  }

  return token;
}

export function createDeleteWishItemHandler(
  groupRepository:
    GroupRepository,
  wishItemRepository:
    WishItemRepository,
): Handler {
  return async (
    event: APIGatewayProxyEventV2,
  ) => {
    const groupId =
      event.pathParameters?.groupId;

    const itemId =
      event.pathParameters?.itemId;

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
        event.headers.authorization,
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

    let group;

    try {
      group =
        await groupRepository.findById(
          groupId,
        );
    } catch (error) {
      console.error(
        "グループの取得に失敗しました",
        error,
      );

      return createJsonResponse(
        500,
        {
          message:
            "グループの取得に失敗しました",
        },
      );
    }

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

    let item;

    try {
      item =
        await wishItemRepository.findById(
          groupId,
          itemId,
        );
    } catch (error) {
      console.error(
        "やりたいことの取得に失敗しました",
        error,
      );

      return createJsonResponse(
        500,
        {
          message:
            "やりたいことの取得に失敗しました",
        },
      );
    }

    if (!item) {
      return createJsonResponse(
        404,
        {
          message:
            "やりたいことが見つかりません",
        },
      );
    }

    try {
      await wishItemRepository.delete(
        groupId,
        itemId,
      );
    } catch (error) {
      console.error(
        "やりたいことの削除に失敗しました",
        error,
      );

      return createJsonResponse(
        500,
        {
          message:
            "やりたいことの削除に失敗しました",
        },
      );
    }

    return {
      statusCode: 204,
    };
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
    process.env.GROUPS_TABLE_NAME;

  const wishItemsTableName =
    process.env.WISH_ITEMS_TABLE_NAME;

  if (
    !groupsTableName ||
    !wishItemsTableName
  ) {
    return undefined;
  }

  configuredHandler =
    createDeleteWishItemHandler(
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
  event: APIGatewayProxyEventV2,
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

  return currentHandler(event);
}