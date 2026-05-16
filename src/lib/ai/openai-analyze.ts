/** Structured AI output for vendor intelligence (OpenAI JSON mode). */

export interface AiMetricInsight {
  label: string;
  value: string;
  note: string;
}

export interface VendorPortfolioAnalysis {
  executive_summary: string;
  key_metrics: AiMetricInsight[];
  strengths: string[];
  risks_or_gaps: string[];
  recommended_actions: string[];
  diversity_or_coverage_note: string;
}

const ANALYSIS_JSON_INSTRUCTION = `Respond with ONLY valid JSON matching this shape (no markdown):
{
  "executive_summary": "2-4 sentences for the committee",
  "key_metrics": [{"label":"short title","value":"concise stat or estimate","note":"one line interpretation"}],
  "strengths": ["bullet", "..."],
  "risks_or_gaps": ["bullet", "..."],
  "recommended_actions": ["bullet", "..."],
  "diversity_or_coverage_note": "one paragraph on geography / categories / GST spread"
}
Use at least 3 and at most 6 key_metrics. Be factual; flag uncertainty when data is thin.`;

export async function analyzeVendorPortfolioWithOpenAI(params: {
  aggregateLines: string[];
  vendorSnapshots: Record<string, unknown>[];
}): Promise<VendorPortfolioAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const userPayload = {
    instruction:
      "You assist an Ashara / procurement committee reviewing vendor registrations. Data is anonymized for business profiling only (no bank or tax IDs).",
    aggregates: params.aggregateLines,
    vendors: params.vendorSnapshots,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a senior vendor-intelligence analyst. ${ANALYSIS_JSON_INSTRUCTION}`,
        },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = body.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty response from OpenAI");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Model returned non-JSON");
  }

  return normalizeAnalysis(parsed);
}

export async function analyzeSingleVendorWithOpenAI(snapshot: Record<string, unknown>): Promise<{
  executive_summary: string;
  fit_assessment: string;
  diligence_flags: string[];
  suggested_follow_ups: string[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const schemaHint = `Respond with ONLY valid JSON:
{"executive_summary":"...","fit_assessment":"2-4 sentences","diligence_flags":["..."],"suggested_follow_ups":["..."]}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Committee vendor reviewer. ${schemaHint} Do not invent statutory numbers; note missing data as flags.`,
        },
        { role: "user", content: JSON.stringify({ vendor: snapshot }) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = body.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    executive_summary: String(parsed.executive_summary ?? ""),
    fit_assessment: String(parsed.fit_assessment ?? ""),
    diligence_flags: Array.isArray(parsed.diligence_flags)
      ? (parsed.diligence_flags as unknown[]).map((x) => String(x))
      : [],
    suggested_follow_ups: Array.isArray(parsed.suggested_follow_ups)
      ? (parsed.suggested_follow_ups as unknown[]).map((x) => String(x))
      : [],
  };
}

function normalizeAnalysis(parsed: unknown): VendorPortfolioAnalysis {
  const o = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  const key_metrics: AiMetricInsight[] = Array.isArray(o.key_metrics)
    ? (o.key_metrics as unknown[])
        .filter((x) => x && typeof x === "object")
        .map((x) => {
          const r = x as Record<string, unknown>;
          return {
            label: String(r.label ?? ""),
            value: String(r.value ?? ""),
            note: String(r.note ?? ""),
          };
        })
        .filter((m) => m.label.length > 0)
    : [];

  return {
    executive_summary: String(o.executive_summary ?? ""),
    key_metrics: key_metrics.slice(0, 8),
    strengths: stringArray(o.strengths),
    risks_or_gaps: stringArray(o.risks_or_gaps),
    recommended_actions: stringArray(o.recommended_actions),
    diversity_or_coverage_note: String(o.diversity_or_coverage_note ?? ""),
  };
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter((s) => s.length > 0);
}
