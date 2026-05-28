import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
     const res = await ai.request({
       url: "models",
       method: "GET"
     });
     console.log(res);
  } catch (e) {
     console.error(e);
  }
}
run();
