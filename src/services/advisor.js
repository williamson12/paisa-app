/**
 * Calls the secure Netlify backend function for Gemini advice.
 * The API key is NEVER sent to the client.
 *
 * @param {object} payload  Financial summary object
 * @returns {Promise<string>}  The advice text
 * @throws {Error}             With a user-friendly message
 */
export async function fetchAdvisorAdvice(payload) {
  let res;
  try {
    res = await fetch("/api/advisorV3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error. Check your internet connection and try again.");
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (!res.ok) {
    const msg = body?.error || res.statusText;
    if (res.status === 429) throw new Error("Rate limit hit. Wait a moment and try again.");
    if (res.status >= 500) throw new Error(`Server error: ${msg}`);
    throw new Error(msg || `Error ${res.status}`);
  }

  if (!body?.advice) throw new Error("Empty response from advisor. Try again.");
  return body.advice;
}
