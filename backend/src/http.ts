import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { verifyAccessToken } from "./accessToken";
import type { GroupRepository } from "./groupRepository";

export type Handler = (
  event: APIGatewayProxyEventV2,
) => Promise<APIGatewayProxyStructuredResultV2>;

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(
  statusCode: number,
  body: unknown,
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

export function readBody(
  event: APIGatewayProxyEventV2,
): Record<string, unknown> {
  try {
    const value = JSON.parse(
      event.isBase64Encoded
        ? Buffer.from(event.body ?? "", "base64").toString("utf8")
        : (event.body ?? ""),
    );
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new HttpError(400, "入力内容を確認してください");
  }
}

export async function authorizeGroup(
  event: APIGatewayProxyEventV2,
  repository: GroupRepository,
): Promise<string> {
  const groupId = event.pathParameters?.groupId;
  if (!groupId) throw new HttpError(400, "グループIDが必要です");
  const token = /^Bearer (\S+)$/i.exec(
    event.headers.authorization ?? event.headers.Authorization ?? "",
  )?.[1];
  if (!token) throw new HttpError(401, "共有URLから開き直してください");
  const group = await repository.findById(groupId);
  if (!group) throw new HttpError(404, "グループが見つかりません");
  if (!verifyAccessToken(token, group.accessTokenHash))
    throw new HttpError(401, "共有URLから開き直してください");
  return groupId;
}

export function withErrors(handler: Handler): Handler {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      if (error instanceof HttpError)
        return json(error.statusCode, { message: error.message });
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        return json(409, {
          message:
            "ほかのメンバーが更新しました。読み込み直してからお試しください",
        });
      }
      console.error(
        "API operation failed",
        error instanceof Error ? error.name : "unknown",
      );
      return json(500, {
        message: "保存できませんでした。時間をおいて、もう一度お試しください",
      });
    }
  };
}
