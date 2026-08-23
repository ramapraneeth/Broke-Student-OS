import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExpenseCategory } from '../types';

export interface ScannedExpenseResult {
  amount: number;
  date: string;
  receiver: string;
  category: ExpenseCategory;
  title: string;
  note: string;
  confidence: number;
}

/**
 * Converts a File or Blob into a base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parses payment receipt / UPI screenshot using Gemini AI
 */
export async function scanExpenseReceipt(file: File): Promise<ScannedExpenseResult> {
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';
  const today = new Date().toISOString().split('T')[0];

  // 1. Try Backend Gemini Scanner Endpoint
  try {
    const res = await fetch('/api/ai/scan-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Data, mimeType }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          amount: typeof data.amount === 'number' ? data.amount : 0,
          date: data.date || today,
          receiver: data.receiver || 'Merchant',
          category: data.category || 'Other',
          title: data.title || 'Scanned Expense',
          note: data.note || 'Scanned from payment screenshot',
          confidence: data.confidence || 0.95,
        };
      }
    }
  } catch (backendErr) {
    console.warn('[Gemini Scanner] Backend endpoint call skipped/failed:', backendErr);
  }

  // 2. Direct Client-side Gemini SDK fallback
  const clientKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (clientKey) {
    const genAI = new GoogleGenerativeAI(clientKey);
    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

    const prompt = `
You are an expert financial receipt and payment scanner for an Indian student expense manager app.
Analyze this payment receipt or transaction screenshot (from Google Pay, PhonePe, Paytm, CRED, Bank SMS, or bill receipt).

Extract the following:
1. "amount": The numerical transaction amount in INR (e.g. 150.00). Must be a positive number.
2. "date": The transaction date in "YYYY-MM-DD" format. If today or not clearly specified, use "${today}".
3. "receiver": The exact receiver name, merchant name, UPI handle name, or payee shown on the receipt.
4. "category": Categorize strictly into ONE of: "Food", "Transport", "Education", "Hostel", "Entertainment", "Shopping", "Recharge", "Other".
5. "title": If category is "Other", set title to receiver name. If category is known, set a clear title (e.g. "Swiggy Order", "Rapido Bike", "College Xerox").
6. "note": Short note mentioning merchant/receiver or transaction ID if available.

Return ONLY a JSON object with this exact structure:
{
  "amount": 150,
  "date": "${today}",
  "receiver": "Chai Point",
  "category": "Food",
  "title": "Chai Point",
  "note": "Paid via UPI",
  "confidence": 0.95
}
`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        const validCategories: ExpenseCategory[] = ['Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Hostel', 'Recharge', 'Other'];
        const finalCategory: ExpenseCategory = validCategories.includes(parsed.category) ? parsed.category : 'Other';

        return {
          amount: typeof parsed.amount === 'number' && parsed.amount > 0 ? parsed.amount : 0,
          date: parsed.date || today,
          receiver: parsed.receiver || 'Unknown Merchant',
          category: finalCategory,
          title: parsed.title || (finalCategory === 'Other' ? (parsed.receiver || 'Other Expense') : `${finalCategory} Expense`),
          note: parsed.note || (parsed.receiver ? `Scanned from screenshot (${parsed.receiver})` : 'Scanned with Gemini AI'),
          confidence: parsed.confidence || 0.95,
        };
      } catch (err) {
        console.warn(`[Gemini Scanner] Client model ${modelName} failed:`, err);
      }
    }
  }

  // 3. Fallback when no API key configured
  return {
    amount: 0,
    date: today,
    receiver: 'Payment Receipt',
    category: 'Other',
    title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Screenshot Expense',
    note: 'Screenshot uploaded. You can fill or adjust the details.',
    confidence: 0.7,
  };
}
