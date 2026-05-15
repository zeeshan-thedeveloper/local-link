# Local Link Project Guidelines

## Token Optimization Rules

### Read Strategically
- Read files only when directly necessary for the task
- Don't scan entire directories; use Glob/Grep for targeted lookups
- When reviewing code, ask for file paths instead of reading broadly
- Avoid re-reading files in the same conversation

### Response Style
- Respond directly without preambles ("I'll help you...", "Let me...")
- Code-first: show the fix/change, explain only if asked
- Skip acknowledgments; move straight to work
- Use minimal formatting unless specifically requested
- Complete changes in one response, not iterative attempts

### Batching
- Combine related file edits into single responses
- Group dependent changes before executing
- Run tests once per task, not experimentally

### Model Selection
- Use Haiku for: formatting, file edits, quick lookups, routine tasks
- Use Sonnet for: complex refactoring, architecture decisions, multi-file design
- Escalate to Opus only when essential
- Keep subagents on Haiku for read-only exploration

### Context Management
- Don't carry completed tasks forward unnecessarily
- Clear prior context when switching to unrelated work
- Keep conversation focused on current objective
- Reference specific line numbers (file:line) instead of quoting extensively

### File Operations
- Use Edit for modifications, Write only for new files
- Prefer Glob/Grep over Read for discovery
- For large files, use Read with offset/limit parameters
- Never read entire project structures

## Exceptions
When user explicitly requests step-by-step guidance, verbose explanation, or detailed breakdown, follow their instruction over these rules.

## Current Stack
- Framework: Next.js (app router)
- Package Manager: pnpm
- Languages: TypeScript, CSS modules
- Notable: RTK Query (not real token optimization tool - just web app framework)
