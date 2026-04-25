import type { VisitRecord } from "../../types/domain";
import { formatDate, formatDateTime } from "../../utils/dateTime";

type VisitListProps = {
  title: string;
  description: string;
  records: VisitRecord[];
  emptyMessage: string;
  onEdit?: (record: VisitRecord) => void;
  onPreviewSignature: (path: string, label: string) => void;
};

export function VisitList({
  title,
  description,
  records,
  emptyMessage,
  onEdit,
  onPreviewSignature,
}: VisitListProps) {
  return (
    <section className="admin-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="summary-chip">{records.length} record</span>
      </div>
      {records.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="visit-card-list">
          {records.map((record) => (
            <article className="visit-card" key={record.visitId}>
              <div className="visit-card__headline">
                <div>
                  <h3>
                    {record.firstName} {record.lastName}
                  </h3>
                  <p>{record.company}</p>
                </div>
                <span
                  className={`status-pill ${
                    record.status === "open" ? "status-pill--open" : "status-pill--closed"
                  }`}
                >
                  {record.status === "open" ? "On site" : "Closed"}
                </span>
              </div>
              <dl className="visit-card__details">
                <div>
                  <dt>Visit date</dt>
                  <dd>{formatDate(record.checkinAt)}</dd>
                </div>
                <div>
                  <dt>Check-in</dt>
                  <dd>{formatDateTime(record.checkinAt)}</dd>
                </div>
                <div>
                  <dt>Check-out</dt>
                  <dd>{record.checkoutAt ? formatDateTime(record.checkoutAt) : "Still open"}</dd>
                </div>
                <div>
                  <dt>Note</dt>
                  <dd>{record.notes?.trim() ? record.notes : "No notes"}</dd>
                </div>
              </dl>
              <div className="visit-card__actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    onPreviewSignature(record.checkinSignaturePath, "Check-in signature")
                  }
                >
                  Check-in signature
                </button>
                {record.checkoutSignaturePath ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      if (record.checkoutSignaturePath) {
                        onPreviewSignature(record.checkoutSignaturePath, "Check-out signature");
                      }
                    }}
                  >
                    Check-out signature
                  </button>
                ) : null}
                {onEdit ? (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => onEdit(record)}
                  >
                    Correct record
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
