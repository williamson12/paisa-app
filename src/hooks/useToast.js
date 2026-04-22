import { useState, useCallback } from "react";

/**
 * Toast notification hook.
 * Usage: const { toast, showToast } = useToast();
 * showToast("Message") / showToast("Error", "err")
 */
export function useToast(duration = 2600) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, showToast };
}
