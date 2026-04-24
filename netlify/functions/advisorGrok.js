/**
 * Netlify Function: advisorGrok
 *
 * Proxies financial data to the Gemini API and returns personalised CA advice.
 * The GEMINI_API_KEY is kept server-side and never exposed to the client.
 *
 * Route: POST /api/advisorGrok  (via netlify.toml redirect)
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handler = async (event) => {
  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // ── Parse request body ──────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const {
    monthlyIncome = 0,
    totalSpent = 0,
    balance = 0,
    savings = 0,
    savingsRate = "0%",
    topCategories = [],
  } = payload;

  // ── Validate API key ────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Advisor service is not configured. Contact support." }),
    };
  }

  // ── Build prompt ────────────────────────────────────────────────────────────
  const categoryLines = topCategories.length
    ? topCategories.map((c) => `  • ${c.name}: ₹${c.amount.toLocaleString("en-IN")}`).join("\n")
    : "  • No category data available";

  const prompt = `You are a senior Chartered Accountant (CA) in India advising a client on their personal finances. Be direct, practical, and specific to Indian financial products and tax laws.

Client's financial summary this month:
- Monthly Income: ₹${monthlyIncome.toLocaleString("en-IN")}
- Total Spent: ₹${totalSpent.toLocaleString("en-IN")}
- Balance Remaining: ₹${balance.toLocaleString("en-IN")}
- Savings: ₹${savings.toLocaleString("en-IN")}
- Savings Rate: ${savingsRate}
- Top Spending Categories:
${categoryLines}

Provide a concise, actionable CA report covering:
1. Overall financial health assessment (2-3 sentences)
2. Top 2-3 specific concerns or red flags
3. Top 3 actionable recommendations (mention specific Indian instruments: SIP, PPF, NPS, ELSS, FD, etc. where relevant)
4. One quick win they can implement this week

Keep the tone professional but friendly. Use ₹ for currency. Be specific with numbers where possible. Limit to 300 words.`;

  // ── Call Gemini API ─────────────────────────────────────────────────────────
  let geminiRes;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    });
  } catch (err) {
    console.error("Gemini fetch error:", err.message);
    return {
      statusCode: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to reach advisor service. Try again." }),
    };
  }

  // ── Handle Gemini errors ────────────────────────────────────────────────────
  if (!geminiRes.ok) {
    const errBody = await geminiRes.json().catch(() => ({}));
    const errMsg = errBody?.error?.message || geminiRes.statusText;
    console.error(`Gemini API error ${geminiRes.status}:`, errMsg);

    if (geminiRes.status === 429) {
      return {
        statusCode: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
      };
    }
    if (geminiRes.status === 400) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Invalid request: ${errMsg}` }),
      };
    }
    return {
      statusCode: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: `Advisor service error: ${errMsg}` }),
    };
  }

  // ── Extract advice text ─────────────────────────────────────────────────────
  let advice;
  try {
    const json = await geminiRes.json();
    advice = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  } catch {
    advice = null;
  }

  if (!advice) {
    console.error("Gemini returned empty or malformed response");
    return {
      statusCode: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Advisor returned an empty response. Try again." }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ advice }),
  };
};
