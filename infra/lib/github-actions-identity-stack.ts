import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class GitHubActionsIdentityStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    const githubOidcProvider =
      new iam.OpenIdConnectProvider(
        this,
        "GitHubOidcProvider",
        {
          url: "https://token.actions.githubusercontent.com",
          clientIds: ["sts.amazonaws.com"],
        },
      );

    const deployRole = new iam.Role(
      this,
      "GitHubActionsDeployRole",
      {
        roleName:
          "PeaceWishlistGitHubActionsDeployRole",
        description:
          "Deployment role for peace-wishlist GitHub Actions",
        maxSessionDuration:
          cdk.Duration.hours(1),
        assumedBy:
          new iam.WebIdentityPrincipal(
            githubOidcProvider
              .openIdConnectProviderArn,
            {
              StringEquals: {
                "token.actions.githubusercontent.com:aud":
                  "sts.amazonaws.com",
                "token.actions.githubusercontent.com:sub":
                  "repo:dora937nishikori@111284878/peace-wishlist@1302840106:ref:refs/heads/main",
              },
            },
          ),
      },
    );

    deployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "AssumeCdkBootstrapRoles",
        actions: ["sts:AssumeRole"],
        resources: ["*"],
        conditions: {
          StringEquals: {
            "iam:ResourceTag/aws-cdk:bootstrap-role":
              [
                "deploy",
                "file-publishing",
                "image-publishing",
                "lookup",
              ],
          },
        },
      }),
    );

    deployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReadApplicationStack",
        actions: [
          "cloudformation:DescribeStacks",
        ],
        resources: [
          cdk.Stack.of(this).formatArn({
            service: "cloudformation",
            resource: "stack",
            resourceName:
              "PeaceWishlistStack/*",
          }),
        ],
      }),
    );

    new cdk.CfnOutput(
      this,
      "GitHubActionsDeployRoleArn",
      {
        value: deployRole.roleArn,
      },
    );
  }
}