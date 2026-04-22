import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Netlify Function: /api/advisor
 * Secure Gemini proxy (server-side)
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        error: "Server misconfiguration: GEMINI_API_KEY not set.",
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
    // ✅ Gemini SDK usage (FIXED PART)
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro",
    });

    let text = null;
    let retries = 2;

    while (retries >= 0) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        if (text) break;
      } catch (err) {
        if (retries === 0) throw err;
        retries--;
        // Wait 1 second before retrying
        await new Promise((res) => setTimeout(res, 1000));
      }
    }

    if (!text) {
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: "Empty response from Gemini." }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ advice: text }),
    };
  } catch (err) {
    console.error("Gemini SDK Error:", err);

    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({
        error: `Gemini Error: ${err.message}`,
      }),
    };
  }
};