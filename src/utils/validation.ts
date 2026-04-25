import type {
  AdminVisitUpdateDraft,
  CheckinDraft,
  CheckinFieldErrors,
  CheckoutFieldErrors,
} from "../types/domain";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function validateRequiredText(
  value: string,
  label: string,
  minLength = 2,
  maxLength = 80,
) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return `${label} is required.`;
  }

  if (normalized.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }

  if (normalized.length > maxLength) {
    return `${label} cannot exceed ${maxLength} characters.`;
  }

  return "";
}

export function sanitizePersonText(value: string) {
  return normalizeWhitespace(value);
}

export function validateCheckinDraft(draft: CheckinDraft): CheckinFieldErrors {
  const errors: CheckinFieldErrors = {};

  const firstNameError = validateRequiredText(draft.firstName, "First name");
  const lastNameError = validateRequiredText(draft.lastName, "Last name");
  const companyError = validateRequiredText(draft.company, "Company", 2, 120);

  if (firstNameError) {
    errors.firstName = firstNameError;
  }

  if (lastNameError) {
    errors.lastName = lastNameError;
  }

  if (companyError) {
    errors.company = companyError;
  }

  if (!draft.signatureDataUrl) {
    errors.signature = "Signature is required.";
  }

  return errors;
}

export function validateCheckoutSelection(
  selectedVisitId: string,
  signatureDataUrl: string,
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

  if (!selectedVisitId) {
    errors.selectedVisitId = "Select the visitor to check out.";
  }

  if (!signatureDataUrl) {
    errors.signature = "Signature is required.";
  }

  return errors;
}

export function validateAdminVisitDraft(draft: AdminVisitUpdateDraft) {
  const errors: Partial<Record<keyof AdminVisitUpdateDraft, string>> = {};

  const firstNameError = validateRequiredText(draft.firstName, "First name");
  const lastNameError = validateRequiredText(draft.lastName, "Last name");
  const companyError = validateRequiredText(draft.company, "Company", 2, 120);

  if (firstNameError) {
    errors.firstName = firstNameError;
  }

  if (lastNameError) {
    errors.lastName = lastNameError;
  }

  if (companyError) {
    errors.company = companyError;
  }

  if (!draft.checkinAtLocal) {
    errors.checkinAtLocal = "Check-in time is required.";
  }

  return errors;
}
