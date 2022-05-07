import { PermissionResolvable, Permissions } from 'discord.js';
export const checkPermissions = (
  MemberPermissions: Readonly<Permissions> | null | undefined,
  ArrayPermissionsCheck: PermissionResolvable[]
) => {
  for (const permission of ArrayPermissionsCheck) {
    if (!MemberPermissions?.has(permission)) {
      return false;
    }
  }
  return true;
};
