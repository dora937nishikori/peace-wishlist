import type {
  APIGatewayProxyEventV2,
} from "aws-lambda";
import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import type { Group } from "./createGroup";
import {
  createGroupHandler,
} from "./createGroupHandler";
import type {
  GroupRepository,
} from "./groupRepository";

class FakeGroupRepository
  implements GroupRepository
{
  readonly savedGroups: Group[] = [];

  async save(group: Group): Promise<void> {
    this.savedGroups.push(group);
  }
  async findById(
    groupId: string,
  ): Promise<Group | null> {
    return (
      this.savedGroups.find(
        (group) => group.groupId === groupId,
      ) ?? null
    );
  }
}

class FailingGroupRepository
  implements GroupRepository
{
  async save(_group: Group): Promise<void> {
    throw new Error(
      "DynamoDBへの保存に失敗",
    );
  }
  async findById(
    _groupId: string,
  ): Promise<Group | null> {
    throw new Error("DynamoDBからの取得に失敗");
  }
}

function createEvent(
  body?: string,
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "POST /groups",
    rawPath: "/groups",
    rawQueryString: "",
    headers: {
      "content-type": "application/json",
    },
    requestContext: {
      accountId: "test-account",
      apiId: "test-api",
      domainName: "test.example.com",
      domainPrefix: "test",
      http: {
        method: "POST",
        path: "/groups",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest",
      },
      requestId: "test-request",
      routeKey: "POST /groups",
      stage: "$default",
      time:
        "02/Aug/2026:22:00:00 +0900",
      timeEpoch: 0,
    },
    body,
    isBase64Encoded: false,
  };
}

describe("createGroupHandler", () => {
  let repository: FakeGroupRepository;
  let testHandler:
    ReturnType<typeof createGroupHandler>;

  beforeEach(() => {
    repository =
      new FakeGroupRepository();

    testHandler =
      createGroupHandler(repository);
  });

  it(
    "有効なリクエストの場合は保存して201を返す",
    async () => {
      const event = createEvent(
        JSON.stringify({
          groupName:
            "休日にやりたいこと",
          createdByDisplayName: "こり",
        }),
      );

      const response =
        await testHandler(event);

      expect(response.statusCode).toBe(201);
      expect(
        repository.savedGroups,
      ).toHaveLength(1);

      const savedGroup =
        repository.savedGroups[0];

      expect(savedGroup.groupName).toBe(
        "休日にやりたいこと",
      );
      expect(
        savedGroup.createdByDisplayName,
      ).toBe("こり");
      expect(
        savedGroup.accessTokenHash,
      ).not.toBe("");

      const body = JSON.parse(
        response.body ?? "{}",
      );

      expect(body.groupName).toBe(
        "休日にやりたいこと",
      );
      expect(body.accessToken).not.toBe("");
      expect(
        body.accessTokenHash,
      ).toBeUndefined();
    },
  );

  it(
    "リクエストボディがない場合は400を返す",
    async () => {
      const response =
        await testHandler(
          createEvent(),
        );

      expect(response.statusCode).toBe(400);
      expect(
        repository.savedGroups,
      ).toHaveLength(0);
    },
  );

  it(
    "JSONの形式が不正な場合は400を返す",
    async () => {
      const response =
        await testHandler(
          createEvent("{不正なJSON"),
        );

      expect(response.statusCode).toBe(400);
      expect(
        repository.savedGroups,
      ).toHaveLength(0);
    },
  );

  it(
    "必要な項目が不足している場合は400を返す",
    async () => {
      const response =
        await testHandler(
          createEvent(
            JSON.stringify({
              groupName:
                "休日にやりたいこと",
            }),
          ),
        );

      expect(response.statusCode).toBe(400);
      expect(
        repository.savedGroups,
      ).toHaveLength(0);
    },
  );

  it(
    "空のグループ名の場合は400を返す",
    async () => {
      const response =
        await testHandler(
          createEvent(
            JSON.stringify({
              groupName: "   ",
              createdByDisplayName:
                "こり",
            }),
          ),
        );

      expect(response.statusCode).toBe(400);
      expect(
        repository.savedGroups,
      ).toHaveLength(0);
    },
  );

  it(
    "保存に失敗した場合は500を返す",
    async () => {
      const failingHandler =
        createGroupHandler(
          new FailingGroupRepository(),
        );

      const response =
        await failingHandler(
          createEvent(
            JSON.stringify({
              groupName:
                "休日にやりたいこと",
              createdByDisplayName:
                "こり",
            }),
          ),
        );

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(
        response.body ?? "{}",
      );

      expect(body.message).toBe(
        "グループの作成に失敗しました",
      );
    },
  );
});