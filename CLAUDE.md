@AGENTS.md

# Coding Guidelines

## 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- Surface tradeoffs when multiple approaches exist; don't pick silently.
- If something in the requirements is unclear, stop and clarify before writing code.

## 2. Simplicity First
- Write the minimum code that solves the problem.
- No speculative abstractions, unused configurability, or features beyond the ask.
- No error handling for scenarios that can't happen given the current codebase.

## 3. Surgical Changes
- Touch only what the request requires.
- Match existing style, naming, and patterns, even if you prefer otherwise.
- Don't refactor unrelated code or "improve" adjacent comments/formatting.
- Clean up only what your changes made unused (imports, variables, functions).

## 4. Goal-Driven Execution
- Turn tasks into verifiable goals.
- Prefer writing or running tests to confirm behavior over manual inspection alone.
- For multi-step tasks, state a brief plan with verification at each step.
