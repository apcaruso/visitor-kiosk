import type { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
  title: string;
  onClose: () => void;
  wide?: boolean;
}>;

export function Modal({ children, title, onClose, wide = false }: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal ${wide ? "modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h3>{title}</h3>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
