import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildEoiSummaryLines,
  eoiRowToPrefillAndServiceFlags,
  fetchEoiByInvitationToken,
  fetchEoiByReferenceForVendorLink,
} from "@/lib/vendors/eoi-reference";
import { isWellFormedEoiReference, normalizeEoiReference } from "@/lib/vendors/eoi-reference-format";

const bodySchema = z
  .object({
    reference: z.string().max(80).optional(),
    invitation_token: z.string().max(128).optional(),
  })
  .refine((d) => Boolean(d.reference?.trim() || d.invitation_token?.trim()), {
    message: "Provide reference or invitation_token",
  });

function jsonForLinkedEoi(row: Parameters<typeof buildEoiSummaryLines>[0]) {
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
}

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

  const token = parsed.data.invitation_token?.trim() ?? "";

  try {
    if (token.length >= 32) {
      const lookup = await fetchEoiByInvitationToken(token);
      if (!lookup.ok) {
        if (lookup.reason === "not_found") {
          return NextResponse.json({ error: "Invalid or expired registration link." }, { status: 404 });
        }
        if (lookup.reason === "already_registered") {
          return NextResponse.json({ error: "Registration is already complete for this invitation." }, { status: 409 });
        }
        return NextResponse.json({ error: "This invitation is no longer valid." }, { status: 403 });
      }
      return jsonForLinkedEoi(lookup.row);
    }

    const refNorm = normalizeEoiReference(parsed.data.reference ?? "");
    if (!isWellFormedEoiReference(refNorm)) {
      return NextResponse.json(
        {
          error:
            "Enter the EOI reference exactly as shown after submission (for example EOI-2026-ABC123 — letters and digits only after the year).",
        },
        { status: 422 },
      );
    }

    const lookup = await fetchEoiByReferenceForVendorLink(refNorm);
    if (!lookup.ok) {
      if (lookup.reason === "not_found") {
        return NextResponse.json(
          {
            error:
              "No Expression of Interest found for this reference. Copy it exactly from your EOI confirmation screen or email (format EOI-2026-ABC123).",
          },
          { status: 404 },
        );
      }
      if (lookup.reason === "already_registered") {
        return NextResponse.json(
          {
            error:
              "Vendor registration is already on file for this EOI reference. Use your confirmation email or contact the committee if you need help.",
          },
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

    return jsonForLinkedEoi(lookup.row);
  } catch (e) {
    console.error("eoi-by-reference:", e);
    return NextResponse.json(
      {
        error:
          "Could not look up EOI. If this keeps happening, ask the committee to confirm Supabase is configured on the server.",
      },
      { status: 500 },
    );
  }
}
