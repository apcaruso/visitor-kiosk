import { useEffect, useState } from "react";

function readStorageValue<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const rawValue = window.sessionStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function useSessionStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorageValue(key, fallback));

  useEffect(() => {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  function clear() {
    setValue(fallback);
    window.sessionStorage.removeItem(key);
  }

  return { value, setValue, clear } as const;
}
