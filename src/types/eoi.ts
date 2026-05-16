export type EoiStatus =
  | "submitted"
  | "shortlisted"
  | "meeting_invited"
  | "invited_to_register"
  | "declined"
  | "registered";

export interface ExpressionOfInterestRow {
  id: string;
  created_at: string;
  updated_at: string;
  reference_number: string;
  eoi_status: EoiStatus;
  business_name: string;
  entity_type: string;
  year_established: number;
  business_city: string | null;
  business_state: string | null;
  business_address: string;
  contact_person_name: string;
  contact_role: string | null;
  its_number: string | null;
  mobile: string;
  email: string;
  primary_category: string;
  departments_served: unknown;
  zones: unknown;
  can_work_in_programme_location: string | null;
  experience_years: string;
  turnover_range: string | null;
  capability_description: string;
  previous_work: string | null;
  pan_number: string;
  gst_number: string | null;
  gst_status: string;
  msme_status: string | null;
  certifications: string | null;
  source: string | null;
  declaration_accepted: boolean;
  meeting_invite_sent_at: string | null;
  registration_token_hash: string | null;
  registration_token_expires_at: string | null;
  registration_token_used_at: string | null;
  vendor_registration_id: string | null;
}
