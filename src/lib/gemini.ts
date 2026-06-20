import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Returns a Gemini model instance.
 * Lazy-initialized at call time — never at module load — so the key
 * is evaluated only inside server-side API routes and never bundled
 * into client-side JavaScript.
 */
export const getGeminiModel = (modelName: string = 'gemini-2.5-flash') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing server environment variable: GEMINI_API_KEY. ' +
      'Add it to .env.local and restart the dev server.'
    );
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};
