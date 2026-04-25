import { supabase } from "../lib/supabase";
import type { AdminVisitUpdateInput, VisitRecord } from "../types/domain";
import { assertCondition } from "../utils/errors";
import { formatDateForFilter } from "../utils/dateTime";

const VISIT_BASE_SELECT = `
  id,
  visitor_id,
  visit_date,
  checkin_at,
  checkout_at,
  checkin_signature_path,
  checkout_signature_path,
  status,
  notes,
  created_at,
  updated_at
`;

const VISIT_WITH_VISITOR_SELECT = `
  ${VISIT_BASE_SELECT},
  visitor:visitors!visits_visitor_id_fkey (
    id,
    first_name,
    last_name,
    company
  )
`;

type VisitWithVisitorRow = {
  id: string;
  visitor_id: string;
  visit_date: string;
  checkin_at: string;
  checkout_at: string | null;
  checkin_signature_path: string;
  checkout_signature_path: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  visitor?:
    | {
        id: string;
        first_name: string;
        last_name: string;
        company: string;
      }
    | Array<{
      id: string;
      first_name: string;
      last_name: string;
      company: string;
    }>
    | null;
};

type VisitBaseRow = Omit<VisitWithVisitorRow, "visitor">;

function mapVisitRow(
  row: VisitWithVisitorRow,
  visitorsById?: Map<string, { first_name: string; last_name: string; company: string }>,
): VisitRecord {
  const embeddedVisitor = Array.isArray(row.visitor) ? row.visitor[0] : row.visitor;
  const visitor = embeddedVisitor ?? visitorsById?.get(row.visitor_id);
  assertCondition(visitor, `Visitor associated with visit ${row.id} is not available.`);

  return {
    visitId: row.id,
    visitorId: row.visitor_id,
    firstName: visitor.first_name,
    lastName: visitor.last_name,
    company: visitor.company,
    visitDate: row.visit_date,
    checkinAt: row.checkin_at,
    checkoutAt: row.checkout_at,
    checkinSignaturePath: row.checkin_signature_path,
    checkoutSignaturePath: row.checkout_signature_path,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function queryVisits(
  scope: (query: any) => any,
  limit = 1000,
): Promise<VisitRecord[]> {
  const joinedQuery = scope(supabase.from("visits"))
    .select(VISIT_WITH_VISITOR_SELECT)
    .order("checkin_at", { ascending: false })
    .limit(limit);

  const { data: joinedData, error: joinedError } = await joinedQuery;
  if (!joinedError && joinedData) {
    return (joinedData as unknown as VisitWithVisitorRow[]).map((row) =>
      mapVisitRow(row),
    );
  }

  const fallbackQuery = scope(supabase.from("visits"))
    .select(VISIT_BASE_SELECT)
    .order("checkin_at", { ascending: false })
    .limit(limit);

  const { data: visitData, error: visitError } = await fallbackQuery;
  if (visitError) {
    throw new Error(visitError.message);
  }

  const visits = (visitData ?? []) as VisitBaseRow[];
  const visitorIds = [...new Set(visits.map((visit) => visit.visitor_id))];

  if (visitorIds.length === 0) {
    return [];
  }

  const { data: visitorData, error: visitorError } = await supabase
    .from("visitors")
    .select("id, first_name, last_name, company")
    .in("id", visitorIds);

  if (visitorError) {
    throw new Error(visitorError.message);
  }

  const visitorsById = new Map(
    (visitorData ?? []).map((visitor) => [
      visitor.id,
      {
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        company: visitor.company,
      },
    ]),
  );

  return visits.map((visit) =>
    mapVisitRow({ ...visit, visitor: null }, visitorsById),
  );
}

export async function fetchAdminVisits(limit = 1000) {
  return queryVisits((query) => query, limit);
}

export async function fetchAdminVisitById(visitId: string) {
  const records = await queryVisits((query) => query.eq("id", visitId), 1);
  return records[0] ?? null;
}

export async function updateAdminVisitRecord(
  currentRecord: VisitRecord,
  input: AdminVisitUpdateInput,
) {
  const visitorPatch: Record<string, string> = {};
  if (currentRecord.firstName !== input.firstName) {
    visitorPatch.first_name = input.firstName;
  }
  if (currentRecord.lastName !== input.lastName) {
    visitorPatch.last_name = input.lastName;
  }
  if (currentRecord.company !== input.company) {
    visitorPatch.company = input.company;
  }

  const visitPatch = {
    visit_date: formatDateForFilter(input.checkinAtIso),
    checkin_at: input.checkinAtIso,
    checkout_at: input.checkoutAtIso,
    status: input.checkoutAtIso ? "closed" : "open",
    notes: input.notes,
  };

  const previousVisitorState = {
    first_name: currentRecord.firstName,
    last_name: currentRecord.lastName,
    company: currentRecord.company,
  };

  if (Object.keys(visitorPatch).length > 0) {
    const { error: visitorError } = await supabase
      .from("visitors")
      .update(visitorPatch)
      .eq("id", input.visitorId);

    if (visitorError) {
      throw new Error(visitorError.message);
    }
  }

  const { error: visitError } = await supabase
    .from("visits")
    .update(visitPatch)
    .eq("id", input.visitId);

  if (visitError) {
    if (Object.keys(visitorPatch).length > 0) {
      await supabase
        .from("visitors")
        .update(previousVisitorState)
        .eq("id", input.visitorId);
    }

    throw new Error(visitError.message);
  }

  const refreshedRecord = await fetchAdminVisitById(input.visitId);
  assertCondition(refreshedRecord, "The updated visit was not found.");

  return refreshedRecord;
}
