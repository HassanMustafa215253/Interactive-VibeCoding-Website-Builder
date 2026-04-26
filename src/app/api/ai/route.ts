import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createDefaultTemplate } from "@/lib/templates";
import { ensureElementIds } from "@/lib/id";

const bodySchema = z.object({
  mode: z.enum(["generate", "edit", "explain"]),
  prompt: z.string().optional(),
  instruction: z.string().optional(),
  selected: z
    .object({
      id: z.string(),
      tagName: z.string(),
      snippet: z.string(),
      textPreview: z.string().optional(),
      componentPath: z.string().optional()
    })
    .optional(),
  parentSnippet: z.string().optional(),
  fullHtml: z.string().optional()
});

type ParsedBody = z.infer<typeof bodySchema>;

const DEFAULT_DO_BASE_URL = "https://inference.do-ai.run/v1";

function normalizeDigitalOceanModelId(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) {
    return "openai-gpt-oss-120b";
  }

  if (trimmed === "gpt-oss-20b") {
    return "openai-gpt-oss-20b";
  }

  if (trimmed === "gpt-oss-120b") {
    return "openai-gpt-oss-120b";
  }

  return trimmed;
}

type AiProviderConfig = {
  client: OpenAI;
  model: string;
  providerLabel: string;
};

function stripCodeFences(value: string): string {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

function isLikelyAIUpstreamError(message: string): boolean {
  return /\b(401|403|404|408|409|422|429|500|502|503|504)\b/.test(message);
}

function extractUpstreamStatus(message: string): number | null {
  const match = message.match(/^(\d{3})\b/);
  if (!match) {
    return null;
  }
  const status = Number(match[1]);
  return Number.isFinite(status) ? status : null;
}

function getAIConfig(): AiProviderConfig | null {
  const digitalOceanKey = process.env.DIGITALOCEAN_API_KEY?.trim();
  if (digitalOceanKey) {
    const configuredModel = process.env.DIGITALOCEAN_MODEL || process.env.AI_MODEL || "openai-gpt-oss-120b";
    return {
      client: new OpenAI({
        apiKey: digitalOceanKey,
        baseURL: (process.env.DIGITALOCEAN_BASE_URL || DEFAULT_DO_BASE_URL).trim()
      }),
      model: normalizeDigitalOceanModelId(configuredModel),
      providerLabel: "DigitalOcean"
    };
  }

  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  if (openAIKey) {
    return {
      client: new OpenAI({ apiKey: openAIKey }),
      model: process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini",
      providerLabel: "OpenAI"
    };
  }

  return null;
}

async function mockGenerate(prompt: string): Promise<{ html: string; summary: string }> {
  return {
    html: ensureElementIds(createDefaultTemplate(prompt)),
    summary: "Generated with local template engine (no AI provider key provided)."
  };
}

function applyInstructionToSnippet(snippet: string, instruction: string, elementId: string): string {
  let output = snippet;
  const lower = instruction.toLowerCase();

  if (lower.includes("rounded")) {
    if (output.includes("style=")) {
      output = output.replace(/style=\"([^\"]*)\"/, (_m, styles) => {
        if (styles.includes("border-radius")) {
          return `style=\"${styles}\"`;
        }
        return `style=\"${styles}; border-radius: 999px;\"`;
      });
    } else {
      output = output.replace(/^<([a-zA-Z0-9-]+)([^>]*)>/, `<$1$2 style=\"border-radius: 999px;\">`);
    }
  }

  if (lower.includes("blue")) {
    if (output.includes("style=")) {
      output = output.replace(/style=\"([^\"]*)\"/, (_m, styles) => {
        const extra = `${styles}; background: #0e6cff; color: #ffffff;`;
        return `style=\"${extra}\"`;
      });
    } else {
      output = output.replace(
        /^<([a-zA-Z0-9-]+)([^>]*)>/,
        `<$1$2 style=\"background: #0e6cff; color: #ffffff;\">`
      );
    }
  }

  if (!/\sdata-ai-id\s*=/.test(output)) {
    output = output.replace(/^<([a-zA-Z0-9-]+)([^>]*)>/, `<$1$2 data-ai-id=\"${elementId}\">`);
  }

  return output;
}

