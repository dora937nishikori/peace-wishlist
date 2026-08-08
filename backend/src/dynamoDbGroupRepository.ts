import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

import type { Group } from "./createGroup";
import type { GroupRepository } from "./groupRepository";

const dynamoDbClient = new DynamoDBClient({});

const documentClient = DynamoDBDocumentClient.from(
  dynamoDbClient,
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  },
);

export class DynamoDbGroupRepository
  implements GroupRepository
{
  constructor(
    private readonly tableName: string,
  ) {}

  async save(group: Group): Promise<void> {
    await documentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: group,
        ConditionExpression:
          "attribute_not_exists(groupId)",
      }),
    );
  }

  async findById(
    groupId: string,
  ): Promise<Group | null> {
    const response = await documentClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          groupId,
        },
      }),
    );

    if (!response.Item) {
      return null;
    }

    return response.Item as Group;
  }
}