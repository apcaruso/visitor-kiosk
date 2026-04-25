import type {
  CheckinDraft,
  CompanyOpenVisitOption,
  OpenVisitCompanyOption,
  OpenVisitOption,
} from "../types/domain";
import { supabase } from "../lib/supabase";
import { sanitizePersonText } from "../utils/validation";
import { assertCondition } from "../utils/errors";

export async function kioskCheckin(
  draft: CheckinDraft,
  checkinSignaturePath: string,
) {
  const { data, error } = await supabase.rpc("kiosk_checkin", {
    p_first_name: sanitizePersonText(draft.firstName),
    p_last_name: sanitizePersonText(draft.lastName),
    p_company: sanitizePersonText(draft.company),
    p_checkin_signature_path: checkinSignaturePath,
    p_notes: null,
  });

  if (error) {
    throw new Error(error.message);
  }

  assertCondition(data, "The backend did not return the visit ID.");

  return data as string;
}

export async function kioskListOpenVisits(): Promise<OpenVisitOption[]> {
  const { data, error } = await supabase.rpc("kiosk_list_open_visits");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    visit_id: string;
    display_name: string;
    company: string;
    checkin_local: string;
  }>).map((row) => ({
    visitId: row.visit_id,
    displayName: row.display_name,
    company: row.company,
    checkinLocal: row.checkin_local,
  }));
}

export async function kioskSearchOpenVisitCompanies(
  query: string,
): Promise<OpenVisitCompanyOption[]> {
  const { data, error } = await supabase.rpc(
    "kiosk_search_open_visit_companies",
    {
      p_query: query.trim(),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{ company: string }>).map((row) => ({
    company: row.company,
  }));
}

export async function kioskListOpenVisitsByCompany(
  company: string,
): Promise<CompanyOpenVisitOption[]> {
  const { data, error } = await supabase.rpc(
    "kiosk_list_open_visits_by_company",
    {
      p_company: company,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    visit_id: string;
    display_name: string;
    checkin_local: string;
  }>).map((row) => ({
    visitId: row.visit_id,
    displayName: row.display_name,
    checkinLocal: row.checkin_local,
  }));
}

export async function kioskCheckout(
  visitId: string,
  checkoutSignaturePath: string,
) {
  const { data, error } = await supabase.rpc("kiosk_checkout", {
    p_visit_id: visitId,
    p_checkout_signature_path: checkoutSignaturePath,
  });

  if (error) {
    throw new Error(error.message);
  }

  assertCondition(data, "The backend did not return the visit ID.");

  return data as string;
}
