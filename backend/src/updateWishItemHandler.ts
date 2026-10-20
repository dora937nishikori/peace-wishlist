import { S3PhotoStore, type PhotoStore } from "./photoStore";
import { presentItem, presentSummary } from "./wishItemResponse";
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

import {
  toWishItemResponse,
} from "./wishItemResponse.js";

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
  comment?: string;
  url?: string;
  displayName: string;
  coverImageUrl?: string;
  status?: "wish" | "memory";
  completedAt?: string;
  expectedUpdatedAt?: string;
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
      === "string" &&
    (record.comment === undefined ||
      typeof record.comment === "string") &&
    (record.url === undefined ||
      typeof record.url === "string") &&
    (record.coverImageUrl === undefined || typeof record.coverImageUrl === "string") &&
    (record.status === undefined || record.status === "wish" || record.status === "memory") &&
    (record.completedAt === undefined || typeof record.completedAt === "string") &&
    (record.expectedUpdatedAt === undefined || typeof record.expectedUpdatedAt === "string")
  );
}

export function createUpdateWishItemHandler(
  groupRepository:
    GroupRepository,
  wishItemRepository:
    WishItemRepository,
  photoStore: PhotoStore | undefined = process.env.PHOTOS_BUCKET_NAME ? new S3PhotoStore(process.env.PHOTOS_BUCKET_NAME) : undefined,
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
          ...requestBody,
          item:
            existingItem,
          content:
            requestBody.content,
          comment:
            requestBody.comment,
          url:
            requestBody.url,
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
          requestBody.expectedUpdatedAt ?? existingItem.updatedAt,
        );
    } catch (error) {
      if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
        return createJsonResponse(409, { message: "ほかのメンバーが更新しました。読み込み直してからお試しください" });
      }
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
      await presentItem(updatedItem, photoStore),
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
