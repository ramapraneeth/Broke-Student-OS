import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExpenseCategory } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
 * Converts a File or Blob into a base64 inline data object for Gemini
 */
export async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'image/jpeg',
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parses payment receipt / UPI screenshot using Gemini 3.6 Flash
 */
export async function scanExpenseReceipt(file: File): Promise<ScannedExpenseResult> {
  const imagePart = await fileToGenerativePart(file);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const today = new Date().toISOString().split('T')[0];

  const prompt = `
You are an expert financial receipt and payment scanner for an Indian student expense manager app.
Analyze this payment receipt or transaction screenshot (from Google Pay, PhonePe, Paytm, CRED, Bank SMS, or bill receipt).

Extract the following:
1. "amount": The numerical transaction amount in INR (e.g. 150.00). Must be a positive number.
2. "date": The transaction date in "YYYY-MM-DD" format. If today or not clearly specified, use "${today}".
3. "receiver": The exact receiver name, merchant name, UPI handle name, or payee shown on the receipt.
4. "category": Categorize strictly into ONE of the following:
   - "Food": (e.g. Swiggy, Zomato, Chai, Canteen, Cafe, Starbucks, McDonald's, KFC, Mess, Biryani, Restaurant, Food Court, Dhaba)
   - "Transport": (e.g. Rapido, Uber, Ola, Metro, IRCTC, Bus, Train, Petrol, Fuel, Indian Oil, HP, Shell, Auto)
   - "Education": (e.g. Xerox, Photocopy, Printout, Book Store, College Fee, Tuition, Library, Exam, Stationary, Coursera, Udemy)
   - "Hostel": (e.g. Room Rent, PG Rent, Maintenance, Water Can, Electricity, Maid, WiFi, Broadband)
   - "Entertainment": (e.g. Netflix, Spotify, BookMyShow, Movie, Cinema, PVR, INOX, Gaming, Steam, Prime Video)
   - "Shopping": (e.g. Amazon, Flipkart, Myntra, DMart, Blinkit, Zepto, Instamart, Supermarket, Clothing, Electronics)
   - "Recharge": (e.g. Jio, Airtel, Vi, Mobile Recharge, Fastag, DTH)
   - "Other": (If the receiver is an individual person, unknown peer, or doesn't clearly match above categories)
5. "title": 
   - If category is "Other", set title strictly to the receiver's name (e.g. "Payment to Ramesh" or "Ramesh Kumar").
   - If category is known, set a clear title (e.g. "Swiggy Order", "Rapido Bike", "College Xerox").
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

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = result.response.text();
  
  try {
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
      confidence: parsed.confidence || 0.9,
    };
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', responseText, err);
    throw new Error('Could not parse transaction details from screenshot.');
  }
}
