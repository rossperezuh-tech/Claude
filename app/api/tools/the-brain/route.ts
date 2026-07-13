import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { CLAUDE_MODEL, missingKeyResponse } from "@/lib/claude";

export const maxDuration = 300;

const MAX_TOOL_ITERATIONS = 8;
const MAX_HISTORY_MESSAGES = 40;

const SYSTEM_PROMPT = `You are The Brain — the private assistant inside Venture HQ, a command center for RP's portfolio of small businesses. You have live read access to the HQ database (businesses, tasks, contracts, documents, contacts) through tools, and you can create tasks.

Guidelines:
- Answer from the database, not from memory: when a question involves the user's businesses, tasks, deadlines, contracts, docs, or people, call the relevant tool first. Never invent records.
- If a business is referenced by a partial name ("yoga", "watches"), call list_businesses to resolve the slug.
- Be concise and operator-minded: lead with the answer, use short lists, mention dates explicitly.
- When asked to add a reminder/to-do, use create_task. Confirm what you created (title, business, due date, priority). Do not create tasks unless clearly asked.
- If a tool returns no results, say so plainly and suggest the nearest useful thing you did find.
- You cannot delete or edit records — offer to point the user to the right page instead (business pages live at /business/<slug>, tasks at /tasks, docs at /docs).`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "list_businesses",
    description:
      "List all businesses in HQ with slug, status, description, and open task count. Call this first whenever you need to resolve a business name or slug, or for portfolio-wide questions.",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "query_tasks",
    description:
      "Query tasks. Call this for anything about to-dos, workload, or deadlines. Filter by business slug, status, or a due-within-days window. Done tasks are excluded unless include_done is true.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        business_slug: { type: "string", description: "Exact business slug, or empty string for all businesses" },
        status: {
          type: "string",
          enum: ["", "BACKLOG", "THIS_WEEK", "IN_PROGRESS", "DONE"],
          description: "Filter to one status; empty string for all",
        },
        due_within_days: {
          type: "integer",
          description: "Only tasks due within this many days from today (includes overdue). 0 means no date filter.",
        },
        include_done: { type: "boolean" },
      },
      required: ["business_slug", "status", "due_within_days", "include_done"],
      additionalProperties: false,
    },
  },
  {
    name: "query_contracts",
    description:
      "List tracked contracts with term dates, auto-renewal flags, and renewal-notice deadlines. Call this for anything about agreements, leases, renewals, or notice deadlines.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        business_slug: { type: "string", description: "Exact business slug, or empty string for all" },
      },
      required: ["business_slug"],
      additionalProperties: false,
    },
  },
  {
    name: "search_docs",
    description:
      "Search the document index by title, notes, and category. Call this when the user asks where a document is or what documents exist.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text matched against title and notes" },
        business_slug: { type: "string", description: "Exact business slug, or empty string for all" },
      },
      required: ["query", "business_slug"],
      additionalProperties: false,
    },
  },
  {
    name: "list_contacts",
    description:
      "List contacts (name, role, phone, email) optionally filtered by business slug or matched against a name/role search. Call this for questions about people.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        business_slug: { type: "string", description: "Exact business slug, or empty string for all" },
        query: { type: "string", description: "Text matched against name and role; empty string for all" },
      },
      required: ["business_slug", "query"],
      additionalProperties: false,
    },
  },
  {
    name: "create_task",
    description:
      "Create a task in a business's backlog. Only call this when the user clearly asks to add a task/reminder/to-do. Resolve the business slug first via list_businesses if unsure.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        business_slug: { type: "string" },
        title: { type: "string", description: "Short imperative task title" },
        due_date: { type: "string", description: "YYYY-MM-DD, or empty string for no due date" },
        priority: { type: "string", enum: ["P1", "P2", "P3"] },
        notes: { type: "string", description: "Optional details; empty string if none" },
      },
      required: ["business_slug", "title", "due_date", "priority", "notes"],
      additionalProperties: false,
    },
  },
];

