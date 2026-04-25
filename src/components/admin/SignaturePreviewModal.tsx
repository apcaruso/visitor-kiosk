import { useEffect, useState } from "react";
import { createSignatureSignedUrl } from "../../services/storage";
import { toErrorMessage } from "../../utils/errors";
import { LoadingBlock } from "../common/LoadingBlock";
import { Modal } from "../common/Modal";
import { StatusBanner } from "../common/StatusBanner";

type SignaturePreviewModalProps = {
  path: string;
  label: string;
  onClose: () => void;
};

export function SignaturePreviewModal({
  path,
  label,
  onClose,
}: SignaturePreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    createSignatureSignedUrl(path)
      .then((url) => {
        if (isActive) {
          setSignedUrl(url);
        }
      })
      .catch((error) => {
        if (isActive) {
          setErrorMessage(
            toErrorMessage(error, "Unable to load the requested signature."),
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [path]);

  return (
    <Modal title={label} onClose={onClose}>
      <div className="signature-preview">
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        {!signedUrl && !errorMessage ? (
          <LoadingBlock label="Loading signature..." />
        ) : null}
        {signedUrl ? <img src={signedUrl} alt={label} /> : null}
        <p className="signature-preview__path">{path}</p>
      </div>
    </Modal>
  );
}
