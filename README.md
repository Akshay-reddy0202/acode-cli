# acode-cli

> **An educational experiment: Building an autonomous AI coding agent CLI from scratch with TypeScript.**

`acode-cli` is a personal learning project designed to deconstruct the "magic" behind modern AI coding tools (such as Claude Code, Cursor, and Aider).

Rather than using high-level orchestration frameworks (like LangChain or LlamaIndex), this project implements the core primitives of an agent from first principles using pure Node.js and TypeScript.

---

## 🎯 Learning Objectives & Core Concepts Explored

The primary goal of this repository is to understand and implement:

1. **The Autonomous ReAct Cycle:**
   - How an LLM switches between thinking (reasoning), tool invocation (acting), and observation (feedback).
   - Handling model parsing failures and building automatic prompt self-correction when JSON output is malformed.

2. **Tool System & Workspace Sandboxing:**
   - Designing a modular `ToolRegistry` with runtime schema validation.
   - Preventing path traversal attacks (e.g. `../../`) by strictly containing all file operations within the workspace boundary.
   - Implementing safe **exact-match text replacement** (with uniqueness checks) instead of full file rewrites.

3. **Interactive Permission Boundaries:**
   - Implementing human-in-the-loop security gates before executing potentially destructive actions (file edits, bash execution).
   - Managing asynchronous stream lifecycles without conflicting with the main CLI input loop.

4. **Working with Local LLMs:**
   - Connecting directly to local inference (`llama.cpp`) via OpenAI-compatible endpoints.
   - Understanding the limitations of small-scale models (1.5B vs 7B) regarding structured output and instruction following.

---

## 🛠️ Implemented Architecture

```text
User Input ──▶ [ CLI REPL ]
                    │
                    ▼
           [ ReAct Agent Loop ] ◀──────────┐
                    │                      │
        ┌───────────┴───────────┐          │
        ▼                       ▼          │
  [ Final Text ]       [ Tool Call JSON ]  │
        │                       │          │
    (to user)                   ▼          │
                       [ Permission Gate ] │
                                │          │
                                ▼          │
                        [ Tool Registry ]  │
                                │          │
                       (Execute in Sandbox)─┘
```

---

## 🧰 Tools Implemented From Scratch

- `list_directory`: Workspace directory listing with path confinement.
- `read_file`: Sandboxed file reading.
- `find_files`: Recursive search with automatic exclusions (`node_modules`, `.git`, `dist`).
- `write_file`: File creation with recursive directory building.
- `edit_file`: Surgical exact-match snippet replacement.
- `run_command`: Controlled Bash subprocess execution.

---

## 💻 Tech Stack

- **Language:** TypeScript (Strict mode, ESM `nodenext`)
- **Runtime:** Node.js (Built-in `fetch`, `readline/promises`, `child_process`)
- **Inference:** `llama.cpp` local server (`Qwen2.5-Coder` / `Qwen2.5`)
- **External Dependencies:** None (Zero runtime dependencies)

---

## Project Structure

```text
acode-cli/
├── src/
│   ├── agent/
│   ├── config/
│   ├── llm/
│   ├── tests/
│   ├── tools/
│   ├── types/
│   └── index.ts
├── package-lock.json
├── package.json
├── tsconfig.json
└── README.md
```

## ⚠️ Project Status

> **Note:** This repository is an experimental learning playground and technical proof-of-concept. It is not intended for production use or general distribution.
