function createDisplayNameKey(groupId: string): string {
  return `peace-wishlist:displayName:${groupId}`;
}

export function getDisplayName(groupId: string): string | null {
  try {
    return localStorage.getItem(createDisplayNameKey(groupId));
  } catch {
    return null;
  }
}

export function saveDisplayName(groupId: string, displayName: string): void {
  try {
    localStorage.setItem(createDisplayNameKey(groupId), displayName);
  } catch {
    /* Storage may be disabled in a private browser. */
  }
}

export function removeDisplayName(groupId: string): void {
  try {
    localStorage.removeItem(createDisplayNameKey(groupId));
  } catch {
    /* The current view still works without storage. */
  }
}

export type RecentGroup = {
  groupId: string;
  groupName: string;
  accessToken: string;
  visitedAt: string;
};
const RECENT_KEY = "peace-wishlist:recent-groups";

export function getRecentGroups(): RecentGroup[] {
  try {
    const records: unknown = JSON.parse(
      localStorage.getItem(RECENT_KEY) ?? "[]",
    );
    return Array.isArray(records)
      ? records
          .filter(
            (value): value is RecentGroup =>
              value &&
              ["groupId", "groupName", "accessToken", "visitedAt"].every(
                (key) => typeof value[key] === "string",
              ),
          )
          .slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

export function rememberGroup(
  group: { groupId: string; groupName: string },
  accessToken: string,
): void {
  try {
    const records = getRecentGroups().filter(
      (entry) => entry.groupId !== group.groupId,
    );
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(
        [
          {
            groupId: group.groupId,
            groupName: group.groupName,
            accessToken,
            visitedAt: new Date().toISOString(),
          },
          ...records,
        ].slice(0, 12),
      ),
    );
  } catch {
    /* A full or unavailable localStorage must not block the app. */
  }
}

export function forgetGroup(groupId: string): void {
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(
        getRecentGroups().filter((entry) => entry.groupId !== groupId),
      ),
    );
  } catch {
    /* Best effort. */
  }
}

export function recentGroupUrl(group: RecentGroup): string {
  return `/groups/${encodeURIComponent(group.groupId)}#token=${encodeURIComponent(group.accessToken)}`;
}