async function resolveBusinessId(slug: string): Promise<string | null> {
  if (!slug) return null;
  const b = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
  return b?.id ?? null;
}

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "list_businesses": {
      const businesses = await prisma.business.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          slug: true,
          status: true,
          description: true,
          _count: { select: { tasks: { where: { status: { not: "DONE" } } } } },
        },
      });
      return JSON.stringify(
        businesses.map((b) => ({
          name: b.name,
          slug: b.slug,
          status: b.status,
          description: b.description,
          open_tasks: b._count.tasks,
        })),
      );
    }

    case "query_tasks": {
      const slug = String(input.business_slug ?? "");
      const status = String(input.status ?? "");
      const dueWithinDays = Number(input.due_within_days ?? 0);
      const includeDone = Boolean(input.include_done);
      const businessId = await resolveBusinessId(slug);
      if (slug && !businessId) return JSON.stringify({ error: `No business with slug '${slug}'.` });

      const tasks = await prisma.task.findMany({
        where: {
          ...(businessId ? { businessId } : {}),
          ...(status ? { status } : includeDone ? {} : { status: { not: "DONE" } }),
          ...(dueWithinDays > 0
            ? { dueDate: { lte: new Date(Date.now() + dueWithinDays * 86400000) } }
            : {}),
        },
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
        take: 100,
        select: {
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          notes: true,
          business: { select: { name: true, slug: true } },
        },
      });
      return JSON.stringify(
        tasks.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          due: t.dueDate?.toISOString().slice(0, 10) ?? null,
          notes: t.notes || undefined,
          business: t.business.name,
          business_slug: t.business.slug,
        })),
      );
    }

    case "query_contracts": {
      const slug = String(input.business_slug ?? "");
      const businessId = await resolveBusinessId(slug);
      if (slug && !businessId) return JSON.stringify({ error: `No business with slug '${slug}'.` });
      const contracts = await prisma.contract.findMany({
        where: businessId ? { businessId } : {},
        orderBy: [{ renewalNoticeDate: "asc" }, { endDate: "asc" }],
        select: {
          title: true,
          counterparty: true,
          status: true,
          effectiveDate: true,
          endDate: true,
          autoRenews: true,
          renewalNoticeDate: true,
          summary: true,
          business: { select: { name: true } },
        },
      });
      return JSON.stringify(
        contracts.map((c) => ({
          title: c.title,
          counterparty: c.counterparty || undefined,
          status: c.status,
          effective: c.effectiveDate?.toISOString().slice(0, 10) ?? null,
          ends: c.endDate?.toISOString().slice(0, 10) ?? null,
          auto_renews: c.autoRenews,
          renewal_notice_deadline: c.renewalNoticeDate?.toISOString().slice(0, 10) ?? null,
          summary: c.summary || undefined,
          business: c.business.name,
        })),
      );
    }

    case "search_docs": {
      const query = String(input.query ?? "").trim();
      const slug = String(input.business_slug ?? "");
      const businessId = await resolveBusinessId(slug);
      if (slug && !businessId) return JSON.stringify({ error: `No business with slug '${slug}'.` });
      const docs = await prisma.document.findMany({
        where: {
          ...(businessId ? { businessId } : {}),
          ...(query
            ? { OR: [{ title: { contains: query } }, { notes: { contains: query } }, { category: { contains: query } }] }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          title: true,
          category: true,
          url: true,
          notes: true,
          business: { select: { name: true } },
        },
      });
      return JSON.stringify(
        docs.map((d) => ({
          title: d.title,
          category: d.category,
          url: d.url,
          notes: d.notes || undefined,
          business: d.business.name,
        })),
      );
    }

    case "list_contacts": {
      const slug = String(input.business_slug ?? "");
      const query = String(input.query ?? "").trim();
      const businessId = await resolveBusinessId(slug);
      if (slug && !businessId) return JSON.stringify({ error: `No business with slug '${slug}'.` });
      const contacts = await prisma.contact.findMany({
        where: {
          ...(businessId ? { businessId } : {}),
          ...(query ? { OR: [{ name: { contains: query } }, { role: { contains: query } }] } : {}),
        },
        take: 50,
        select: {
          name: true,
          role: true,
          phone: true,
          email: true,
          notes: true,
          business: { select: { name: true } },
        },
      });
      return JSON.stringify(
        contacts.map((c) => ({
          name: c.name,
          role: c.role || undefined,
          phone: c.phone || undefined,
          email: c.email || undefined,
          notes: c.notes || undefined,
          business: c.business.name,
        })),
      );
    }

    case "create_task": {
      const slug = String(input.business_slug ?? "");
      const businessId = await resolveBusinessId(slug);
      if (!businessId) return JSON.stringify({ error: `No business with slug '${slug}'.` });
      const title = String(input.title ?? "").trim();
      if (!title) return JSON.stringify({ error: "Task title is required." });
      const dueDate = String(input.due_date ?? "");
      const task = await prisma.task.create({
        data: {
          businessId,
          title,
          priority: String(input.priority ?? "P2"),
          notes: String(input.notes ?? ""),
          dueDate: /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? new Date(dueDate + "T09:00:00") : null,
        },
        select: { title: true, priority: true, dueDate: true },
      });
      return JSON.stringify({
        created: true,
        title: task.title,
        priority: task.priority,
        due: task.dueDate?.toISOString().slice(0, 10) ?? null,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const missingKey = missingKeyResponse();
  if (missingKey) return missingKey;

  let body: { messages?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_HISTORY_MESSAGES);
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Send at least one user message." }, { status: 400 });
  }

  const client = new Anthropic();
  const today = new Date().toISOString().slice(0, 10);
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `(Context note: today's date is ${today}.)` },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
  const toolsUsed: string[] = [];

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await client.messages
        .stream({
          model: CLAUDE_MODEL,
          max_tokens: 8000,
          thinking: { type: "adaptive" },
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          tools: TOOLS,
          messages,
        })
        .finalMessage();

      if (response.stop_reason === "refusal") {
        return NextResponse.json({ error: "The model declined this request." }, { status: 422 });
      }

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({
          reply: text || "(no reply)",
          toolsUsed: Array.from(new Set(toolsUsed)),
        });
      }

      messages.push({ role: "assistant", content: response.content });

      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of toolUses) {
        toolsUsed.push(use.name);
        let result: string;
        let isError = false;
        try {
          result = await executeTool(use.name, use.input as Record<string, unknown>);
        } catch (err) {
          result = `Tool failed: ${err instanceof Error ? err.message : "unknown error"}`;
          isError = true;
        }
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: result,
          ...(isError ? { is_error: true } : {}),
        });
      }
      messages.push({ role: "user", content: results });
    }

    return NextResponse.json({
      reply: "I hit my lookup limit answering that — try narrowing the question.",
      toolsUsed: Array.from(new Set(toolsUsed)),
    });
  } catch (error) {
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
}
