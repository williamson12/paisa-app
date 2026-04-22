/**
 * Netlify Function: /api/advisorGrok
 * Secure Grok (xAI) proxy (server-side)
 */
export const handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // ✅ CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  // ✅ Only POST allowed
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        error: "Server misconfiguration: GROK_API_KEY not set.",
      }),
    };
  }

  // ✅ Parse request body
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  const {
    monthlyIncome,
    totalSpent,
    balance,
    savings,
    savingsRate,
    topCategories,
  } = payload;

  // ✅ Validation
  if (
    typeof monthlyIncome !== "number" ||
    typeof totalSpent !== "number" ||
    typeof balance !== "number" ||
    typeof savings !== "number" ||
    typeof savingsRate !== "string" ||
    !Array.isArray(topCategories)
  ) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: "Invalid payload fields." }),
    };
  }

  // ✅ Sanitization
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

  // ✅ Prompt
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

Finances:
${JSON.stringify(sanitized, null, 2)}`;

  try {
    // ✅ Grok API Call
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          {
            role: "system",
            content: "You are a highly precise Indian personal finance advisor.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        headers: CORS,
        body: JSON.stringify({
          error: `Grok API Error: ${errText}`,
        }),
      };
    }

    const data = await response.json();

    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: "Empty response from Grok." }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ advice: text }),
    };

  } catch (err) {
    console.error("Grok Server Error:", err);

    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({
        error: `Grok Error: ${err.message}`,
      }),
    };
  }
};