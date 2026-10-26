export type ApprovalDecision = "once" | "session" | "deny";
export type PermissionMode = "allow" | "deny" | "ask";

export interface PermissionRequest {
  toolName: string;
  description: string;
  input: unknown;
}

export interface PermissionContext {
  requestApproval(request: PermissionRequest): Promise<ApprovalDecision>;
}
