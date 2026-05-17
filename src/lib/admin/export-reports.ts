import * as XLSX from "xlsx";
import { eoiCategorySummaryLine } from "@/lib/eoi/eoi-row-display";
import type { ExpressionOfInterestRow } from "@/types/eoi";
import type { VendorRegistrationRow } from "@/types/vendor";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toDownloadBlobPart(content: ArrayBuffer | Uint8Array): Uint8Array {
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  const next = new Uint8Array(content.byteLength);
  next.set(content);
  return next;
}

function downloadTextOrBinary(content: string | ArrayBuffer | Uint8Array, filename: string, mime: string) {
  const blob =
    typeof content === "string"
      ? new Blob(["\ufeff", content], { type: `${mime};charset=utf-8` })
      : new Blob([toDownloadBlobPart(content) as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the browser can start reading the blob URL (sync revoke can cancel downloads).
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Human-readable workflow / actions from persisted EOI fields (no separate audit log). */
export function eoiWorkflowActionsSummary(row: ExpressionOfInterestRow): string {
  const parts: string[] = [];
  parts.push(`Current status: ${row.eoi_status.replaceAll("_", " ")}`);
  if (row.meeting_invite_sent_at) {
    parts.push(`Table / meeting invite email recorded: ${row.meeting_invite_sent_at}`);
  } else {
    parts.push("Meeting invite: not recorded");
  }
  if (row.registration_token_hash) {
    parts.push("Registration invite token: issued (hash stored)");
  } else {
    parts.push("Registration invite token: not issued");
  }
  if (row.registration_token_used_at) {
    parts.push(`Registration link used: ${row.registration_token_used_at}`);
  } else {
    parts.push("Registration link used: no");
  }
  if (row.registration_token_expires_at) {
    parts.push(`Registration token expires: ${row.registration_token_expires_at}`);
  }
  if (row.vendor_registration_id) {
    parts.push(`Linked vendor registration id: ${row.vendor_registration_id}`);
  }
  parts.push(`Record last updated: ${row.updated_at}`);
  return parts.join(" · ");
}

export function vendorWorkflowSummary(v: VendorRegistrationRow): string {
  const parts: string[] = [];
  parts.push(`Registration status: ${v.registration_status.replaceAll("_", " ")}`);
  if (v.eoi_id) parts.push(`Linked EOI id: ${v.eoi_id}`);
  parts.push(`Submitted: ${v.created_at}`);
  parts.push(`Last updated: ${v.updated_at}`);
  return parts.join(" · ");
}

function docShell(title: string, innerHtml: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.35;color:#111">
<h1 style="font-size:16pt;margin:0 0 12pt">${escapeHtml(title)}</h1>
${innerHtml}
<p style="margin-top:20pt;font-size:9pt;color:#666">Generated from admin dashboard · ${escapeHtml(new Date().toISOString())}</p>
</body></html>`;
}

function dlItem(label: string, value: string): string {
  return `<div style="margin:6pt 0"><strong>${escapeHtml(label)}</strong><br/>${escapeHtml(value)}</div>`;
}

export function downloadEoiAdminDoc(row: ExpressionOfInterestRow) {
  const cats = eoiCategorySummaryLine(row);
  const inner = [
    dlItem("Reference", row.reference_number),
    dlItem("EOI status", row.eoi_status.replaceAll("_", " ")),
    dlItem("Workflow / actions (from system fields)", eoiWorkflowActionsSummary(row)),
    dlItem("Submitted", row.created_at),
    dlItem("Last updated", row.updated_at),
    dlItem("Business name", row.business_name),
    dlItem("Entity type", row.entity_type),
    dlItem("Year established", String(row.year_established)),
    dlItem("Address", [row.business_address, row.business_city, row.business_state].filter(Boolean).join(", ")),
    dlItem("Contact", `${row.contact_person_name}${row.contact_role ? ` (${row.contact_role})` : ""}`),
    dlItem("Mobile", row.mobile),
    dlItem("Email", row.email),
    dlItem("ITS number", row.its_number ?? "—"),
    dlItem("Categories", cats || "—"),
    dlItem("Capability", row.capability_description),
    dlItem("Previous work", row.previous_work ?? "—"),
    dlItem("PAN", row.pan_number),
    dlItem("GST number", row.gst_number ?? "—"),
    dlItem("GST status", row.gst_status),
    dlItem("Programme work (Indore/MP)", row.can_work_in_programme_location ?? "—"),
    dlItem("Also supplies elsewhere", row.also_supplies_other_locations ?? "—"),
    dlItem("Other locations detail", row.other_supply_locations_detail ?? "—"),
  ].join("");
  const html = docShell(`EOI — ${row.reference_number}`, inner);
  const safe = row.reference_number.replace(/[^A-Za-z0-9-]+/g, "_");
  downloadTextOrBinary(html, `EOI-${safe}.doc`, "application/msword");
}

export function downloadVendorAdminDoc(v: VendorRegistrationRow) {
  const inner = [
    dlItem("Company", v.company_name),
    dlItem("Registration status", v.registration_status.replaceAll("_", " ")),
    dlItem("Workflow summary", vendorWorkflowSummary(v)),
    dlItem("Vendor type", v.vendor_type),
    dlItem("Constitution", v.constitution_of_business),
    dlItem("Year of establishment", v.year_of_establishment != null ? String(v.year_of_establishment) : "—"),
    dlItem("Registered address", v.registered_address),
    dlItem("City / State / PIN", `${v.city}, ${v.state} ${v.pin_code}`),
    dlItem("Contact", `${v.primary_contact_person}${v.contact_designation ? ` (${v.contact_designation})` : ""}`),
    dlItem("Mobile", v.mobile_number),
    dlItem("Email", v.email),
    dlItem("ITS number", v.its_number ?? "—"),
    dlItem("PAN", v.pan_number),
    dlItem("GST registered", v.gst_registered ? "Yes" : "No"),
    dlItem("GSTIN", v.gstin ?? "—"),
    dlItem("MSME", v.msme_registered ? `Yes · ${v.msme_udyam_number ?? ""}` : "No"),
    dlItem("Products / services", v.products_services_offered),
    dlItem(
      "Service locations",
      [
        v.service_location_pan_india ? "PAN India" : null,
        v.service_location_madhya_pradesh ? "Madhya Pradesh" : null,
        v.service_location_indore ? "Indore" : null,
        v.additional_service_locations?.trim() || null,
      ]
        .filter(Boolean)
        .join("; ") || "—",
    ),
  ].join("");
  const html = docShell(`Vendor — ${v.company_name}`, inner);
  const safe = v.company_name.replace(/[^A-Za-z0-9-]+/g, "_").slice(0, 60);
  downloadTextOrBinary(html, `Vendor-${safe}-${v.id.slice(0, 8)}.doc`, "application/msword");
}

export function exportEoiListToXlsx(rows: ExpressionOfInterestRow[], filename: string) {
  const data = rows.map((row) => {
    const cats = eoiCategorySummaryLine(row);
    return {
      reference_number: row.reference_number,
      eoi_status: row.eoi_status,
      workflow_actions_summary: eoiWorkflowActionsSummary(row),
      submitted_at: row.created_at,
      last_updated_at: row.updated_at,
      business_name: row.business_name,
      categories: cats,
      email: row.email,
      its_number: row.its_number ?? "",
      contact_person: row.contact_person_name,
      mobile: row.mobile,
      business_city: row.business_city ?? "",
      business_state: row.business_state ?? "",
      can_work_indore_mp: row.can_work_in_programme_location ?? "",
      also_supplies_elsewhere: row.also_supplies_other_locations ?? "",
      other_locations_detail: row.other_supply_locations_detail ?? "",
      meeting_invite_sent_at: row.meeting_invite_sent_at ?? "",
      registration_token_used_at: row.registration_token_used_at ?? "",
      registration_token_expires_at: row.registration_token_expires_at ?? "",
      vendor_registration_id: row.vendor_registration_id ?? "",
      capability_excerpt: (row.capability_description ?? "").slice(0, 500),
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "EOI");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadTextOrBinary(out, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export function exportVendorListToXlsx(rows: VendorRegistrationRow[], filename: string) {
  const data = rows.map((v) => ({
    id: v.id,
    registration_status: v.registration_status,
    workflow_summary: vendorWorkflowSummary(v),
    submitted_at: v.created_at,
    last_updated_at: v.updated_at,
    company_name: v.company_name,
    vendor_type: v.vendor_type,
    city: v.city,
    state: v.state,
    primary_contact: v.primary_contact_person,
    email: v.email,
    mobile: v.mobile_number,
    gst_registered: v.gst_registered ? "Yes" : "No",
    gstin: v.gstin ?? "",
    pan_number: v.pan_number,
    its_number: v.its_number ?? "",
    eoi_id: v.eoi_id ?? "",
    products_excerpt: (v.products_services_offered ?? "").slice(0, 400),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vendors");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadTextOrBinary(out, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
