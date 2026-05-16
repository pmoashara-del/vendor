import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { analyzeSingleVendorWithOpenAI, analyzeVendorPortfolioWithOpenAI } from "@/lib/ai/openai-analyze";
import { buildAggregateLines, toVendorAiSnapshot, toVendorAiSnapshotDetail } from "@/lib/ai/vendor-snapshots";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { VendorRegistrationRow } from "@/types/vendor";

const MAX_PORTFOLIO_SNAPSHOTS = 55;

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.res;

  let body: { vendorId?: string } = {};
  try {
    const j = await req.json();
    if (j && typeof j === "object") body = j as { vendorId?: string };
  } catch {
    /* portfolio mode */
  }

  try {
    const supabase = createServiceSupabase();
    const vendorId = typeof body.vendorId === "string" ? body.vendorId.trim() : "";

    if (vendorId) {
      const { data, error } = await supabase
        .from("vendor_registration")
        .select("*")
        .eq("id", vendorId)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
      }

      const snapshot = toVendorAiSnapshotDetail(data as VendorRegistrationRow);
      const analysis = await analyzeSingleVendorWithOpenAI(snapshot);
      return NextResponse.json({ scope: "vendor", vendorId, analysis });
    }

    const { data: vendors, error } = await supabase
      .from("vendor_registration")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_PORTFOLIO_SNAPSHOTS);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to load vendors" }, { status: 500 });
    }

    const rows = (vendors ?? []) as VendorRegistrationRow[];
    const aggregates = buildAggregateLines(rows);
    const snapshots = rows.map(toVendorAiSnapshot);

    const analysis = await analyzeVendorPortfolioWithOpenAI({
      aggregateLines: aggregates,
      vendorSnapshots: snapshots,
    });

    return NextResponse.json({
      scope: "portfolio",
      analyzed_count: rows.length,
      analysis,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    if (msg.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "AI is not configured. Add OPENAI_API_KEY to .env.local (server only)." },
        { status: 503 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
