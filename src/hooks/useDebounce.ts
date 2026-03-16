import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Cleanup: cancel the timeout if value changes before delay
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}