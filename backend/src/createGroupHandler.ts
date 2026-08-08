import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import {
  createGroup,
  type CreateGroupInput,
  type CreateGroupResult,
} from "./createGroup";
import { DynamoDbGroupRepository } from
  "./dynamoDbGroupRepository";
import type { GroupRepository } from
  "./groupRepository";

type CreateGroupResponse = {
  groupId: string;
  groupName: string;
  createdByDisplayName: string;
  createdAt: string;
  accessToken: string;
};

type ErrorResponse = {
  message: string;
};

type Handler = (
  event: APIGatewayProxyEventV2,
) => Promise<APIGatewayProxyStructuredResultV2>;

function createJsonResponse(
  statusCode: number,
  body: CreateGroupResponse | ErrorResponse,
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

function isCreateGroupInput(
  value: unknown,
): value is CreateGroupInput {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const record =
    value as Record<string, unknown>;

  return (
    typeof record.groupName === "string" &&
    typeof record.createdByDisplayName ===
      "string"
  );
}

export function createGroupHandler(
  repository: GroupRepository,
): Handler {
  return async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
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

    if (!isCreateGroupInput(requestBody)) {
      return createJsonResponse(400, {
        message:
          "グループ名と表示名を文字列で指定してください",
      });
    }

    let result: CreateGroupResult;

    try {
      result = createGroup(requestBody);
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
      await repository.save(result.group);
    } catch (error) {
      console.error(
        "グループの保存に失敗しました",
        error,
      );

      return createJsonResponse(500, {
        message:
          "グループの作成に失敗しました",
      });
    }

    return createJsonResponse(201, {
      groupId: result.group.groupId,
      groupName: result.group.groupName,
      createdByDisplayName:
        result.group.createdByDisplayName,
      createdAt: result.group.createdAt,
      accessToken: result.accessToken,
    });
  };
}

let configuredHandler: Handler | undefined;

function getConfiguredHandler():
  | Handler
  | undefined {
  if (configuredHandler) {
    return configuredHandler;
  }

  const tableName =
    process.env.GROUPS_TABLE_NAME;

  if (!tableName) {
    return undefined;
  }

  const repository =
    new DynamoDbGroupRepository(tableName);

  configuredHandler =
    createGroupHandler(repository);

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