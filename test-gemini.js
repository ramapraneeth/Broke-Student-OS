import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent('Extract receipt details test. Respond in JSON: {"status": "ok"}');
    console.log('Gemini 3.6 Flash Response:', result.response.text());
  } catch (err) {
    console.error('Gemini 3.6 error:', err);
  }
}

test();
