import { DynamoDbGroupRepository } from "./dynamoDbGroupRepository";
import type { GroupRepository } from "./groupRepository";
import { authorizeGroup, HttpError, json, readBody, withErrors } from "./http";
import { fetchLinkPreview } from "./linkPreview";

export function createLinkPreviewHandler(
  groups: GroupRepository,
  fetchPreview = fetchLinkPreview,
) {
  return withErrors(async (event) => {
    await authorizeGroup(event, groups);
    const body = readBody(event);
    if (
      typeof body.url !== "string" ||
      body.url.length > 2048 ||
      !body.url.trim()
    ) {
      throw new HttpError(400, "正しいURLを入力してください");
    }
    return json(200, await fetchPreview(body.url));
  });
}

export const handler = createLinkPreviewHandler(
  new DynamoDbGroupRepository(process.env.GROUPS_TABLE_NAME ?? ""),
);
