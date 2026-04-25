import { useDeferredValue, useEffect, useState } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { SignaturePreviewModal } from "../../components/admin/SignaturePreviewModal";
import { VisitEditModal } from "../../components/admin/VisitEditModal";
import { VisitFiltersPanel } from "../../components/admin/VisitFiltersPanel";
import { VisitList } from "../../components/admin/VisitList";
import { LoadingBlock } from "../../components/common/LoadingBlock";
import { StatusBanner } from "../../components/common/StatusBanner";
import { fetchAdminVisits, updateAdminVisitRecord } from "../../services/admin";
import type { VisitFilters, VisitRecord } from "../../types/domain";
import { buildVisitsCsv, triggerCsvDownload } from "../../utils/csv";
import { formatDateForFilter, makeCsvFileName } from "../../utils/dateTime";
import { toErrorMessage } from "../../utils/errors";

const INITIAL_FILTERS: VisitFilters = {
  date: "",
  firstName: "",
  lastName: "",
  company: "",
};

type SignatureState = {
  path: string;
  label: string;
} | null;

export function AdminDashboardPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const deferredFilters = useDeferredValue(filters);
  const [records, setRecords] = useState<VisitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signatureState, setSignatureState] = useState<SignatureState>(null);
  const [editingRecord, setEditingRecord] = useState<VisitRecord | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

  async function loadRecords() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextRecords = await fetchAdminVisits(1000);
      setRecords(nextRecords);
    } catch (error) {
      setErrorMessage(
        toErrorMessage(error, "Unable to load the visit archive."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords().catch(() => undefined);
  }, []);

  const filteredRecords = records.filter((record) => {
    const matchesDate =
      !deferredFilters.date || formatDateForFilter(record.checkinAt) === deferredFilters.date;
    const matchesFirstName =
      !deferredFilters.firstName ||
      record.firstName.toLowerCase().includes(deferredFilters.firstName.trim().toLowerCase());
    const matchesLastName =
      !deferredFilters.lastName ||
      record.lastName.toLowerCase().includes(deferredFilters.lastName.trim().toLowerCase());
    const matchesCompany =
      !deferredFilters.company ||
      record.company.toLowerCase().includes(deferredFilters.company.trim().toLowerCase());

    return matchesDate && matchesFirstName && matchesLastName && matchesCompany;
  });

  const openRecords = filteredRecords.filter((record) => record.status === "open");
  const historyRecords = filteredRecords;

  function handleExport() {
    const csvContent = buildVisitsCsv(historyRecords);
    triggerCsvDownload(makeCsvFileName("visitor-register-visits"), csvContent);
  }

  async function handleSaveEdit(payload: {
    visitId: string;
    visitorId: string;
    firstName: string;
    lastName: string;
    company: string;
    checkinAtIso: string;
    checkoutAtIso: string | null;
    notes: string | null;
  }) {
    if (!editingRecord) {
      return;
    }

    setIsSaving(true);
    setEditErrorMessage(null);

    try {
      const updatedRecord = await updateAdminVisitRecord(editingRecord, payload);
      setRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.visitId === updatedRecord.visitId ? updatedRecord : record,
        ),
      );
      setEditingRecord(null);
    } catch (error) {
      setEditErrorMessage(
        toErrorMessage(error, "Save failed. Check the entered data."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminLayout
      title="Visit register"
      subtitle="Review, search, CSV export, and admin-side record correction."
    >
      <VisitFiltersPanel
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(INITIAL_FILTERS)}
        onRefresh={() => loadRecords()}
        onExport={handleExport}
        isBusy={isLoading}
      />

      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      {isLoading ? <LoadingBlock label="Loading visit archive..." /> : null}

      {!isLoading ? (
        <>
          <VisitList
            title="Open visits"
            description="Visitors currently on site, useful for assisted check-out."
            records={openRecords}
            emptyMessage="No open visits match the current filters."
            onPreviewSignature={(path, label) => setSignatureState({ path, label })}
          />
          <VisitList
            title="Visit history"
            description="Complete archive of visits available in the admin frontend."
            records={historyRecords}
            emptyMessage="No records match the current filters."
            onPreviewSignature={(path, label) => setSignatureState({ path, label })}
            onEdit={(record) => {
              setEditErrorMessage(null);
              setEditingRecord(record);
            }}
          />
        </>
      ) : null}

      {signatureState ? (
        <SignaturePreviewModal
          path={signatureState.path}
          label={signatureState.label}
          onClose={() => setSignatureState(null)}
        />
      ) : null}

      {editingRecord ? (
        <VisitEditModal
          record={editingRecord}
          isSaving={isSaving}
          errorMessage={editErrorMessage}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveEdit}
        />
      ) : null}
    </AdminLayout>
  );
}
