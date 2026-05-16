/** Primary category options (Expression of Interest) — grouped for select UI */

export const EOI_CATEGORY_GROUPS: { label: string; options: string[] }[] = [
  {
    label: "Food & Catering",
    options: [
      "Catering / Mass Meals",
      "Dry Rations / Grocery Supply",
      "Packaged Food / Beverages",
      "Fruits & Vegetables",
      "Dairy Products",
    ],
  },
  {
    label: "Infrastructure & Civil",
    options: [
      "Tents / Shamianas / Canopy",
      "Furniture & Fixtures",
      "Temporary Structures / Fabrication",
      "Sanitation & Hygiene Services",
      "Cleaning & Housekeeping",
    ],
  },
  {
    label: "Electrical & Technology",
    options: [
      "Electrical Works & Lighting",
      "Generator / Power Supply",
      "AV Equipment / Sound System",
      "IT & Communication Equipment",
    ],
  },
  {
    label: "Transport & Logistics",
    options: ["Vehicle Hire / Transportation", "Loading / Unloading Services", "Courier & Delivery"],
  },
  {
    label: "Printing & Stationery",
    options: ["Printing & Signage", "Stationery & Office Supplies", "Packaging Material"],
  },
  {
    label: "Security & Manpower",
    options: ["Security Services", "Labour & Manpower Supply", "Crowd Management"],
  },
  {
    label: "Other",
    options: [
      "Medical / First Aid Supplies",
      "Decoration & Floral",
      "Uniforms & Garments",
      "Other — specify below",
    ],
  },
];

export const EOI_DEPARTMENTS = [
  "Catering",
  "Infrastructure",
  "Electrical",
  "Transport",
  "Sanitation",
  "Security",
  "IT",
  "Stationery",
  "All",
] as const;

export const EOI_DEPARTMENT_LABELS: Record<string, string> = {
  Catering: "Catering Dept",
  Infrastructure: "Infrastructure",
  Electrical: "Electrical",
  Transport: "Transport",
  Sanitation: "Sanitation",
  Security: "Security",
  IT: "IT & Tech",
  Stationery: "Stationery",
  All: "All Departments",
};

/** Single programme geography — one checkbox on the form */
export const EOI_PROGRAMME_ZONE = "Indore, Madhya Pradesh" as const;
export const EOI_ZONES = [EOI_PROGRAMME_ZONE] as const;

/** Whether the applicant can take on work based in the programme area */
export const EOI_CAN_WORK_IN_LOCATION = ["Yes", "No", "Limited"] as const;
export type EoiCanWorkInLocation = (typeof EOI_CAN_WORK_IN_LOCATION)[number];

export const EOI_CAN_WORK_IN_LOCATION_LABELS: Record<EoiCanWorkInLocation, string> = {
  Yes: "Yes — we can take on work based in Indore / Madhya Pradesh",
  No: "No — not for this geography at present",
  Limited: "Limited — only for certain assignments (give detail under capability)",
};

export const EOI_ENTITY_TYPES = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited Company",
  "Public Limited Company",
  "HUF",
  "Society / Trust",
  "Other",
] as const;

export const EOI_EXPERIENCE = [
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "5–10 years",
  "More than 10 years",
] as const;

export const EOI_TURNOVER = [
  "Below ₹10 Lakh",
  "₹10L – ₹50L",
  "₹50L – ₹1 Cr",
  "₹1 Cr – ₹5 Cr",
  "Above ₹5 Cr",
  "Prefer not to say",
] as const;

export const EOI_GST_STATUS = ["Registered", "Composition", "Unregistered", "Exempt"] as const;

export const EOI_MSME = ["Yes – Registered", "Applied", "No"] as const;

export const EOI_SOURCE = [
  "Official Notice / Circular",
  "Existing Vendor / Referral",
  "Website / Online",
  "Social Media",
  "Community / Jamaat Network",
  "Personal Approach",
  "Other",
] as const;
