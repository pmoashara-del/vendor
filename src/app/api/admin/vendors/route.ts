import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.res;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("vendor_registration")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to load vendors" }, { status: 500 });
    }

    return NextResponse.json({ vendors: data ?? [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Supabase service role not configured" }, { status: 500 });
  }
}
