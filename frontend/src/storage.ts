function createDisplayNameKey(
  groupId: string,
): string {
  return `peace-wishlist:displayName:${groupId}`;
}

export function getDisplayName(
  groupId: string,
): string | null {
  return localStorage.getItem(
    createDisplayNameKey(groupId),
  );
}

export function saveDisplayName(
  groupId: string,
  displayName: string,
): void {
  localStorage.setItem(
    createDisplayNameKey(groupId),
    displayName,
  );
}

export function removeDisplayName(
  groupId: string,
): void {
  localStorage.removeItem(
    createDisplayNameKey(groupId),
  );
}