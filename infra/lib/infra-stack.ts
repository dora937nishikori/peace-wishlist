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

    /*
     * LambdaへDynamoDBの書き込み権限を付与する。
     */
    groupsTable.grantWriteData(
      createGroupFunction,
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
            apigatewayv2.CorsHttpMethod.POST,
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

    httpApi.addRoutes({
      path: "/groups",
      methods: [
        apigatewayv2.HttpMethod.POST,
      ],
      integration: createGroupIntegration,
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
  }
}