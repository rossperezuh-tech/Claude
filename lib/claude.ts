import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const CLAUDE_MODEL = "claude-opus-4-8";

type RunResult<T> = { data: T } | { errorResponse: NextResponse };

/** Attribution for per-tenant billing — every AI call must carry one. */
export interface UsageMeta {
  orgId: string;
  tool: string;
}

/**
 * Records one Claude call against the org. Never throws: a metering failure
 * must not break the user-facing request.
 */
export async function recordUsage(meta: UsageMeta, usage: Anthropic.Usage): Promise<void> {
  try {
    await prisma.usageEvent.create({
      data: {
        organizationId: meta.orgId,
        tool: meta.tool,
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        cacheReadTokens: usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (err) {
    console.error("usage metering failed:", err);
  }
}

function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof Anthropic.AuthenticationError) {
    return NextResponse.json({ error: "Invalid ANTHROPIC_API_KEY." }, { status: 500 });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return NextResponse.json(
      { error: "Rate limited by the Claude API. Wait a minute and retry." },
      { status: 429 },
    );
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return NextResponse.json(
      { error: "Could not reach the Claude API. Check your network." },
      { status: 502 },
    );
  }
  if (error instanceof Anthropic.APIError) {
    return NextResponse.json({ error: `Claude API error: ${error.message}` }, { status: 502 });
  }
  throw error;
}

export function missingKeyResponse(): NextResponse | null {
  if (process.env.ANTHROPIC_API_KEY) return null;
  return NextResponse.json(
    { error: "ANTHROPIC_API_KEY is not set. Add it to .env and restart the dev server." },
    { status: 500 },
  );
}

async function run(
  params: Omit<Anthropic.MessageStreamParams, "model" | "max_tokens">,
  meta?: UsageMeta,
): Promise<{ message: Anthropic.Message } | { errorResponse: NextResponse }> {
  const client = new Anthropic();
  let message: Anthropic.Message;
  try {
    message = await client.messages
      .stream({ model: CLAUDE_MODEL, max_tokens: 16000, thinking: { type: "adaptive" }, ...params })
      .finalMessage();
  } catch (error) {
    return { errorResponse: toErrorResponse(error) };
  }
  if (meta) await recordUsage(meta, message.usage);

  if (message.stop_reason === "refusal") {
    return {
      errorResponse: NextResponse.json(
        { error: "The model declined this request." },
        { status: 422 },
      ),
    };
  }
  if (message.stop_reason === "max_tokens") {
    return {
      errorResponse: NextResponse.json(
        { error: "The input is too long for a single pass. Try a shorter excerpt." },
        { status: 422 },
      ),
    };
  }
  return { message };
}

function textOf(message: Anthropic.Message): string | null {
  const block = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return block?.text ?? null;
}

/** One-shot structured-output call; the JSON schema guarantees the shape of `data`. */
export async function runStructured<T>(params: {
  system: string;
  schema: Record<string, unknown>;
  content: Anthropic.ContentBlockParam[] | string;
  meta?: UsageMeta;
}): Promise<RunResult<T>> {
  const result = await run(
    {
      system: [{ type: "text", text: params.system, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: params.schema } },
      messages: [{ role: "user", content: params.content }],
    },
    params.meta,
  );
  if ("errorResponse" in result) return result;
  const text = textOf(result.message);
  if (!text) {
    return {
      errorResponse: NextResponse.json({ error: "The model returned no result." }, { status: 502 }),
    };
  }
  return { data: JSON.parse(text) as T };
}

/** One-shot plain-text call (e.g. drafting documents). */
export async function runText(params: {
  system: string;
  content: Anthropic.ContentBlockParam[] | string;
  meta?: UsageMeta;
}): Promise<RunResult<string>> {
  const result = await run(
    {
      system: [{ type: "text", text: params.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: params.content }],
    },
    params.meta,
  );
  if ("errorResponse" in result) return result;
  const text = textOf(result.message);
  if (!text) {
    return {
      errorResponse: NextResponse.json({ error: "The model returned no result." }, { status: 502 }),
    };
  }
  return { data: text };
}
