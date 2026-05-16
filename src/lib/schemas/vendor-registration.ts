import { z } from "zod";
import { validateGSTIN, validatePAN } from "@/lib/india-pan-gstin";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

function parseMoneyInput(v: unknown): number | null | undefined {
  if (v === "" || v === undefined || v === null) return null;
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

const itsRegex = /^\d{8}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const pinRegex = /^\d{6}$/;
const mobileDigitsRegex = /^\+91[1-9]\d{9}$/;

const optionalMoneySchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform(parseMoneyInput)
  .refine((v): v is number | null => v !== undefined, {
    message: "Enter a valid non-negative turnover amount or leave blank",
  });

export const vendorRegistrationPayloadSchema = z
  .object({
    its_number: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((v) => {
        if (v === "" || v === null || v === undefined) return null;
        return String(v).replace(/\D/g, "");
      })
      .refine((s): s is string | null => s === null || itsRegex.test(s), {
        message: "ITS number must be exactly 8 digits",
      }),

    company_name: z.string().min(1).max(500),
    vendor_type: z.string().min(1).max(200),
    constitution_of_business: z.string().min(1).max(200),
    year_of_establishment: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
      z.number().int().min(1800).max(2100).nullable(),
    ),
    registered_address: z.string().min(1).max(2000),
    city: z.string().min(1).max(200),
    state: z.string().min(1).max(200),
    country: z.string().min(1).max(200).default("India"),
    pin_code: z.string().regex(pinRegex, "PIN must be 6 digits"),

    primary_contact_person: z.string().min(1).max(200),
    contact_designation: z.preprocess(emptyToNull, z.string().max(200).nullable()),
    mobile_number: z
      .string()
      .transform((s) => s.replace(/\s/g, ""))
      .refine((s) => mobileDigitsRegex.test(s), "Use +91 followed by a valid 10-digit mobile"),
    alternate_mobile: z
      .string()
      .optional()
      .transform((s) => (s ? s.replace(/\s/g, "") : ""))
      .refine((s) => s === "" || mobileDigitsRegex.test(s), "Alternate must be +91 + 10 digits or empty"),
    email: z.string().email().max(320),
    website: z
      .string()
      .max(500)
      .optional()
      .transform((s) => {
        if (!s) return null;
        const t = s.trim();
        if (!t) return null;
        try {
          new URL(t);
          return t;
        } catch {
          return null;
        }
      }),

    pan_number: z
      .string()
      .transform((s) => s.toUpperCase().replace(/\s/g, ""))
      .refine((s) => validatePAN(s), "Invalid PAN format"),
    gst_registered: z.boolean(),
    gstin: z.preprocess(
      (v) => (v === "" || v === undefined ? null : String(v).toUpperCase().replace(/\s/g, "")),
      z.string().length(15).nullable(),
    ),
    msme_registered: z.boolean(),
    msme_udyam_number: z.preprocess(emptyToNull, z.string().max(100).nullable()),
    tan_number: z.preprocess(emptyToNull, z.string().max(20).nullable()),
    tds_applicability: z.preprocess(emptyToNull, z.string().max(200).nullable()),
    aadhaar_linked_with_pan: z.enum(["yes", "no", "unknown"], {
      message: "Select Aadhaar–PAN linking status",
    }),

    bank_name: z.string().min(1).max(200),
    branch_name: z.string().min(1).max(200),
    account_holder_name: z.string().min(1).max(200),
    account_number: z
      .string()
      .transform((s) => s.replace(/\D/g, ""))
      .refine((s) => s.length >= 6 && s.length <= 18, "Account number must be 6–18 digits"),
    ifsc_code: z
      .string()
      .transform((s) => s.toUpperCase().replace(/\s/g, ""))
      .refine((s) => ifscRegex.test(s), "Invalid IFSC"),
    account_type: z.string().min(1).max(100),

    main_category: z.string().min(1).max(200),
    sub_category: z.preprocess(emptyToNull, z.string().max(200).nullable()),
    products_services_offered: z.string().min(1).max(4000),
    service_location_other: z.boolean(),
    service_location_pan_india: z.boolean(),
    service_location_madhya_pradesh: z.boolean(),
    service_location_indore: z.boolean(),
    turnover_fy_2023_24: optionalMoneySchema,
    turnover_fy_2024_25: optionalMoneySchema,
    turnover_fy_2025_26: optionalMoneySchema,
    expected_credit_period: z.preprocess(emptyToNull, z.string().max(100).nullable()),

    reference_1_name: z.preprocess(emptyToNull, z.string().max(200).nullable()),
    reference_1_contact: z.preprocess(emptyToNull, z.string().max(200).nullable()),
    reference_2_name: z.preprocess(emptyToNull, z.string().max(200).nullable()),
    reference_2_contact: z.preprocess(emptyToNull, z.string().max(200).nullable()),

    doc_pan_card: z.boolean().refine((v) => v === true, { message: "PAN Card document required" }),
    doc_cancelled_cheque: z.boolean().refine((v) => v === true, {
      message: "Cancelled Cheque document required",
    }),
    doc_address_proof: z.boolean().refine((v) => v === true, {
      message: "Address Proof document required",
    }),
    doc_company_registration: z.boolean().refine((v) => v === true, {
      message: "Company / Firm Registration Certificate required",
    }),
    doc_gst_certificate: z.boolean(),
    doc_msme_certificate: z.boolean(),
    doc_other: z.boolean(),
    doc_other_description: z.preprocess(emptyToNull, z.string().max(500).nullable()),

    policy_accepted: z.boolean().refine((v) => v === true, { message: "Accept policies to continue" }),

    /** From invitation email after committee meeting — required for new full registrations */
    invitation_token: z.string().min(32, "Use the registration link from your invitation email"),

    declaration_authorized_person_name: z.string().min(1).max(200),
    declaration_designation: z.string().min(1).max(200),
    declaration_date: z.string().min(1),
    declaration_place: z.string().min(1).max(200),
  })
  .superRefine((data, ctx) => {
    if (data.gst_registered) {
      if (!data.gstin || data.gstin.length !== 15 || !validateGSTIN(data.gstin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gstin"],
          message: "Enter a valid 15-character GSTIN when GST registered",
        });
      }
    }
    if (!data.gst_registered && data.doc_gst_certificate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doc_gst_certificate"],
        message: "GST certificate not applicable when not GST registered",
      });
    }
    if (!data.msme_registered && data.doc_msme_certificate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doc_msme_certificate"],
        message: "MSME certificate not applicable when not MSME registered",
      });
    }
    if (data.doc_other && !data.doc_other_description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doc_other_description"],
        message: "Describe other documents when selected",
      });
    }
  });

export type VendorRegistrationPayload = z.infer<typeof vendorRegistrationPayloadSchema>;
