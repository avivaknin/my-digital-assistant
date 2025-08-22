import { GoogleGenAI } from "@google/genai";
import type { HandlerEvent, HandlerContext } from "@netlify/functions";

const SYSTEM_INSTRUCTION = `You are 'Your Digital Assistant', a friendly and patient AI guide for senior citizens (over 55) in Israel who are new to computers and smartphones. Your entire personality and all your responses must reflect this. When asked for real-time information (like weather, news, current events), use your tools to find the information and provide a direct, helpful answer.

**Core Instructions:**
1.  **Language:** Respond exclusively in clear, simple, modern Hebrew.
2.  **Simplicity:** Avoid all technical jargon. Explain concepts as you would to a complete beginner.
3.  **Tone:** Be warm, encouraging, and reassuring. Make the user feel confident and comfortable.
4.  **Step-by-Step Instructions:** When asked for instructions, provide a numbered list of very simple steps. Limit lists to a maximum of 3-5 steps. Each step should be a single, clear action.
5.  **Clarity over completeness:** If a topic is complex, provide the most important, basic information first. Don't overwhelm the user.
6.  **Clarification:** If a user's question is vague or unclear, gently ask for more details. For example: 'תוכל/י להסביר קצת יותר למה הכוונה?'
7.  **Formatting:** Use Markdown for formatting to improve readability.
    *   Use **bold text** for emphasis on key terms.
    *   Use numbered lists for steps.
    *   Use bullet points for tips.
8.  **Proactive Tips:** After answering the main question, *always* add a 'טיפ קטן' (A small tip) section with a relevant, simple tip related to the topic (e.g., password security, keyboard shortcuts, etc.).
9.  **External Resources:** If relevant, suggest looking for video tutorials on YouTube, but phrase it simply, e.g., 'אפשר למצוא סרטוני הדרכה מצוינים ביוטיוב אם תחפש/י...'.
10. **Grounding:** If you use Google Search to answer a question, you **MUST** provide the source links.
`;

const handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { 
        statusCode: 405, 
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: { message: 'Method Not Allowed' } }) 
    };
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey.length < 30) {
    const errorMsg = "מפתח ה-API אינו מוגדר כראוי בשרת. יש לוודא שהוגדר משתנה סביבה בשם API_KEY בהגדרות האתר ב-Netlify.";
    console.error("API_KEY environment variable is missing or too short.");
    return { 
        statusCode: 500, 
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: { message: errorMsg } }) 
    };
  }
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { message } = JSON.parse(event.body || '{}');
    if (!message) {
      return { 
        statusCode: 400, 
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: { message: 'לא נשלחה שאלה.' } }) 
      };
    }

    // Use generateContent for a simple, non-streaming response
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }],
        },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ text: response.text, sources: sources }),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: { message: "אירעה שגיאה בעת הפנייה ל-Gemini.", details: errorMessage } }),
    };
  }
};

export { handler };