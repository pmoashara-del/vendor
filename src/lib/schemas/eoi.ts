import { z } from "zod";
import { validateGSTIN } from "@/lib/eoi/indian-gst-state";
import { panFourthCharMatchesEntityType } from "@/lib/eoi/pan-entity-consistency";

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const eoiSubmitSchemaBase = z.object({
  business_name: z.string().min(1).max(500),
  entity_type: z.string().min(1).max(200),
  year_established: z.coerce.number().int().min(1950).max(2030),
  business_city: z.string().min(1).max(200),
  business_state: z.string().min(1).max(200),
  business_address: z.string().min(1).max(4000),

  contact_person_name: z.string().min(1).max(200),
  contact_role: z.string().max(200).optional().nullable(),
  its_number: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v == null || v === "") return null;
      return String(v).replace(/\D/g, "");
    })
    .refine((s): s is string | null => s === null || /^\d{8}$/.test(s), {
      message: "ITS number must be exactly 8 digits or left blank",
    }),
  mobile: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine((d) => d.length === 10, "Enter a valid 10-digit mobile number"),
  email: z.string().email().max(320),

  primary_category: z.string().min(1).max(500),
  departments_served: z.array(z.string().max(100)).default([]),
  zones: z.array(z.string().max(100)).min(1, "Select at least one zone"),
  can_work_in_programme_location: z.enum(["Yes", "No", "Limited"]),
  experience_years: z.string().min(1).max(100),
  turnover_range: z.string().max(200).optional().nullable(),
  capability_description: z.string().min(1).max(500),
  previous_work: z.string().max(400).optional().nullable(),

  pan_number: z
    .string()
    .transform((s) => s.toUpperCase().replace(/\s/g, ""))
    .refine((s) => panRegex.test(s), "Invalid PAN"),
  gst_number: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v == null || v === "") return null;
      const t = String(v).toUpperCase().replace(/\s/g, "");
      return t === "" ? null : t;
    })
    .refine((v) => v === null || validateGSTIN(v), {
      message: "Invalid GSTIN or leave blank",
    }),
  gst_status: z.string().min(1).max(100),
  msme_status: z.string().max(100).optional().nullable(),
  certifications: z.string().max(300).optional().nullable(),
  source: z.string().max(200).optional().nullable(),

  declaration_accepted: z.boolean().refine((v) => v === true, "You must accept the declaration"),
});

export const eoiSubmitSchema = eoiSubmitSchemaBase.superRefine((data, ctx) => {
  if (data.gst_status === "Registered") {
    if (data.gst_number == null || !validateGSTIN(data.gst_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid GSTIN is required when GST status is Registered",
        path: ["gst_number"],
      });
    }
  } else if (data.gst_number != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "GST number must be omitted unless GST status is Registered",
      path: ["gst_number"],
    });
  }
  if (!panFourthCharMatchesEntityType(data.pan_number, data.entity_type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "PAN 4th character does not match the selected entity type",
      path: ["pan_number"],
    });
  }
});

export type EoiSubmitPayload = z.infer<typeof eoiSubmitSchema>;
