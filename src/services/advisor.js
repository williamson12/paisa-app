export async function fetchAdvisorAdvice(payload) {
  let res;
  try {
    res = await fetch("/api/advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error. Check your connection.");
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (!res.ok) {
    throw new Error(body?.error || "Advisor is currently busy. Try again soon.");
  }

  if (!body?.advice) throw new Error("Empty response from advisor.");
  return body.advice;
}
