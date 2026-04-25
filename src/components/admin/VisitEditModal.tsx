import { useEffect, useState } from "react";
import type { AdminVisitUpdateDraft, VisitRecord } from "../../types/domain";
import { toDateTimeLocalInputValue, zonedLocalInputToUtcIso } from "../../utils/dateTime";
import { sanitizePersonText, validateAdminVisitDraft } from "../../utils/validation";
import { Field } from "../common/Field";
import { Modal } from "../common/Modal";
import { StatusBanner } from "../common/StatusBanner";

type VisitEditModalProps = {
  record: VisitRecord;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (payload: {
    visitId: string;
    visitorId: string;
    firstName: string;
    lastName: string;
    company: string;
    checkinAtIso: string;
    checkoutAtIso: string | null;
    notes: string | null;
  }) => Promise<void>;
};

function createDraft(record: VisitRecord): AdminVisitUpdateDraft {
  return {
    firstName: record.firstName,
    lastName: record.lastName,
    company: record.company,
    checkinAtLocal: toDateTimeLocalInputValue(record.checkinAt),
    checkoutAtLocal: toDateTimeLocalInputValue(record.checkoutAt),
    notes: record.notes ?? "",
  };
}

export function VisitEditModal({
  record,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: VisitEditModalProps) {
  const [draft, setDraft] = useState<AdminVisitUpdateDraft>(() => createDraft(record));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof AdminVisitUpdateDraft, string>>
  >({});

  useEffect(() => {
    setDraft(createDraft(record));
    setFieldErrors({});
  }, [record]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAdminVisitDraft(draft);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSave({
      visitId: record.visitId,
      visitorId: record.visitorId,
      firstName: sanitizePersonText(draft.firstName),
      lastName: sanitizePersonText(draft.lastName),
      company: sanitizePersonText(draft.company),
      checkinAtIso: zonedLocalInputToUtcIso(draft.checkinAtLocal),
      checkoutAtIso: draft.checkoutAtLocal
        ? zonedLocalInputToUtcIso(draft.checkoutAtLocal)
        : null,
      notes: draft.notes.trim() ? draft.notes.trim() : null,
    });
  }

  return (
    <Modal title="Correct visit record" onClose={onClose} wide>
      <form className="visit-edit-form" onSubmit={handleSubmit}>
        <div className="filter-grid">
          <Field
            label="First name"
            error={fieldErrors.firstName}
            inputProps={{
              value: draft.firstName,
              onChange: (event) => setDraft({ ...draft, firstName: event.target.value }),
            }}
          />
          <Field
            label="Last name"
            error={fieldErrors.lastName}
            inputProps={{
              value: draft.lastName,
              onChange: (event) => setDraft({ ...draft, lastName: event.target.value }),
            }}
          />
          <Field
            label="Company"
            error={fieldErrors.company}
            inputProps={{
              value: draft.company,
              onChange: (event) => setDraft({ ...draft, company: event.target.value }),
            }}
          />
          <Field
            label="Check-in"
            error={fieldErrors.checkinAtLocal}
            inputProps={{
              type: "datetime-local",
              value: draft.checkinAtLocal,
              onChange: (event) =>
                setDraft({ ...draft, checkinAtLocal: event.target.value }),
            }}
          />
          <Field
            label="Check-out"
            inputProps={{
              type: "datetime-local",
              value: draft.checkoutAtLocal,
              onChange: (event) =>
                setDraft({ ...draft, checkoutAtLocal: event.target.value }),
            }}
          />
          <Field
            as="textarea"
            label="Note"
            textareaProps={{
              rows: 4,
              value: draft.notes,
              onChange: (event) => setDraft({ ...draft, notes: event.target.value }),
              placeholder: "Internal corrections or notes",
            }}
          />
        </div>
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        <div className="toolbar-actions toolbar-actions--end">
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save corrections"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
