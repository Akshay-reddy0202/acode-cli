# acode-cli

**A TypeScript-based AI coding agent CLI built from scratch.**

`acode-cli` is an experimental project focused on understanding how modern AI coding agents work internally. Inspired by agentic CLI tools and the *Agentic CLI From Scratch* series by PolarSPARC, this project aims to build a coding agent that can understand user instructions, interact with a language model, use tools, and assist with development tasks.

## What We're Building

The goal is to develop a terminal-based AI coding assistant that can:

- Interact with a locally running language model.
- Understand user prompts and maintain conversation context.
- Read, search, and modify project files.
- Execute terminal commands through a controlled tool system.
- Use permission controls to manage potentially risky operations.
- Manage context and support reusable skills.

These capabilities will be implemented incrementally as part of the learning process.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Inference Engine:** llama.cpp
- **Language Model:** Qwen2.5-1.5B-Instruct (Q4_K_M quantization)

## Current Progress

The initial project setup and local LLM integration are complete. The application can send a prompt from TypeScript to the local inference server and display the generated response.

The interactive conversation loop, tool execution system, and other agent capabilities are planned for future development.

## Project Structure

```text
acode-cli/
├── src/
│   ├── agent/
│   ├── config/
│   ├── llm/
│   ├── tools/
│   └── index.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Project Status

🚧 **Under active development.** Features and architecture will evolve as the project progresses.

