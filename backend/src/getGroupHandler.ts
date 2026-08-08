import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import { verifyAccessToken } from "./accessToken";
import { DynamoDbGroupRepository } from
  "./dynamoDbGroupRepository";
import type { GroupRepository } from
  "./groupRepository";

type GetGroupResponse = {
  groupId: string;
  groupName: string;
  createdByDisplayName: string;
  createdAt: string;
};

type ErrorResponse = {
  message: string;
};

type Handler = (
  event: APIGatewayProxyEventV2,
) => Promise<APIGatewayProxyStructuredResultV2>;

function createJsonResponse(
  statusCode: number,
  body: GetGroupResponse | ErrorResponse,
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

export function createGetGroupHandler(
  repository: GroupRepository,
): Handler {
  return async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
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
      group = await repository.findById(groupId);
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

    const tokenIsValid = verifyAccessToken(
      accessToken,
      group.accessTokenHash,
    );

    if (!tokenIsValid) {
      return createJsonResponse(401, {
        message:
          "アクセストークンが正しくありません",
      });
    }

    return createJsonResponse(200, {
      groupId: group.groupId,
      groupName: group.groupName,
      createdByDisplayName:
        group.createdByDisplayName,
      createdAt: group.createdAt,
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

  configuredHandler =
    createGetGroupHandler(
      new DynamoDbGroupRepository(tableName),
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