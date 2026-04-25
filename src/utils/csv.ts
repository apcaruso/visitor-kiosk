import type { VisitRecord } from "../types/domain";
import { formatDate, formatTime } from "./dateTime";

function escapeCsvCell(value: string | null | undefined) {
  const stringValue = value ?? "";
  const escaped = stringValue.replace(/"/g, "\"\"");

  return `"${escaped}"`;
}

export function buildVisitsCsv(records: VisitRecord[]) {
  const header = [
    "First name",
    "Last name",
    "Company",
    "Visit date",
    "Check-in time",
    "Check-in signature",
    "Check-out time",
    "Check-out signature",
  ];

  const lines = records.map((record) =>
    [
      record.firstName,
      record.lastName,
      record.company,
      formatDate(record.checkinAt),
      formatTime(record.checkinAt),
      record.checkinSignaturePath,
      record.checkoutAt ? formatTime(record.checkoutAt) : "",
      record.checkoutSignaturePath ?? "",
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return ["\uFEFF" + header.map(escapeCsvCell).join(","), ...lines].join("\n");
}

export function triggerCsvDownload(fileName: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
