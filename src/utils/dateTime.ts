import { env } from "../config/env";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: env.appTimezone,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: env.appTimezone,
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: env.appTimezone,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function getDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: env.appTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

function getTimeZoneOffsetMilliseconds(date: Date) {
  const parts = getDateParts(date);
  const utcAsIfLocal = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return utcAsIfLocal - date.getTime();
}

export function formatDate(dateLike: string | Date) {
  return dateFormatter.format(new Date(dateLike));
}

export function formatTime(dateLike: string | Date) {
  return timeFormatter.format(new Date(dateLike));
}

export function formatDateTime(dateLike: string | Date) {
  return dateTimeFormatter.format(new Date(dateLike));
}

export function formatDateForFilter(dateLike: string | Date) {
  const parts = getDateParts(new Date(dateLike));
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");

  return `${parts.year}-${month}-${day}`;
}

export function toDateTimeLocalInputValue(dateLike: string | Date | null) {
  if (!dateLike) {
    return "";
  }

  const parts = getDateParts(new Date(dateLike));
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  const hour = String(parts.hour).padStart(2, "0");
  const minute = String(parts.minute).padStart(2, "0");

  return `${parts.year}-${month}-${day}T${hour}:${minute}`;
}

export function zonedLocalInputToUtcIso(localDateTime: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localDateTime);

  if (!match) {
    throw new Error("Invalid date/time format.");
  }

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);

  let candidate = new Date(utcGuess);
  let offset = getTimeZoneOffsetMilliseconds(candidate);
  candidate = new Date(utcGuess - offset);

  const correctedOffset = getTimeZoneOffsetMilliseconds(candidate);
  if (correctedOffset !== offset) {
    candidate = new Date(utcGuess - correctedOffset);
  }

  return candidate.toISOString();
}

export function makeCsvFileName(prefix: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${prefix}-${year}${month}${day}.csv`;
}
