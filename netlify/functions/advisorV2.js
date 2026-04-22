/**
 * Netlify Function: /api/advisor
 * Proxies Gemini requests server-side so the API key is never exposed to the client.
 */
export const handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Server misconfiguration: GEMINI_API_KEY not set." }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  const { monthlyIncome, totalSpent, balance, savings, savingsRate, topCategories } = payload;

  // Input validation
  if (
    typeof monthlyIncome !== "number" ||
    typeof totalSpent !== "number" ||
    typeof balance !== "number" ||
    typeof savings !== "number" ||
    typeof savingsRate !== "string" ||
    !Array.isArray(topCategories)
  ) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid payload fields." }) };
  }

  const sanitized = {
    monthlyIncome: Math.max(0, Math.min(monthlyIncome, 100_000_000)),
    totalSpent: Math.max(0, Math.min(totalSpent, 100_000_000)),
    balance: Math.min(Math.max(balance, -100_000_000), 100_000_000),
    savings: Math.min(Math.max(savings, -100_000_000), 100_000_000),
    savingsRate: savingsRate.slice(0, 10),
    topCategories: topCategories.slice(0, 5).map((c) => ({
      name: String(c.name || "").slice(0, 50),
      amount: Math.max(0, Number(c.amount) || 0),
    })),
  };

  const prompt = `You are India's top CA and personal finance advisor. Be direct, precise, actionable. Indian context (SIP, FD, PPF, ELSS, NPS). Premium tone — no fluff. Structure exactly:

SCORE: [X/10] — [one sharp sentence]

⚡ URGENT:
[max 2 bullet points if critical issues]

✂️ CUT HERE (top 3 savings):
[specific ₹ figure + specific action each]

📈 GROW THIS MONEY:
[specific instrument, tenure, expected returns]

🎯 30-DAY GOAL:
[one clear ₹ target]

Max 280 words. No generic advice.

Finances:\n${JSON.stringify(sanitized, null, 2)}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      const msg = errBody?.error?.message || geminiRes.statusText;
      return {
        statusCode: geminiRes.status,
        headers: CORS,
        body: JSON.stringify({ error: `Gemini error: ${msg}` }),
      };
    }

    const data = await geminiRes.json();
    const candidate = data.candidates?.[0];
    if (!candidate) {
      const blockReason = data.promptFeedback?.blockReason;
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: `No response${blockReason ? ` (blocked: ${blockReason})` : "."}` }),
      };
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Empty response from Gemini." }) };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ advice: text }),
    };
  } catch (err) {
    console.error("Advisor function error:", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Network error reaching Gemini." }),
    };
  }
};
