import { Expense } from "../hooks/useExpenses";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

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
    const response = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('AI Insight error:', error);
    return "Failed to analyze spending pattern. Please try again later.";
  }
}

export async function scanReceipt(imageBase64: string) {
  try {
    const response = await fetch('/api/ai/scan-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    });
    if (!response.ok) throw new Error('Failed to scan receipt');
    return await response.json();
  } catch (error) {
    console.error('Receipt scan error:', error);
    throw error;
  }
}
