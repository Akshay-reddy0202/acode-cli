export type PermissionMode = "allow" | "deny" | "ask";

export const toolPermissions: Record<string, PermissionMode> = {
  list_directory: "ask",
  read_file: "ask",
  write_file: "ask",
  edit_file: "ask",
  run_command: "ask",
  web_search: "ask",
};
