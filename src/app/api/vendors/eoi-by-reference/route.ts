import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildEoiSummaryLines,
  eoiRowToPrefillAndServiceFlags,
  fetchEoiByReferenceForVendorLink,
  isWellFormedEoiReference,
  normalizeEoiReference,
} from "@/lib/vendors/eoi-reference";

const bodySchema = z.object({
  reference: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const refNorm = normalizeEoiReference(parsed.data.reference);
  if (!isWellFormedEoiReference(refNorm)) {
    return NextResponse.json(
      {
        error:
          "Enter the EOI reference exactly as shown after submission (for example EOI-2026-ABC123 — letters and digits only after the year).",
      },
      { status: 422 },
    );
  }

  try {
    const lookup = await fetchEoiByReferenceForVendorLink(refNorm);
    if (!lookup.ok) {
      if (lookup.reason === "not_found") {
        return NextResponse.json(
          { error: "No Expression of Interest found for this reference. Copy the reference from your EOI confirmation screen or email." },
          { status: 404 },
        );
      }
      if (lookup.reason === "already_registered") {
        return NextResponse.json(
          { error: "Vendor registration is already on file for this EOI reference. Use your confirmation email or contact the committee if you need help." },
          { status: 409 },
        );
      }
      if (lookup.reason === "not_eligible") {
        return NextResponse.json(
          { error: "This Expression of Interest is not open for self-service registration. Contact the committee." },
          { status: 403 },
        );
      }
      return NextResponse.json(
        {
          error:
            "This EOI is linked to a committee invitation. Open the secure registration link from your email to complete vendor registration.",
        },
        { status: 403 },
      );
    }

    const { row } = lookup;
    const { prefill, ...svc } = eoiRowToPrefillAndServiceFlags(row);

    return NextResponse.json(
      {
        found: true,
        reference_number: row.reference_number,
        summary_lines: buildEoiSummaryLines(row),
        prefill,
        ...svc,
      },
      { status: 200 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
}
