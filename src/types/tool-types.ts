export interface ToolDefinition<TInput = unknown, TResult = unknown> {
  name: string;
  description: string;
  parseInput(input: unknown): TInput;
  execute(input: TInput): Promise<TResult>;
}

export interface ListDirectoryInput {
  directoryPath: string;
}
export interface ReadFileInput {
  filePath: string;
}

export interface FindFilesInput {
  pattern: string;
  directoryPath?: string;
}

export interface WriteFileInput {
  filePath: string;
  content: string;
}

export interface EditFileInput {
  filePath: string;
  oldText: string;
  newText: string;
}

export interface RunCommandInput {
  command: string;
}