async function mockEdit(body: ParsedBody): Promise<{ updatedSnippet: string; explanation: string }> {
  const selected = body.selected;
  if (!selected || !body.instruction) {
    throw new Error("Missing selected element or instruction.");
  }

  const updatedSnippet = applyInstructionToSnippet(selected.snippet, body.instruction, selected.id);

  return {
    updatedSnippet,
    explanation: "Edited selected snippet using local fallback editor."
  };
}

async function runLocal(body: ParsedBody) {
  if (body.mode === "generate") {
    const fallback = await mockGenerate(body.prompt || "Generated landing page");
    return {
      ...fallback,
      summary: "AI provider unavailable; generated with local template engine."
    };
  }

  if (body.mode === "edit") {
    const fallback = await mockEdit(body);
    return {
      ...fallback,
      explanation: "AI provider unavailable; edit applied using local fallback editor."
    };
  }

  return {
    explanation:
      "AI provider unavailable. Local explain mode: this element represents the selected UI node and can be edited in isolation."
  };
}

async function runAI(body: ParsedBody) {
  const config = getAIConfig();
  if (!config) {
    return runLocal(body);
  }

  const { client, model, providerLabel } = config;

  try {
    if (body.mode === "generate") {
      const prompt = body.prompt || "Modern SaaS website";
      const system = `You generate complete websites. Return ONLY valid HTML with embedded CSS in one file.`;
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Create a complete responsive website for: ${prompt}. Include semantic HTML and embedded CSS.`
          }
        ],
        temperature: 0.7
      });

      const html = stripCodeFences(completion.choices[0]?.message?.content || createDefaultTemplate(prompt));
      return {
        html: ensureElementIds(html),
        summary: `Generated by ${providerLabel} model ${model}`
      };
    }

    if (body.mode === "edit") {
      if (!body.selected || !body.instruction) {
        throw new Error("Selected element and instruction are required for edit mode.");
      }

      const system = `You are a scoped code editor.
Return ONLY the updated HTML snippet for the selected element.
Rules:
- Keep data-ai-id unchanged.
- Modify only selected element.
- Do not return markdown.
- Do not output full document.`;

      const userPrompt = [
        `Selected snippet:\n${body.selected.snippet}`,
        body.selected.componentPath ? `Component path:\n${body.selected.componentPath}` : "",
        body.parentSnippet ? `Parent context:\n${body.parentSnippet}` : "",
        `Instruction:\n${body.instruction}`
      ]
        .filter(Boolean)
        .join("\n\n");

      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      });

      const updatedSnippet = stripCodeFences(completion.choices[0]?.message?.content?.trim() || "");
      if (!updatedSnippet) {
        throw new Error("AI returned an empty snippet.");
      }

      return {
        updatedSnippet,
        explanation: "Edited selected element with scoped AI prompt."
      };
    }

    const explainSystem = "Explain selected HTML element role in concise product-design language.";
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: explainSystem },
        {
          role: "user",
          content: `Selected element:\n${body.selected?.snippet || "unknown"}`
        }
      ],
      temperature: 0.4
    });

    return {
      explanation:
        completion.choices[0]?.message?.content?.trim() ||
        "This element is a selectable node mapped to source HTML and editable in isolation."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI provider error";
    if (isLikelyAIUpstreamError(message)) {
      throw new Error(`${providerLabel} API request failed (${model}): ${message}`);
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);
    const result = await runAI(body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    const upstreamStatus = extractUpstreamStatus(message);
    if (upstreamStatus && isLikelyAIUpstreamError(message)) {
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
