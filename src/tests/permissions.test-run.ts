import {
  authorizeOperation,
  askForApproval,
  type PermissionRequest,
} from "../tools/permissions.js";

const request: PermissionRequest = {
  toolName: "run_command",
  description: "Test permission handling",
  input: { command: "npm test" },
};

async function main(): Promise<void> {
  const allowed = await authorizeOperation("ask", request, {
    requestApproval: askForApproval,
  });

  console.log(
    allowed
      ? "Permission granted. The operation may proceed."
      : "Permission denied. The operation must not run.",
  );
}

main().catch(console.error);
