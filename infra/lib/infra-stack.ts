import * as path from "node:path";

import * as cdk from "aws-cdk-lib";
import {
  aws_apigatewayv2 as apigatewayv2,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNodejs,
} from "aws-cdk-lib";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type { Construct } from "constructs";

export class InfraStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    /*
     * グループ情報を保存するDynamoDBテーブル
     */
    const groupsTable = new dynamodb.Table(
      this,
      "GroupsTable",
      {
        partitionKey: {
          name: "groupId",
          type: dynamodb.AttributeType.STRING,
        },

        // リクエスト数に応じて課金される方式
        billingMode:
          dynamodb.BillingMode.PAY_PER_REQUEST,

        /*
         * 開発中は、スタック削除時にテーブルも削除する。
         * 本番運用時はRETAINへ変更する。
         */
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    );

    const wishItemsTable = new dynamodb.Table(
      this,
      "WishItemsTable",
      {
        partitionKey: {
          name: "groupId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "itemId",
          type: dynamodb.AttributeType.STRING,
        },
        billingMode:
          dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    );

    wishItemsTable.addGlobalSecondaryIndex({
      indexName: "ItemsByCreatedAt",
      partitionKey: {
        name: "groupId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "createdAtItemId",
        type: dynamodb.AttributeType.STRING,
      },
    });

    /*
     * グループ作成Lambda
     */
    const createGroupFunction =
      new lambdaNodejs.NodejsFunction(
        this,
        "CreateGroupFunction",
        {
          entry: path.join(
            __dirname,
            "../../backend/src/createGroupHandler.ts",
          ),

          handler: "handler",

          runtime: lambda.Runtime.NODEJS_24_X,

          /*
           * backend側の依存ライブラリと
           * package-lock.jsonを基準にバンドルする。
           */
          depsLockFilePath: path.join(
            __dirname,
            "../../backend/package-lock.json",
          ),

          environment: {
            GROUPS_TABLE_NAME:
              groupsTable.tableName,
          },

          bundling: {
            target: "node24",
            sourceMap: true,
            minify: false,
          },
        },
      );

  const getGroupFunction =
    new lambdaNodejs.NodejsFunction(
      this,
      "GetGroupFunction",
      {
        entry: path.join(
          __dirname,
          "../../backend/src/getGroupHandler.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_24_X,
        depsLockFilePath: path.join(
          __dirname,
          "../../backend/package-lock.json",
        ),
        environment: {
          GROUPS_TABLE_NAME:
            groupsTable.tableName,
        },
        bundling: {
          target: "node24",
          sourceMap: true,
          minify: false,
        },
      },
    );

    const createWishItemFunction =
      new lambdaNodejs.NodejsFunction(
        this,
        "CreateWishItemFunction",
        {
          entry: path.join(
            __dirname,
            "../../backend/src/createWishItemHandler.ts",
          ),

          handler: "handler",

          runtime: lambda.Runtime.NODEJS_24_X,

          depsLockFilePath: path.join(
            __dirname,
            "../../backend/package-lock.json",
          ),

          environment: {
            GROUPS_TABLE_NAME:
              groupsTable.tableName,

            WISH_ITEMS_TABLE_NAME:
              wishItemsTable.tableName,
          },

          bundling: {
            target: "node24",
            sourceMap: true,
            minify: false,
          },
        },
      );

      const getWishItemsFunction =
        new lambdaNodejs.NodejsFunction(
          this,
          "GetWishItemsFunction",
          {
            entry: path.join(
              __dirname,
              "../../backend/src/getWishItemsHandler.ts",
            ),

            handler: "handler",

            runtime: lambda.Runtime.NODEJS_24_X,

            depsLockFilePath: path.join(
              __dirname,
              "../../backend/package-lock.json",
            ),

            environment: {
              GROUPS_TABLE_NAME:
                groupsTable.tableName,

              WISH_ITEMS_TABLE_NAME:
                wishItemsTable.tableName,
            },

            bundling: {
              target: "node24",
              sourceMap: true,
              minify: false,
            },
          },
        );

      const updateWishItemFunction =
        new lambdaNodejs.NodejsFunction(
          this,
          "UpdateWishItemFunction",
          {
            entry: path.join(
              __dirname,
              "../../backend/src/updateWishItemHandler.ts",
            ),
            handler: "handler",
            runtime: lambda.Runtime.NODEJS_24_X,
            depsLockFilePath: path.join(
              __dirname,
              "../../backend/package-lock.json",
            ),
            environment: {
              GROUPS_TABLE_NAME:
                groupsTable.tableName,
              WISH_ITEMS_TABLE_NAME:
                wishItemsTable.tableName,
            },
            bundling: {
              target: "node24",
              sourceMap: true,
              minify: false,
            },
          },
        );

      const deleteWishItemFunction =
        new lambdaNodejs.NodejsFunction(
          this,
          "DeleteWishItemFunction",
          {
            entry: path.join(
              __dirname,
              "../../backend/src/deleteWishItemHandler.ts",
            ),
            handler: "handler",
            runtime: lambda.Runtime.NODEJS_24_X,
            depsLockFilePath: path.join(
              __dirname,
              "../../backend/package-lock.json",
            ),
            environment: {
              GROUPS_TABLE_NAME:
                groupsTable.tableName,
              WISH_ITEMS_TABLE_NAME:
                wishItemsTable.tableName,
            },
            bundling: {
              target: "node24",
              sourceMap: true,
              minify: false,
            },
          },
        );

    /*
     * LambdaへDynamoDBの書き込み権限を付与する。
     */
    groupsTable.grantWriteData(
      createGroupFunction,
    );

    groupsTable.grantReadData(
      getGroupFunction,
    );

    groupsTable.grantReadData(
      createWishItemFunction,
    );

    wishItemsTable.grantWriteData(
      createWishItemFunction,
    );

    groupsTable.grantReadData(
      getWishItemsFunction,
    );

    wishItemsTable.grantReadData(
      getWishItemsFunction,
    );

    groupsTable.grantReadData(
      updateWishItemFunction,
    );

    wishItemsTable.grantReadWriteData(
      updateWishItemFunction,
    );

    groupsTable.grantReadData(
      deleteWishItemFunction,
    );

    wishItemsTable.grantReadWriteData(
      deleteWishItemFunction,
    );

    /*
     * API Gateway HTTP API
     */
    const httpApi = new apigatewayv2.HttpApi(
      this,
      "WishlistApi",
      {
        apiName: "peace-wishlist-api",

        corsPreflight: {
          allowOrigins: [
            "http://localhost:5173",
          ],
          allowMethods: [
            apigatewayv2.CorsHttpMethod.GET,
            apigatewayv2.CorsHttpMethod.POST,
            apigatewayv2.CorsHttpMethod.PATCH,
            apigatewayv2.CorsHttpMethod.DELETE,
          ],
          allowHeaders: [
            "content-type",
            "authorization",
          ],
        },
      },
    );

    const createGroupIntegration =
      new HttpLambdaIntegration(
        "CreateGroupIntegration",
        createGroupFunction,
      );

    const getGroupIntegration =
      new HttpLambdaIntegration(
        "GetGroupIntegration",
        getGroupFunction,
      );

    const createWishItemIntegration =
      new HttpLambdaIntegration(
        "CreateWishItemIntegration",
        createWishItemFunction,
      );

    const getWishItemsIntegration =
      new HttpLambdaIntegration(
        "GetWishItemsIntegration",
        getWishItemsFunction,
      );

    const updateWishItemIntegration =
      new HttpLambdaIntegration(
        "UpdateWishItemIntegration",
        updateWishItemFunction,
      );

    const deleteWishItemIntegration =
      new HttpLambdaIntegration(
        "DeleteWishItemIntegration",
        deleteWishItemFunction,
      );

    httpApi.addRoutes({
      path: "/groups",
      methods: [
        apigatewayv2.HttpMethod.POST,
      ],
      integration: createGroupIntegration,
    });

    httpApi.addRoutes({
      path: "/groups/{groupId}",
      methods: [
        apigatewayv2.HttpMethod.GET,
      ],
      integration: getGroupIntegration,
    });

    httpApi.addRoutes({
      path: "/groups/{groupId}/items",
      methods: [
        apigatewayv2.HttpMethod.POST,
      ],
      integration:
        createWishItemIntegration,
    });

    httpApi.addRoutes({
      path: "/groups/{groupId}/items",
      methods: [
        apigatewayv2.HttpMethod.GET,
      ],
      integration:
        getWishItemsIntegration,
    });

    httpApi.addRoutes({
      path: "/groups/{groupId}/items/{itemId}",
      methods: [
        apigatewayv2.HttpMethod.PATCH,
      ],
      integration:
        updateWishItemIntegration,
    });

    httpApi.addRoutes({
      path: "/groups/{groupId}/items/{itemId}",
      methods: [
        apigatewayv2.HttpMethod.DELETE,
      ],
      integration:
        deleteWishItemIntegration,
    });

    /*
     * デプロイ完了後、APIのURLをターミナルへ表示する。
     */
    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
    });

    new cdk.CfnOutput(
      this,
      "GroupsTableName",
      {
        value: groupsTable.tableName,
      },
    );

    new cdk.CfnOutput(
      this,
      "WishItemsTableName",
      {
        value: wishItemsTable.tableName,
      },
    );
  }
}