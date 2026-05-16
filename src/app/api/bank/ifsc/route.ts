import { NextResponse } from "next/server";

/** Razorpay public IFSC toolkit — no API key. https://github.com/razorpay/ifsc/wiki/API */
const RAZORPAY_IFSC_BASE = "https://ifsc.razorpay.com";

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

type RazorpayIfscResponse = {
  BANK?: string;
  BRANCH?: string;
  ADDRESS?: string;
  CITY?: string | null;
  DISTRICT?: string | null;
  STATE?: string | null;
  CENTRE?: string | null;
  MICR?: string | null;
  IFSC?: string;
  CONTACT?: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("code") ?? searchParams.get("ifsc") ?? "";
  const ifsc = raw.toUpperCase().replace(/\s/g, "");

  if (ifsc.length < 11) {
    return NextResponse.json(
      { error: "Enter a complete 11-character IFSC", valid: false },
      { status: 400 },
    );
  }

  if (!IFSC_REGEX.test(ifsc)) {
    return NextResponse.json(
      { error: "Invalid IFSC format (4 letters, 0, then 6 alphanumeric)", valid: false },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${RAZORPAY_IFSC_BASE}/${encodeURIComponent(ifsc)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (upstream.status === 404) {
      return NextResponse.json(
        { error: "IFSC not found in Razorpay / RBI dataset", valid: false },
        { status: 404 },
      );
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "IFSC lookup service temporarily unavailable", valid: false },
        { status: 502 },
      );
    }

    const data = (await upstream.json()) as RazorpayIfscResponse;

    const bankName = typeof data.BANK === "string" ? data.BANK.trim() : "";
    const branchName = typeof data.BRANCH === "string" ? data.BRANCH.trim() : "";

    return NextResponse.json({
      valid: true,
      ifsc: data.IFSC ?? ifsc,
      bank_name: bankName,
      branch_name: branchName,
      address: typeof data.ADDRESS === "string" ? data.ADDRESS.trim() : null,
      city: data.CITY ?? null,
      district: data.DISTRICT ?? null,
      state: data.STATE ?? null,
      centre: data.CENTRE ?? null,
      micr: data.MICR && data.MICR !== "" && data.MICR !== "NA" ? String(data.MICR) : null,
      contact: data.CONTACT ?? null,
    });
  } catch (e) {
    console.error("IFSC lookup failed:", e);
    return NextResponse.json(
      { error: "Could not reach IFSC verification service", valid: false },
      { status: 503 },
    );
  }
}
