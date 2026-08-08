import { randomUUID } from "node:crypto";

import {
  generateAccessToken,
  hashAccessToken,
} from "./accessToken";

export type CreateGroupInput = {
  groupName: string;
  createdByDisplayName: string;
};

export type Group = {
  groupId: string;
  groupName: string;
  accessTokenHash: string;
  createdByDisplayName: string;
  createdAt: string;
};

export type CreateGroupResult = {
  group: Group;
  accessToken: string;
};

export function createGroup(input: CreateGroupInput): CreateGroupResult {
  const groupName = input.groupName.trim();
  const createdByDisplayName = input.createdByDisplayName.trim();

  if (groupName.length === 0) {
    throw new Error("グループ名を入力してください");
  }

  if (createdByDisplayName.length === 0) {
    throw new Error("表示名を入力してください");
  }

  const groupId = randomUUID();
  const accessToken = generateAccessToken();

  const accessTokenHash =
    hashAccessToken(accessToken);

  const group: Group = {
    groupId,
    groupName,
    accessTokenHash,
    createdByDisplayName,
    createdAt: new Date().toISOString(),
  };

  return {
    group,
    accessToken,
  };
}