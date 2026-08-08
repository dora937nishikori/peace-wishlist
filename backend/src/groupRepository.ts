import type { Group } from "./createGroup";

export interface GroupRepository {
  save(group: Group): Promise<void>;

  findById(groupId: string): Promise<Group | null>;
}