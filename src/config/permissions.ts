import type { PermissionMode } from "../types/permission-types.js";

export const toolPermissions: Record<string, PermissionMode> = {
  list_directory: "allow",
  read_file: "allow",
  find_files: "allow",
  write_file: "allow",
  edit_file: "allow",
  run_command: "allow",
  web_search: "allow",
  fetch_webpage: "ask",
};
