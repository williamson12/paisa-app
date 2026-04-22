/**
 * Netlify Function: /api/advisor
 * Gemini 1.5 Flash REST API Proxy
 * Securely handles financial advice without leaking keys or using heavy SDKs.
 */
export const handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "GEMINI_API_KEY not set" }) };

  try {
    const payload = JSON.parse(event.body);
    const { monthlyIncome, totalSpent, balance, savings, savingsRate, topCategories } = payload;

    // Strong Persona Prompt
    const systemInstruction = "You are a top Indian Chartered Accountant and financial advisor. Always give concise, actionable financial advice with a score out of 10, risk level, and 3 clear next steps. Focus on Indian instruments like SIP, PPF, NPS, and ELSS. Tone: Professional, direct, premium.";
    
    const userPrompt = `Analyze these finances:
- Monthly Income: ₹${monthlyIncome}
- Total Spent: ₹${totalSpent}
- Current Balance: ₹${balance}
- Monthly Savings: ₹${savings}
- Savings Rate: ${savingsRate}
- Top Categories: ${topCategories.map(c => `${c.name} (₹${c.amount})`).join(", ")}

Provide a structured response:
SCORE: [X/10]
RISK: [Low/Medium/High]
ADVICE: [Actionable summary]
STEPS:
1. [Step 1]
2. [Step 2]
3. [Step 3]`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    const data = await response.json();
    const advice = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!advice) throw new Error("Empty response from Gemini");

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ advice }),
    };

  } catch (err) {
    console.error("Gemini Error:", err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: err.message || "Failed to fetch advice" }),
    };
  }
};
