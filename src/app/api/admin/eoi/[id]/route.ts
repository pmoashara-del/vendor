import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

const patchSchema = z.object({
  eoi_status: z.enum(["submitted", "shortlisted", "meeting_invited", "invited_to_register", "declined", "registered"]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from("expression_of_interest")
      .update({ eoi_status: parsed.data.eoi_status })
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
