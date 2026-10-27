import type { ToolDefinition } from "../types/tool-types.js";
import { toolPermissions } from "../config/permissions.js";
import type {
  PermissionContext,
  PermissionRequest,
} from "../types/permission-types.js";
import { askForApproval, authorizeOperation } from "./permissions.js";

interface RegisteredTool {
  name: string;
  description: string;
  parseInput(input: unknown): unknown;
  execute(input: unknown): Promise<unknown>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<unknown, unknown>>();

  constructor(
    private readonly permissionContext: PermissionContext = {
      requestApproval: askForApproval,
    },
  ) {}

  register<TInput, TResult>(tool: ToolDefinition<TInput, TResult>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }

    this.tools.set(tool.name, {
      name: tool.name,
      description: tool.description,
      parseInput: (input) => tool.parseInput(input),
      execute: (input) => tool.execute(input as TInput),
    });
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  list(): string[] {
    return [...this.tools.keys()];
  }

  async execute(name: string, rawInput: unknown): Promise<unknown> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Unknown tool: "${name}".`);
    }

    const input = tool.parseInput(rawInput);
    const mode = toolPermissions[name] ?? "deny";

    const request: PermissionRequest = {
      toolName: tool.name,
      description: tool.description,
      input,
    };

    const allowed = await authorizeOperation(
      mode,
      request,
      this.permissionContext,
    );

    if (!allowed) {
      throw new Error(`Permission denied for tool "${name}".`);
    }

    return tool.execute(input);
  }
}
