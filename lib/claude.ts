import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const CLAUDE_MODEL = "claude-opus-4-8";

type RunResult<T> = { data: T } | { errorResponse: NextResponse };

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
}): Promise<RunResult<T>> {
  const result = await run({
    system: [{ type: "text", text: params.system, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: params.schema } },
    messages: [{ role: "user", content: params.content }],
  });
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
}): Promise<RunResult<string>> {
  const result = await run({
    system: [{ type: "text", text: params.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: params.content }],
  });
  if ("errorResponse" in result) return result;
  const text = textOf(result.message);
  if (!text) {
    return {
      errorResponse: NextResponse.json({ error: "The model returned no result." }, { status: 502 }),
    };
  }
  return { data: text };
}
