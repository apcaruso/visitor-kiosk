import type { VisitFilters } from "../../types/domain";
import { Field } from "../common/Field";

type VisitFiltersPanelProps = {
  filters: VisitFilters;
  onChange: (nextFilters: VisitFilters) => void;
  onClear: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isBusy: boolean;
};

export function VisitFiltersPanel({
  filters,
  onChange,
  onClear,
  onRefresh,
  onExport,
  isBusy,
}: VisitFiltersPanelProps) {
  return (
    <section className="admin-section">
      <div className="section-heading">
        <div>
          <h2>Filters and tools</h2>
          <p>Filter the archive, reload data, or generate a CSV of the filtered visits.</p>
        </div>
        <div className="toolbar-actions">
          <button className="ghost-button" type="button" onClick={onClear}>
            Clear filters
          </button>
          <button className="ghost-button" type="button" onClick={onRefresh} disabled={isBusy}>
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={onExport}>
            Export CSV
          </button>
        </div>
      </div>
      <div className="filter-grid">
        <Field
          label="Visit date"
          inputProps={{
            type: "date",
            value: filters.date,
            onChange: (event) => onChange({ ...filters, date: event.target.value }),
          }}
        />
        <Field
          label="First name"
          inputProps={{
            value: filters.firstName,
            onChange: (event) =>
              onChange({ ...filters, firstName: event.target.value }),
            placeholder: "Search by first name",
          }}
        />
        <Field
          label="Last name"
          inputProps={{
            value: filters.lastName,
            onChange: (event) =>
              onChange({ ...filters, lastName: event.target.value }),
            placeholder: "Search by last name",
          }}
        />
        <Field
          label="Company"
          inputProps={{
            value: filters.company,
            onChange: (event) => onChange({ ...filters, company: event.target.value }),
            placeholder: "Search by company",
          }}
        />
      </div>
    </section>
  );
}
