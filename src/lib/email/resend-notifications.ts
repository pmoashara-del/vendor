import { Resend } from "resend";

const FROM_DEFAULT = "Indore Araz Vendor Portal <onboarding@resend.dev>";

function getFrom(): string {
  return process.env.RESEND_FROM?.trim() || FROM_DEFAULT;
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendVendorRegistrationEmail(params: {
  to: string;
  companyName: string;
  contactName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend: RESEND_API_KEY not set — skipping registration email.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1c1b1b;">
  <p>Dear ${escapeHtml(params.contactName)},</p>
  <p>Thank you for submitting the vendor registration for <strong>${escapeHtml(params.companyName)}</strong> for <strong>Ashara Mubaraka 1448H</strong> (Indore Araz).</p>
  <p>We have received your application. The committee will review your profile and statutory details. You will be contacted if further information is required.</p>
  <p>This is an automated message; please do not reply to this email.</p>
  ${appUrl ? `<p><a href="${escapeHtml(appUrl)}">Open vendor portal</a></p>` : ""}
  <p style="margin-top:2rem;color:#717974;font-size:12px;">Indore Araz Committee</p>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: params.to,
      subject: "Vendor registration received — Ashara Mubaraka 1448H",
      html,
    });
    if (error) {
      console.error("Resend registration email error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("Resend registration email exception:", e);
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export async function sendVendorApprovedEmail(params: {
  to: string;
  companyName: string;
  contactName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend: RESEND_API_KEY not set — skipping approval email.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1c1b1b;">
  <p>Dear ${escapeHtml(params.contactName)},</p>
  <p>We are pleased to inform you that <strong>${escapeHtml(params.companyName)}</strong> has been <strong>approved</strong> as a registered vendor for Ashara Mubaraka 1448H (Indore Araz).</p>
  <p>Further communication regarding tenders, deliverables, and billing will follow from the committee as applicable.</p>
  ${appUrl ? `<p><a href="${escapeHtml(appUrl)}">Vendor portal</a></p>` : ""}
  <p style="margin-top:2rem;color:#717974;font-size:12px;">Indore Araz Committee</p>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: params.to,
      subject: "Vendor registration approved — Ashara Mubaraka 1448H",
      html,
    });
    if (error) {
      console.error("Resend approval email error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("Resend approval email exception:", e);
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export async function sendEoiSubmittedEmail(params: {
  to: string;
  referenceNumber: string;
  businessName: string;
  contactName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend: RESEND_API_KEY not set — skipping EOI receipt email.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1410;">
  <p>Dear ${escapeHtml(params.contactName)},</p>
  <p>We have received your <strong>Expression of Interest</strong> for <strong>${escapeHtml(params.businessName)}</strong>.</p>
  <p><strong>Reference:</strong> ${escapeHtml(params.referenceNumber)}</p>
  <p>Shortlisted vendors will be contacted for verification, table discussion, and next steps. Submission does not guarantee empanelment.</p>
  ${appUrl ? `<p><a href="${escapeHtml(appUrl)}">Vendor portal</a></p>` : ""}
  <p style="margin-top:2rem;color:#8a7a6e;font-size:12px;">Vendor Empanelment Programme · Indore Araz</p>
</body>
</html>`;
  try {
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: params.to,
      subject: `EOI received — ${params.referenceNumber}`,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export async function sendEoiMeetingInviteEmail(params: {
  to: string;
  businessName: string;
  contactName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not configured" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1410;">
  <p>Dear ${escapeHtml(params.contactName)},</p>
  <p>Congratulations — <strong>${escapeHtml(params.businessName)}</strong> has been <strong>shortlisted</strong> for the vendor empanelment programme.</p>
  <p>You are invited to <strong>showcase your products / services and discuss quotations</strong> in person with the committee at the designated table session. Please bring relevant samples, rate cards, and supporting information as discussed in prior communication.</p>
  <p>Further logistical details will be shared by the committee if applicable.</p>
  ${appUrl ? `<p><a href="${escapeHtml(appUrl)}">Open portal</a></p>` : ""}
  <p style="margin-top:2rem;color:#8a7a6e;font-size:12px;">Indore Araz Committee</p>
</body>
</html>`;
  try {
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: params.to,
      subject: "Shortlisted — invitation to table discussion (Vendor Empanelment)",
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export async function sendEoiRegistrationInviteEmail(params: {
  to: string;
  businessName: string;
  contactName: string;
  registrationUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not configured" };
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1410;">
  <p>Dear ${escapeHtml(params.contactName)},</p>
  <p>Following your discussion with the committee, <strong>${escapeHtml(params.businessName)}</strong> may proceed to the <strong>formal vendor registration</strong> stage.</p>
  <p>Please complete the full registration form using your personal link below. This captures statutory, bank, and document details that were not part of the Expression of Interest.</p>
  <p style="margin:20px 0"><a href="${escapeHtml(params.registrationUrl)}" style="display:inline-block;background:#7c3a1e;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:600;">Complete vendor registration</a></p>
  <p style="font-size:13px;color:#4a3f35">If the button does not work, copy and paste this URL into your browser:<br/><span style="word-break:break-all">${escapeHtml(params.registrationUrl)}</span></p>
  <p style="margin-top:2rem;color:#8a7a6e;font-size:12px;">Indore Araz Committee</p>
</body>
</html>`;
  try {
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: params.to,
      subject: "Action required — complete formal vendor registration",
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
