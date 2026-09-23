import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  type UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

import type { WishItem } from "./createWishItem";
import type {
  WishItemRepository,
} from "./wishItemRepository";

const dynamoDbClient = new DynamoDBClient({});

const documentClient =
  DynamoDBDocumentClient.from(
    dynamoDbClient,
    {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    },
  );

export function createWishItemUpdateInput(
  tableName: string,
  item: WishItem,
): UpdateCommandInput {
  return {
    TableName: tableName,

    Key: {
      groupId: item.groupId,
      itemId: item.itemId,
    },

    UpdateExpression: `
      SET #content = :content,
          #comment = :comment,
          #url = :url,
          #updatedByDisplayName = :updatedByDisplayName,
          #updatedAt = :updatedAt
    `,

    ExpressionAttributeNames: {
      "#groupId": "groupId",
      "#itemId": "itemId",
      "#content": "content",
      "#comment": "comment",
      "#url": "url",
      "#updatedByDisplayName":
        "updatedByDisplayName",
      "#updatedAt": "updatedAt",
    },

    ExpressionAttributeValues: {
      ":content": item.content,
      ":comment": item.comment ?? "",
      ":url": item.url ?? "",
      ":updatedByDisplayName":
        item.updatedByDisplayName,
      ":updatedAt": item.updatedAt,
    },

    ConditionExpression:
      "attribute_exists(#groupId) AND attribute_exists(#itemId)",
  };
}

export class DynamoDbWishItemRepository
  implements WishItemRepository
{
  constructor(
    private readonly tableName: string,
  ) {}

  async save(item: WishItem): Promise<void> {
    await documentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression:
          "attribute_not_exists(itemId)",
      }),
    );
  }

  async findByGroupId(
    groupId: string,
  ): Promise<WishItem[]> {
    const response =
      await documentClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: "ItemsByCreatedAt",

          KeyConditionExpression:
            "groupId = :groupId",

          ExpressionAttributeValues: {
            ":groupId": groupId,
          },

          ScanIndexForward: false,
        }),
      );

    return (
      response.Items as WishItem[] | undefined
    ) ?? [];
  }

  async update(
    item: WishItem,
  ): Promise<void> {
    await documentClient.send(
      new UpdateCommand(
        createWishItemUpdateInput(
          this.tableName,
          item,
        ),
      ),
    );
  }

  async findById(
    groupId: string,
    itemId: string,
  ): Promise<WishItem | null> {
    const response =
      await documentClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            groupId,
            itemId,
          },
        }),
      );

    if (!response.Item) {
      return null;
    }

    return response.Item as WishItem;
  }

  async delete(
    groupId: string,
    itemId: string,
  ): Promise<void> {
    await documentClient.send(
      new DeleteCommand({
        TableName: this.tableName,

        Key: {
          groupId,
          itemId,
        },

        ConditionExpression:
          "attribute_exists(groupId) AND attribute_exists(itemId)",
      }),
    );
  }
}
