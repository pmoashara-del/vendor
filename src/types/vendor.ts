export type RegistrationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "on_hold";

export interface VendorRegistrationRow {
  id: string;
  created_at: string;
  updated_at: string;
  registration_status: RegistrationStatus;
  its_number: string | null;
  company_name: string;
  vendor_type: string;
  constitution_of_business: string;
  year_of_establishment: number | null;
  registered_address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  primary_contact_person: string;
  contact_designation: string | null;
  mobile_number: string;
  alternate_mobile: string | null;
  email: string;
  website: string | null;
  pan_number: string;
  gst_registered: boolean;
  gstin: string | null;
  msme_registered: boolean;
  msme_udyam_number: string | null;
  tan_number: string | null;
  tds_applicability: string | null;
  aadhaar_linked_with_pan: string;
  bank_name: string;
  branch_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  main_category: string;
  sub_category: string | null;
  products_services_offered: string;
  service_location_other: boolean;
  service_location_pan_india: boolean;
  service_location_madhya_pradesh: boolean;
  service_location_indore: boolean;
  additional_service_locations: string | null;
  turnover_fy_2023_24: string | number | null;
  turnover_fy_2024_25: string | number | null;
  turnover_fy_2025_26: string | number | null;
  expected_credit_period: string | null;
  reference_1_name: string | null;
  reference_1_contact: string | null;
  reference_2_name: string | null;
  reference_2_contact: string | null;
  doc_pan_card: boolean;
  doc_cancelled_cheque: boolean;
  doc_address_proof: boolean;
  doc_company_registration: boolean;
  doc_gst_certificate: boolean;
  doc_msme_certificate: boolean;
  doc_other: boolean;
  doc_other_description: string | null;
  policy_accepted: boolean;
  declaration_authorized_person_name: string;
  declaration_designation: string;
  declaration_date: string;
  declaration_place: string;
  eoi_id?: string | null;
}
