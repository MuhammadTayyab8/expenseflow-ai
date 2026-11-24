import { Expense } from "../hooks/useExpenses";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { GoogleGenAI, Type } from "@google/genai";

// GitHub Pages is static hosting (no backend), so Gemini is called from the browser.
// Restrict this key by HTTP referrer in Google Cloud Console to protect it.
const MODEL = "gemini-3-flash-preview";

function getGenAI() {
  const key = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
  if (!key) throw new Error("VITE_GEMINI_API_KEY is missing. Add it to .env.local (or the GitHub secret).");
  return new GoogleGenAI({ apiKey: key });
}

export async function getSpendingInsights(expenses: Expense[]) {
  if (expenses.length === 0) return "Add some expenses to get AI insights!";

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentMonthExpenses = expenses.filter(e => 
    isWithinInterval(e.date, { start: monthStart, end: monthEnd })
  );

  const summary = currentMonthExpenses.map(e => ({
    amount: e.amount,
    category: e.category,
    date: format(e.date, 'yyyy-MM-dd'),
    description: e.description
  }));

  const prompt = `
    As a financial advisor AI, analyze the following expense data and provide 3 concise, actionable insights. 
    Focus on spending patterns, potential savings, and behavioral trends.
    Keep it professional but encouraging, with a hint of financial wisdom.
    
    Data: ${JSON.stringify(summary)}
  `;

  try {
    const response = await getGenAI().models.generateContent({
      model: MODEL,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error('AI Insight error:', error);
    return "Failed to analyze spending pattern. Please try again later.";
  }
}

export async function scanReceipt(imageBase64: string) {
  try {
    const match = imageBase64.match(/^data:(.*?);base64,(.*)$/);
    const mimeType = match?.[1] || "image/jpeg";
    const data = match?.[2] || imageBase64;

    const response = await getGenAI().models.generateContent({
      model: MODEL,
      contents: [
        {
          parts: [
            { text: "Analyze this receipt image and extract the items. Return a JSON array. Ensure the date is in YYYY-MM-DD format. If the date is missing, use the current year/month/day if visible on the receipt, otherwise use '2026-01-01' as a placeholder." },
            { inlineData: { mimeType, data } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["description", "amount", "date", "category"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error('Receipt scan error:', error);
    throw error;
  }
}
