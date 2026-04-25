import type { Session } from "@supabase/supabase-js";

export type SignatureKind = "checkin" | "checkout";

export type CheckinDraft = {
  firstName: string;
  lastName: string;
  company: string;
  signatureDataUrl: string;
};

export type CheckoutDraft = {
  companySearch: string;
  selectedCompany: string;
  selectedVisitId: string;
  signatureDataUrl: string;
};

export type CheckinFieldErrors = Partial<
  Record<"firstName" | "lastName" | "company" | "signature", string>
>;

export type CheckoutFieldErrors = Partial<
  Record<"selectedVisitId" | "signature", string>
>;

export type OpenVisitOption = {
  visitId: string;
  displayName: string;
  company: string;
  checkinLocal: string;
};

export type OpenVisitCompanyOption = {
  company: string;
};

export type CompanyOpenVisitOption = {
  visitId: string;
  displayName: string;
  checkinLocal: string;
};

export type VisitRecord = {
  visitId: string;
  visitorId: string;
  firstName: string;
  lastName: string;
  company: string;
  visitDate: string;
  checkinAt: string;
  checkoutAt: string | null;
  checkinSignaturePath: string;
  checkoutSignaturePath: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VisitFilters = {
  date: string;
  firstName: string;
  lastName: string;
  company: string;
};

export type AdminVisitUpdateDraft = {
  firstName: string;
  lastName: string;
  company: string;
  checkinAtLocal: string;
  checkoutAtLocal: string;
  notes: string;
};

export type AdminVisitUpdateInput = {
  visitId: string;
  visitorId: string;
  firstName: string;
  lastName: string;
  company: string;
  checkinAtIso: string;
  checkoutAtIso: string | null;
  notes: string | null;
};

export type AdminProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
};

export type AuthContextValue = {
  session: Session | null;
  profile: AdminProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  signOut: () => Promise<void>;
};
