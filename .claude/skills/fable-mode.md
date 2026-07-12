# Fable Mode Skill

**Purpose:** Fable Mode enforces structured execution for complex tasks through staged planning, delegated verification, and skeptical review before delivery.

**Activation:** Trigger when users explicitly request thoroughness ("do this thoroughly," "deep work mode") or when tasks objectively span multiple files, sources, or sessions. Avoid triggering on straightforward multi-step requests.

**Key Mechanism (v3):** The delegation rule shifted from prose suggestions to structural routing. If fable agents are installed, tasks route through **@fable-orchestrator** (an Opus agent without Write/Edit capabilities). Workers handle artifacts; a **@fable-verifier** provides cold-check review. Without installed agents, the loop runs inline on the current model.

**Core Loop:**
1. **Stage mapping** — numbered stages with verifiable outputs and one artifact per stage
2. **Named delegation** — Sonnet-workers for reasoning, Haiku-workers for mechanical tasks, verifiers for checks
3. **Verification with failure conditions** — actual tests, file validation, or source checks (not subjective assessment)
4. **Self-critique** — honest assessment of weaknesses before delivery

**Domain-Specific Checks:** Software requires opened files and passing test commands; research demands sourced claims; data needs shape validation and spot-checks; documents require line-by-line spec comparison.

**Guardrails:** Always-on execution safeguards (verify-before-flag, warning thresholds, safe find-and-replace) operate independently across all models.

## Related Dependencies

Works alongside the always-on **execution-guardrails** skill, which provides verify-before-flag checks, warning batching, and find-and-replace safety measures.
