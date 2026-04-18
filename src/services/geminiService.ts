import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from "../hooks/useExpenses";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getSpendingInsights(expenses: Expense[]) {
  if (expenses.length === 0) return "Add some expenses to get AI insights!";

  // Limit to current month's data
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Analyze this receipt image and extract the items. Return a JSON array of objects, where each object has 'description' (string), 'amount' (number), 'date' (YYYY-MM-DD string), and 'category' (one of: Food, Transport, Utilities, Shopping, Health, Travel, Entertainment, Other). Focus on identifying the store and individual costs if possible, or just the total sum if it's one transaction." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(',')[1] || imageBase64
              }
            }
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

    const text = response.text;
    if (!text) throw new Error("No text returned from AI");
    return JSON.parse(text) as Array<{ description: string; amount: number; date: string; category: string }>;
  } catch (error) {
    console.error('Receipt scan error:', error);
    throw error;
  }
}
