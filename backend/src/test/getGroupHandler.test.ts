import type {
  APIGatewayProxyEventV2,
} from "aws-lambda";
import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { hashAccessToken } from "../accessToken";
import type { Group } from "../createGroup";
import {
  createGetGroupHandler,
} from "../getGroupHandler";
import type {
  GroupRepository,
} from "../groupRepository";

const validAccessToken = "valid-token";

const existingGroup: Group = {
  groupId: "group-001",
  groupName: "休日にやりたいこと",
  accessTokenHash:
    hashAccessToken(validAccessToken),
  createdByDisplayName: "こり",
  createdAt: "2026-08-04T00:00:00.000Z",
};

class FakeGroupRepository
  implements GroupRepository
{
  async save(
    _group: Group,
  ): Promise<void> {}

  async findById(
    groupId: string,
  ): Promise<Group | null> {
    if (groupId === existingGroup.groupId) {
      return existingGroup;
    }

    return null;
  }
}

class FailingGroupRepository
  implements GroupRepository
{
  async save(
    _group: Group,
  ): Promise<void> {}

  async findById(
    _groupId: string,
  ): Promise<Group | null> {
    throw new Error(
      "DynamoDBからの取得に失敗",
    );
  }
}

function createEvent(
  options?: {
    groupId?: string;
    accessToken?: string;
  },
): APIGatewayProxyEventV2 {
  const headers: Record<string, string> = {};

  if (options?.accessToken) {
    headers.authorization =
      `Bearer ${options.accessToken}`;
  }

  return {
    version: "2.0",
    routeKey:
      "GET /groups/{groupId}",
    rawPath:
      `/groups/${options?.groupId ?? ""}`,
    rawQueryString: "",
    headers,
    pathParameters:
      options?.groupId
        ? {
            groupId: options.groupId,
          }
        : undefined,
    requestContext: {
      accountId: "test-account",
      apiId: "test-api",
      domainName: "test.example.com",
      domainPrefix: "test",
      http: {
        method: "GET",
        path:
          `/groups/${options?.groupId ?? ""}`,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
      requestId: "test-request",
      routeKey:
        "GET /groups/{groupId}",
      stage: "$default",
      time:
        "04/Aug/2026:23:00:00 +0900",
      timeEpoch: 0,
    },
    isBase64Encoded: false,
  };
}

describe("getGroupHandler", () => {
  let testHandler:
    ReturnType<typeof createGetGroupHandler>;

  beforeEach(() => {
    testHandler =
      createGetGroupHandler(
        new FakeGroupRepository(),
      );
  });

  it(
    "正しいトークンでグループを取得できる",
    async () => {
      const response =
        await testHandler(
          createEvent({
            groupId: "group-001",
            accessToken:
              validAccessToken,
          }),
        );

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(
        response.body ?? "{}",
      );

      expect(body.groupId).toBe(
        "group-001",
      );
      expect(body.groupName).toBe(
        "休日にやりたいこと",
      );

      expect(
        body.accessTokenHash,
      ).toBeUndefined();
    },
  );

  it(
    "グループIDがない場合は400を返す",
    async () => {
      const response =
        await testHandler(
          createEvent({
            accessToken:
              validAccessToken,
          }),
        );

      expect(response.statusCode).toBe(400);
    },
  );

  it(
    "トークンがない場合は401を返す",
    async () => {
      const response =
        await testHandler(
          createEvent({
            groupId: "group-001",
          }),
        );

      expect(response.statusCode).toBe(401);
    },
  );

  it(
    "トークンが不正な場合は401を返す",
    async () => {
      const response =
        await testHandler(
          createEvent({
            groupId: "group-001",
            accessToken:
              "invalid-token",
          }),
        );

      expect(response.statusCode).toBe(401);
    },
  );

  it(
    "グループが存在しない場合は404を返す",
    async () => {
      const response =
        await testHandler(
          createEvent({
            groupId:
              "unknown-group",
            accessToken:
              validAccessToken,
          }),
        );

      expect(response.statusCode).toBe(404);
    },
  );

  it(
    "DB取得に失敗した場合は500を返す",
    async () => {
      const failingHandler =
        createGetGroupHandler(
          new FailingGroupRepository(),
        );

      const response =
        await failingHandler(
          createEvent({
            groupId: "group-001",
            accessToken:
              validAccessToken,
          }),
        );

      expect(response.statusCode).toBe(500);
    },
  );
});