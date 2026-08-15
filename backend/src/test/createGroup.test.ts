import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createGroup } from "../createGroup";

describe("createGroup", () => {
  it("有効な入力からグループを作成できる", () => {
    const result = createGroup({
      groupName: "休日にやりたいこと",
      createdByDisplayName: "こり",
    });

    expect(result.group.groupId).not.toBe("");
    expect(result.group.groupName).toBe("休日にやりたいこと");
    expect(result.group.createdByDisplayName).toBe("こり");
    expect(result.group.createdAt).not.toBe("");

    expect(result.accessToken).not.toBe("");
    expect(result.group.accessTokenHash).not.toBe("");
  });

  it("入力値の前後にある空白を取り除く", () => {
    const result = createGroup({
      groupName: "  休日にやりたいこと  ",
      createdByDisplayName: "  こり  ",
    });

    expect(result.group.groupName).toBe("休日にやりたいこと");
    expect(result.group.createdByDisplayName).toBe("こり");
  });

  it("アクセストークンをハッシュ化して保持する", () => {
    const result = createGroup({
      groupName: "休日にやりたいこと",
      createdByDisplayName: "こり",
    });

    const expectedHash = createHash("sha256")
      .update(result.accessToken)
      .digest("hex");

    expect(result.group.accessTokenHash).toBe(expectedHash);
    expect(result.group.accessTokenHash).not.toBe(result.accessToken);
  });

  it("グループ名が空の場合はエラーになる", () => {
    expect(() =>
      createGroup({
        groupName: "   ",
        createdByDisplayName: "こり",
      }),
    ).toThrow("グループ名を入力してください");
  });

  it("表示名が空の場合はエラーになる", () => {
    expect(() =>
      createGroup({
        groupName: "休日にやりたいこと",
        createdByDisplayName: "   ",
      }),
    ).toThrow("表示名を入力してください");
  });
});