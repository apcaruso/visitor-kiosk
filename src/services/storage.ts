import type { SignatureKind } from "../types/domain";
import { supabase } from "../lib/supabase";
import { assertCondition } from "../utils/errors";
import { formatDateForFilter } from "../utils/dateTime";

const SIGNATURE_BUCKET = "signatures";

function buildSignaturePath(kind: SignatureKind) {
  const directory = formatDateForFilter(new Date());
  return `${kind}/${directory}/${crypto.randomUUID()}.png`;
}

export async function uploadSignature(kind: SignatureKind, blob: Blob) {
  const path = buildSignaturePath(kind);
  const { error } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .upload(path, blob, {
      cacheControl: "3600",
      contentType: "image/png",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function deleteSignature(path: string) {
  const { error } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createSignatureSignedUrl(path: string, expiresIn = 300) {
  const { data, error } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(error.message);
  }

  assertCondition(data?.signedUrl, "Unable to create the signed signature URL.");

  return data.signedUrl;
}
