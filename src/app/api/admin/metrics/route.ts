import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { VendorRegistrationRow } from "@/types/vendor";

function countBy(rows: VendorRegistrationRow[], key: keyof VendorRegistrationRow) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = String(r[key] ?? "unknown");
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Object.fromEntries(map);
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.res;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("vendor_registration").select("*");

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
    }

    const vendors = (data ?? []) as VendorRegistrationRow[];
    const total = vendors.length;
    const byStatus = countBy(vendors, "registration_status");
    const byVendorType = countBy(vendors, "vendor_type");
    const byState = countBy(vendors, "state");
    const gstRegistered = vendors.filter((v) => v.gst_registered).length;
    const msmeRegistered = vendors.filter((v) => v.msme_registered).length;

    const last7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = vendors.filter((v) => new Date(v.created_at).getTime() >= last7).length;

    return NextResponse.json({
      total,
      newThisWeek,
      gstRegistered,
      msmeRegistered,
      byStatus,
      byVendorType,
      byState,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Supabase service role not configured" }, { status: 500 });
  }
}
