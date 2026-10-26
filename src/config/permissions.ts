import type { PermissionMode } from "../types/permission-types.js";

export const toolPermissions: Record<string, PermissionMode> = {
  list_directory: "ask",
  read_file: "ask",
  write_file: "ask",
  edit_file: "ask",
  run_command: "ask",
  web_search: "ask",
};
