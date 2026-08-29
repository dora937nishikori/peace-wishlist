#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";

import { GitHubActionsIdentityStack } from "../lib/github-actions-identity-stack";
import { InfraStack } from "../lib/infra-stack";

const app = new cdk.App();

const environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new GitHubActionsIdentityStack(
  app,
  "PeaceWishlistGitHubActionsIdentityStack",
  {
    env: environment,
  },
);

new InfraStack(
  app,
  "PeaceWishlistStack",
  {
    env: environment,
  },
);
