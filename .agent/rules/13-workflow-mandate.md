# 🔄 WORKFLOW MANDATE (The Crucial Base)

## 1. THE LAW OF ASSIGNMENT
*   **No Free-Roaming**: No task shall be executed without first being explicitly assigned to a `.agent/workflows/*.md` file.
*   **The Default**: If no specific workflow is required, the **Standard Task Lifecycle** (`standard-task-lifecycle.md`) applies automatically.

## 2. THE CYCLE
*   **Write**: Implementation must be preceded by or accompanied by test creation.
*   **Test**: Execution is NOT complete until the assigned workflow's testing phase passes.
*   **Review**: Code must be validated against Project Rules before closing the task.

## 3. THE BLOCKER
*   Any PR or Task marked "Done" without evidence of the Workflow's completion (Test Logs) is **INVALID**.
## 5. THE LAW OF WINDOWS-ONLY DEVELOPMENT (Anti-Corruption)
*   **Windows-First Edits**: ALL source code modifications MUST occur on the local Windows environment first.
*   **No Server Experimentation**: You are strictly prohibited from editing or "experimenting" with code directly on the server.
*   **Serial Sync Only**: Changes must be synced to the server sequentially using SCP/SSH after verification on Windows.
*   **Source of Truth**: The local Windows directory is the absolute source of truth for the codebase.
