const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const numberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatInr = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numberOrZero(value));

function response(statusCode, body) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function buildPrompt(payload) {
  const monthlyIncome = numberOrZero(payload.monthlyIncome);
  const totalSpent = numberOrZero(payload.totalSpent);
  const balance = numberOrZero(payload.balance);
  const savings = numberOrZero(payload.savings);
  const savingsRate = String(payload.savingsRate || "0%");
  const topCategories = Array.isArray(payload.topCategories) ? payload.topCategories.slice(0, 5) : [];

  const categoryLines = topCategories.length
    ? topCategories
        .map((category) => `- ${String(category.name || "Category")}: ${formatInr(category.amount)}`)
        .join("\n")
    : "- No category data available";

  return `You are an experienced Chartered Accountant in India. Provide practical personal-finance advice for a consumer finance tracker app.

Client summary for this month:
- Monthly income: ${formatInr(monthlyIncome)}
- Total spent: ${formatInr(totalSpent)}
- Balance remaining: ${formatInr(balance)}
- Savings: ${formatInr(savings)}
- Savings rate: ${savingsRate}
- Top spending categories:
${categoryLines}

Format your response using clean Markdown with these exact sections:

## Financial Health
2 sentences on overall status.

## Red Flags
Bullet points for any concerns. If none, write "None this month."

## Action Items
1. First action (mention specific instrument if relevant: SIP, PPF, NPS, ELSS, FD, emergency fund)
2. Second action
3. Third action

## Quick Win This Week
One specific, actionable tip.

Rules:
- Use **bold** for key amounts and instrument names.
- Keep total under 280 words.
- Use INR amounts where helpful.
- Do not invent tax deductions or make up figures.
- Write in simple, direct language for a mobile user.`;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY or GOOGLE_AI_API_KEY");
    return response(503, { error: "Advisor service is not configured. Set GEMINI_API_KEY in Netlify environment variables." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid JSON body" });
  }

  let geminiResponse;
  try {
    geminiResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(payload) }],
          },
        ],
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: 700,
        },
      }),
    });
  } catch (err) {
    console.error("Gemini network error:", err);
    return response(502, { error: "Advisor service is temporarily unreachable. Try again." });
  }

  let geminiBody = {};
  try {
    geminiBody = await geminiResponse.json();
  } catch {
    // Keep the default object for malformed upstream responses.
  }

  if (!geminiResponse.ok) {
    const upstreamMessage = geminiBody?.error?.message || geminiResponse.statusText || "Unknown Gemini error";
    console.error(`Gemini API error ${geminiResponse.status}: ${upstreamMessage}`);

    if (geminiResponse.status === 400 || geminiResponse.status === 403) {
      return response(502, { error: "Advisor API key or model configuration is invalid." });
    }

    if (geminiResponse.status === 429) {
      return response(429, { error: "Advisor rate limit reached. Please wait a moment and try again." });
    }

    return response(502, { error: "Advisor service returned an error. Try again." });
  }

  const advice = geminiBody?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!advice) {
    console.error("Gemini returned no text", JSON.stringify(geminiBody).slice(0, 1000));
    return response(502, { error: "Advisor returned an empty response. Try again." });
  }

  return response(200, { advice });
};
