import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field } from "../../components/common/Field";
import { StatusBanner } from "../../components/common/StatusBanner";
import { KioskLayout } from "../../components/kiosk/KioskLayout";
import {
  SignaturePad,
  type SignaturePadHandle,
} from "../../components/kiosk/SignaturePad";
import { useIdleTimeout } from "../../hooks/useIdleTimeout";
import { useSessionStorageState } from "../../hooks/useSessionStorageState";
import { kioskCheckin } from "../../services/rpc";
import { deleteSignature, uploadSignature } from "../../services/storage";
import type { CheckinDraft, CheckinFieldErrors } from "../../types/domain";
import { toErrorMessage } from "../../utils/errors";
import { sanitizePersonText, validateCheckinDraft } from "../../utils/validation";

const INITIAL_DRAFT: CheckinDraft = {
  firstName: "",
  lastName: "",
  company: "",
  signatureDataUrl: "",
};

export function CheckinPage() {
  const navigate = useNavigate();
  const signatureRef = useRef<SignaturePadHandle | null>(null);
  const { value: draft, setValue: setDraft, clear } = useSessionStorageState(
    "kiosk-checkin-draft",
    INITIAL_DRAFT,
  );
  const [fieldErrors, setFieldErrors] = useState<CheckinFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useIdleTimeout(120000, () => {
    clear();
    navigate("/", { replace: true });
  });

  function updateDraft(nextValues: Partial<CheckinDraft>) {
    setDraft({
      ...draft,
      ...nextValues,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCheckinDraft(draft);
    setFieldErrors(nextErrors);
    setErrorMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    let signaturePath = "";

    try {
      const signatureBlob = await signatureRef.current?.toBlob();
      if (!signatureBlob) {
        throw new Error("The signature is not available.");
      }

      signaturePath = await uploadSignature("checkin", signatureBlob);
      await kioskCheckin(
        {
          ...draft,
          firstName: sanitizePersonText(draft.firstName),
          lastName: sanitizePersonText(draft.lastName),
          company: sanitizePersonText(draft.company),
        },
        signaturePath,
      );
      clear();
      navigate("/success/checkin", { replace: true });
    } catch (error) {
      if (signaturePath) {
        deleteSignature(signaturePath).catch(() => undefined);
      }

      setErrorMessage(
        toErrorMessage(error, "Check-in could not be completed. Try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KioskLayout
      title="New check-in"
      subtitle="Enter the required details and capture the visitor signature."
    >
      <form className="kiosk-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field
            label="First name"
            error={fieldErrors.firstName}
            inputProps={{
              value: draft.firstName,
              onChange: (event) => updateDraft({ firstName: event.target.value }),
              autoComplete: "given-name",
              placeholder: "First name",
            }}
          />
          <Field
            label="Last name"
            error={fieldErrors.lastName}
            inputProps={{
              value: draft.lastName,
              onChange: (event) => updateDraft({ lastName: event.target.value }),
              autoComplete: "family-name",
              placeholder: "Last name",
            }}
          />
          <Field
            label="Company"
            error={fieldErrors.company}
            inputProps={{
              value: draft.company,
              onChange: (event) => updateDraft({ company: event.target.value }),
              autoComplete: "organization",
              placeholder: "Company name",
            }}
          />
        </div>
        <SignaturePad
          ref={signatureRef}
          label="Visitor signature"
          valueDataUrl={draft.signatureDataUrl}
          error={fieldErrors.signature}
          onChange={(signatureDataUrl) => updateDraft({ signatureDataUrl })}
        />
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        <div className="toolbar-actions toolbar-actions--end">
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              clear();
              navigate("/");
            }}
          >
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Confirm check-in"}
          </button>
        </div>
      </form>
    </KioskLayout>
  );
}
