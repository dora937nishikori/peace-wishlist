import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
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

    const alarmEmail =
      process.env.ALARM_EMAIL;

    if (!alarmEmail) {
      throw new Error(
        "ALARM_EMAIL が設定されていません",
      );
    }

    const alarmTopic =
      new sns.Topic(
        this,
        "AlarmTopic",
        {
          displayName:
            "Peace Wishlist Alarm",
        },
      );

    alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(
        alarmEmail,
      ),
    );

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

    const lambdaFunctions = [
      createGroupFunction,
      getGroupFunction,
      createWishItemFunction,
      getWishItemsFunction,
      updateWishItemFunction,
      deleteWishItemFunction,
    ];

    lambdaFunctions.forEach(
      (lambdaFunction, index) => {
        new logs.LogRetention(
          this,
          `LambdaLogRetention${index}`,
          {
            logGroupName:
              `/aws/lambda/${lambdaFunction.functionName}`,

            retention:
              logs.RetentionDays.ONE_MONTH,

            removalPolicy:
              cdk.RemovalPolicy.DESTROY,
          },
        );
      },
    );

    lambdaFunctions.forEach(
      (lambdaFunction, index) => {
        const lambdaErrorAlarm =
          new cloudwatch.Alarm(
            this,
            `LambdaErrorAlarm${index}`,
            {
              metric:
                lambdaFunction.metricErrors({
                  period:
                    cdk.Duration.minutes(5),
                  statistic: "Sum",
                }),

              threshold: 1,
              evaluationPeriods: 1,

              comparisonOperator:
                cloudwatch.ComparisonOperator
                  .GREATER_THAN_OR_EQUAL_TO_THRESHOLD,

              treatMissingData:
                cloudwatch.TreatMissingData
                  .NOT_BREACHING,

              alarmDescription:
                `${lambdaFunction.functionName} でLambdaエラーが発生`,
            },
          );

        lambdaErrorAlarm.addAlarmAction(
          new cloudwatchActions.SnsAction(
            alarmTopic,
          ),
        );
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

    const frontendBucket =
      new s3.Bucket(
        this,
        "FrontendBucket",
        {
          blockPublicAccess:
            s3.BlockPublicAccess.BLOCK_ALL,

          encryption:
            s3.BucketEncryption.S3_MANAGED,

          enforceSSL: true,

          removalPolicy:
            cdk.RemovalPolicy.DESTROY,

          autoDeleteObjects: true,
        },
      );

    const frontendDistribution =
      new cloudfront.Distribution(
        this,
        "FrontendDistribution",
        {
          defaultRootObject:
            "index.html",

          defaultBehavior: {
            origin:
              origins.S3BucketOrigin
                .withOriginAccessControl(
                  frontendBucket,
                ),

            viewerProtocolPolicy:
              cloudfront
                .ViewerProtocolPolicy
                .REDIRECT_TO_HTTPS,
          },

          errorResponses: [
            {
              httpStatus: 403,

              responseHttpStatus: 200,

              responsePagePath:
                "/index.html",

              ttl:
                cdk.Duration.seconds(
                  0,
                ),
            },

            {
              httpStatus: 404,

              responseHttpStatus: 200,

              responsePagePath:
                "/index.html",

              ttl:
                cdk.Duration.seconds(
                  0,
                ),
            },
          ],
        },
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

            `https://${frontendDistribution.distributionDomainName}`,
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

    const apiServerErrorAlarm =
      new cloudwatch.Alarm(
        this,
        "ApiServerErrorAlarm",
        {
          metric:
            httpApi.metricServerError({
              period:
                cdk.Duration.minutes(5),
              statistic: "Sum",
            }),

          threshold: 1,
          evaluationPeriods: 1,

          comparisonOperator:
            cloudwatch.ComparisonOperator
              .GREATER_THAN_OR_EQUAL_TO_THRESHOLD,

          treatMissingData:
            cloudwatch.TreatMissingData
              .NOT_BREACHING,

          alarmDescription:
            "API Gatewayで5分間に1件以上の5XXエラーが発生",
        },
      );

    apiServerErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(
        alarmTopic,
      ),
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

    new cdk.CfnOutput(
      this,
      "FrontendUrl",
      {
        value:
          `https://${frontendDistribution.distributionDomainName}`,
      },
    );

    new s3deploy.BucketDeployment(
      this,
      "DeployFrontend",
      {
        sources: [
          s3deploy.Source.asset(
            path.join(
              __dirname,
              "../../frontend/dist",
            ),
          ),
        ],

        destinationBucket:
          frontendBucket,

        distribution:
          frontendDistribution,

        distributionPaths: [
          "/*",
        ],
      },
    );
  }
}