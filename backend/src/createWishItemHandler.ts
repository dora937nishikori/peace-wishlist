import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import { verifyAccessToken } from "./accessToken";
import {
  createWishItem,
  type CreateWishItemInput,
} from "./createWishItem";
import { DynamoDbGroupRepository } from
  "./dynamoDbGroupRepository";
import { DynamoDbWishItemRepository } from
  "./dynamoDbWishItemRepository";
import type { GroupRepository } from
  "./groupRepository";
import type { WishItemRepository } from
  "./wishItemRepository";
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
  authorizationHeader: string | undefined,
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

function isCreateWishItemInput(
  value: unknown,
): value is Omit<
  CreateWishItemInput,
  "groupId"
> {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const record =
    value as Record<string, unknown>;

  return (
    typeof record.content === "string" &&
    typeof record.displayName === "string"
  );
}

export function createWishItemHandler(
  groupRepository: GroupRepository,
  wishItemRepository: WishItemRepository,
): Handler {
  return async (
    event: APIGatewayProxyEventV2,
  ) => {
    const groupId =
      event.pathParameters?.groupId;

    if (!groupId) {
      return createJsonResponse(400, {
        message: "グループIDが必要です",
      });
    }

    const accessToken = extractBearerToken(
      event.headers.authorization,
    );

    if (!accessToken) {
      return createJsonResponse(401, {
        message:
          "アクセストークンが必要です",
      });
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

      return createJsonResponse(500, {
        message:
          "グループの取得に失敗しました",
      });
    }

    if (!group) {
      return createJsonResponse(404, {
        message:
          "グループが見つかりません",
      });
    }

    if (
      !verifyAccessToken(
        accessToken,
        group.accessTokenHash,
      )
    ) {
      return createJsonResponse(401, {
        message:
          "アクセストークンが正しくありません",
      });
    }

    if (!event.body) {
      return createJsonResponse(400, {
        message:
          "リクエストボディが必要です",
      });
    }

    let requestBody: unknown;

    try {
      requestBody = JSON.parse(event.body);
    } catch {
      return createJsonResponse(400, {
        message:
          "JSONの形式が正しくありません",
      });
    }

    if (
      !isCreateWishItemInput(requestBody)
    ) {
      return createJsonResponse(400, {
        message:
          "やりたいことと表示名を文字列で指定してください",
      });
    }

    let item;

    try {
      item = createWishItem({
        groupId,
        ...requestBody,
      });
    } catch (error) {
      if (error instanceof Error) {
        return createJsonResponse(400, {
          message: error.message,
        });
      }

      return createJsonResponse(400, {
        message:
          "入力内容が正しくありません",
      });
    }

    try {
      await wishItemRepository.save(item);
    } catch (error) {
      console.error(
        "やりたいことの保存に失敗しました",
        error,
      );

      return createJsonResponse(500, {
        message:
          "やりたいことの登録に失敗しました",
      });
    }

    return createJsonResponse(201, toWishItemResponse(item));
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
    createWishItemHandler(
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
    return createJsonResponse(500, {
      message:
        "サーバーの設定が不足しています",
    });
  }

  return currentHandler(event);
}