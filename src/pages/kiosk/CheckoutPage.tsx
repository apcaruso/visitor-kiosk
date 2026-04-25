import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingBlock } from "../../components/common/LoadingBlock";
import { StatusBanner } from "../../components/common/StatusBanner";
import { KioskLayout } from "../../components/kiosk/KioskLayout";
import {
  SignaturePad,
  type SignaturePadHandle,
} from "../../components/kiosk/SignaturePad";
import { useIdleTimeout } from "../../hooks/useIdleTimeout";
import { useSessionStorageState } from "../../hooks/useSessionStorageState";
import {
  kioskCheckout,
  kioskListOpenVisitsByCompany,
  kioskSearchOpenVisitCompanies,
} from "../../services/rpc";
import { deleteSignature, uploadSignature } from "../../services/storage";
import type {
  CheckoutDraft,
  CheckoutFieldErrors,
  CompanyOpenVisitOption,
  OpenVisitCompanyOption,
} from "../../types/domain";
import { toErrorMessage } from "../../utils/errors";
import { validateCheckoutSelection } from "../../utils/validation";

const INITIAL_DRAFT: CheckoutDraft = {
  companySearch: "",
  selectedCompany: "",
  selectedVisitId: "",
  signatureDataUrl: "",
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const signatureRef = useRef<SignaturePadHandle | null>(null);
  const companySearchRequestIdRef = useRef(0);
  const companyVisitsRequestIdRef = useRef(0);
  const { value: draft, setValue: setDraft, clear } = useSessionStorageState(
    "kiosk-checkout-draft",
    INITIAL_DRAFT,
  );
  const [companyOptions, setCompanyOptions] = useState<OpenVisitCompanyOption[]>(
    [],
  );
  const [companyVisits, setCompanyVisits] = useState<CompanyOpenVisitOption[]>([]);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [companySearchErrorMessage, setCompanySearchErrorMessage] = useState<
    string | null
  >(null);
  const [companyVisitsErrorMessage, setCompanyVisitsErrorMessage] = useState<
    string | null
  >(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [isLoadingCompanyVisits, setIsLoadingCompanyVisits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useIdleTimeout(120000, () => {
    clear();
    navigate("/", { replace: true });
  });

  function updateDraft(nextValues: Partial<CheckoutDraft>) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...nextValues,
    }));
  }

  function resetCompanySelection() {
    companySearchRequestIdRef.current += 1;
    companyVisitsRequestIdRef.current += 1;
    setIsSearchingCompanies(false);
    setIsLoadingCompanyVisits(false);
    setCompanyOptions([]);
    setCompanyVisits([]);
    setFieldErrors({});
    setCompanySearchErrorMessage(null);
    setCompanyVisitsErrorMessage(null);
    setSubmitErrorMessage(null);
    updateDraft({
      companySearch: "",
      selectedCompany: "",
      selectedVisitId: "",
      signatureDataUrl: "",
    });
  }

  function handleCompanySelect(company: string) {
    companySearchRequestIdRef.current += 1;
    setIsSearchingCompanies(false);
    setCompanyOptions([]);
    setFieldErrors({});
    setCompanySearchErrorMessage(null);
    setCompanyVisitsErrorMessage(null);
    setSubmitErrorMessage(null);
    updateDraft({
      companySearch: company,
      selectedCompany: company,
      selectedVisitId: "",
      signatureDataUrl: "",
    });
  }

  useEffect(() => {
    if (draft.selectedCompany) {
      return undefined;
    }

    const companyQuery = draft.companySearch.trim();
    companySearchRequestIdRef.current += 1;
    const requestId = companySearchRequestIdRef.current;

    if (companyQuery.length < 2) {
      setIsSearchingCompanies(false);
      setCompanyOptions([]);
      setCompanySearchErrorMessage(null);
      return undefined;
    }

    setIsSearchingCompanies(true);
    setCompanySearchErrorMessage(null);

    const timeoutId = window.setTimeout(() => {
      kioskSearchOpenVisitCompanies(companyQuery)
        .then((companies) => {
          if (companySearchRequestIdRef.current !== requestId) {
            return;
          }

          setCompanyOptions(companies);
        })
        .catch((error) => {
          if (companySearchRequestIdRef.current !== requestId) {
            return;
          }

          setCompanyOptions([]);
          setCompanySearchErrorMessage(
            toErrorMessage(
              error,
              "Unable to search companies with open visits.",
            ),
          );
        })
        .finally(() => {
          if (companySearchRequestIdRef.current === requestId) {
            setIsSearchingCompanies(false);
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft.companySearch, draft.selectedCompany]);

  useEffect(() => {
    const selectedCompany = draft.selectedCompany.trim();
    companyVisitsRequestIdRef.current += 1;
    const requestId = companyVisitsRequestIdRef.current;

    if (!selectedCompany) {
      setIsLoadingCompanyVisits(false);
      setCompanyVisits([]);
      setCompanyVisitsErrorMessage(null);
      return;
    }

    setIsLoadingCompanyVisits(true);
    setCompanyVisits([]);
    setCompanyVisitsErrorMessage(null);

    kioskListOpenVisitsByCompany(selectedCompany)
      .then((visits) => {
        if (companyVisitsRequestIdRef.current !== requestId) {
          return;
        }

        setCompanyVisits(visits);
        setDraft((currentDraft) => {
          if (currentDraft.selectedCompany !== selectedCompany) {
            return currentDraft;
          }

          if (
            currentDraft.selectedVisitId &&
            !visits.some((visit) => visit.visitId === currentDraft.selectedVisitId)
          ) {
            return {
              ...currentDraft,
              selectedVisitId: "",
              signatureDataUrl: "",
            };
          }

          return currentDraft;
        });
      })
      .catch((error) => {
        if (companyVisitsRequestIdRef.current !== requestId) {
          return;
        }

        setCompanyVisits([]);
        setCompanyVisitsErrorMessage(
          toErrorMessage(
            error,
            "Unable to load visitors for the selected company.",
          ),
        );
      })
      .finally(() => {
        if (companyVisitsRequestIdRef.current === requestId) {
          setIsLoadingCompanyVisits(false);
        }
      });
  }, [draft.selectedCompany, setDraft]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateCheckoutSelection(
      draft.selectedVisitId,
      draft.signatureDataUrl,
    );
    setFieldErrors(nextErrors);
    setSubmitErrorMessage(null);

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

      signaturePath = await uploadSignature("checkout", signatureBlob);
      await kioskCheckout(draft.selectedVisitId, signaturePath);
      clear();
      navigate("/success/checkout", { replace: true });
    } catch (error) {
      if (signaturePath) {
        deleteSignature(signaturePath).catch(() => undefined);
      }

      setSubmitErrorMessage(
        toErrorMessage(error, "Check-out could not be completed. Try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const companyQuery = draft.companySearch.trim();
  const shouldShowCompanyEmptyState =
    !draft.selectedCompany &&
    companyQuery.length >= 2 &&
    !isSearchingCompanies &&
    !companySearchErrorMessage &&
    companyOptions.length === 0;

  return (
    <KioskLayout
      title="Check-out registration"
      subtitle="Select the company first, then choose the correct visitor and capture the final signature."
    >
      <form className="kiosk-form kiosk-form--stacked" onSubmit={handleSubmit}>
        <section className="selection-panel">
          <div className="selection-panel__header">
            <div>
              <h2>1. Search company</h2>
              <p>
                No visitor names are shown at first. Visitors load only after
                a company is selected.
              </p>
            </div>
            {draft.selectedCompany ? (
              <button
                className="ghost-button"
                type="button"
                onClick={resetCompanySelection}
              >
                Change company
              </button>
            ) : null}
          </div>

          {!draft.selectedCompany ? (
            <>
              <input
                className="search-input"
                type="search"
                placeholder="Search company"
                value={draft.companySearch}
                onChange={(event) => {
                  setCompanySearchErrorMessage(null);
                  setSubmitErrorMessage(null);
                  updateDraft({ companySearch: event.target.value });
                }}
              />

              {companySearchErrorMessage ? (
                <StatusBanner tone="error" message={companySearchErrorMessage} />
              ) : null}

              {companyQuery.length < 2 ? (
                <div className="empty-state">
                  Type at least 2 characters to search for a company with open
                  visits.
                </div>
              ) : null}

              {isSearchingCompanies ? (
                <LoadingBlock label="Searching companies with open visits..." />
              ) : null}

              {shouldShowCompanyEmptyState ? (
                <div className="empty-state">
                  No company with open visits was found for this search.
                </div>
              ) : null}

              {!isSearchingCompanies && companyOptions.length > 0 ? (
                <div className="visit-choice-grid">
                  {companyOptions.map((companyOption) => (
                    <button
                      key={companyOption.company}
                      className="visit-choice"
                      type="button"
                      onClick={() => handleCompanySelect(companyOption.company)}
                    >
                      <strong>{companyOption.company}</strong>
                      <small>Show only visitors from this company</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="visit-choice-grid">
              <div className="visit-choice visit-choice--active">
                <strong>{draft.selectedCompany}</strong>
                <small>Company selected for check-out</small>
              </div>
            </div>
          )}
        </section>

        <section className="selection-panel">
          <div className="selection-panel__header">
            <div>
              <h2>2. Select the visitor</h2>
              <p>
                After the company is selected, only the names needed to complete
                check-out are shown.
              </p>
            </div>
          </div>

          {!draft.selectedCompany ? (
            <div className="empty-state">
              Select a company first to see available visitors.
            </div>
          ) : (
            <>
              {fieldErrors.selectedVisitId ? (
                <StatusBanner tone="error" message={fieldErrors.selectedVisitId} />
              ) : null}

              {companyVisitsErrorMessage ? (
                <StatusBanner tone="error" message={companyVisitsErrorMessage} />
              ) : null}

              {isLoadingCompanyVisits ? (
                <LoadingBlock label="Loading visitors for the company..." />
              ) : companyVisits.length === 0 && !companyVisitsErrorMessage ? (
                <div className="empty-state">
                  No open visit was found for the selected company.
                </div>
              ) : (
                <div className="visit-choice-grid">
                  {companyVisits.map((visit) => (
                    <button
                      key={visit.visitId}
                      className={`visit-choice ${
                        draft.selectedVisitId === visit.visitId
                          ? "visit-choice--active"
                          : ""
                      }`}
                      type="button"
                      onClick={() => {
                        setSubmitErrorMessage(null);
                        setFieldErrors((currentErrors) => ({
                          ...currentErrors,
                          selectedVisitId: undefined,
                        }));
                        updateDraft({
                          selectedVisitId: visit.visitId,
                        });
                      }}
                    >
                      <strong>{visit.displayName}</strong>
                      <small>Check-in: {visit.checkinLocal}</small>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="selection-panel">
          <div className="selection-panel__header">
            <div>
              <h2>3. Check-out signature</h2>
            </div>
          </div>
          <SignaturePad
            ref={signatureRef}
            label="Visitor signature"
            valueDataUrl={draft.signatureDataUrl}
            error={fieldErrors.signature}
            onChange={(signatureDataUrl) => updateDraft({ signatureDataUrl })}
          />
        </section>

        {submitErrorMessage ? (
          <StatusBanner tone="error" message={submitErrorMessage} />
        ) : null}
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
            {isSubmitting ? "Registering..." : "Confirm check-out"}
          </button>
        </div>
      </form>
    </KioskLayout>
  );
}
