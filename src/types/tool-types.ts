export interface ListDirectoryInput {
  directoryPath: string;
}

export interface ToolDefinition<TInput = unknown, TResult = unknown> {
  name: string;
  description: string;
  parseInput(input: unknown): TInput;
  execute(input: TInput): Promise<TResult>;
}
