import { GoogleGenAI } from '@google/genai';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

const SYSTEM_INSTRUCTION = `You are 'Your Digital Assistant', a friendly and patient AI guide for senior citizens (over 55) in Israel who are new to computers and smartphones. Your entire personality and all your responses must reflect this.

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
`;

const isProduction = window.location.hostname.includes('netlify.app');

async function streamFromNetlify(
  message: string,
  onStream: (chunk: { text: string; sources?: any[] }) => void
) {
  const response = await fetch('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    let errorDetails = `שגיאה מהשרת (${response.status} ${response.statusText}).`;
    try {
      const errorText = await response.text();
      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          errorDetails = errorData?.error?.message || errorText;
        } catch (e) {
          errorDetails = errorText;
        }
      }
    } catch (e) {
        // Failed to read error body, stick with the status code message.
    }
    throw new Error(errorDetails);
  }


  if (!response.body) {
    throw new Error("השרת החזיר תשובה ריקה.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const textChunk = decoder.decode(value, { stream: true });
    const lines = textChunk.split('\n\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      try {
        const jsonStr = line.replace('data: ', '');
        if (jsonStr) {
            const data = JSON.parse(jsonStr);
            onStream(data);
        }
      } catch (e) {
        console.error('Error parsing SSE chunk:', line, e);
      }
    }
  }
}

async function streamFromGemini(
  message: string,
  onStream: (chunk: { text: string; sources?: any[] }) => void
) {
  const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (!apiKey) {
    throw new Error("מפתח API לא נמצא. יש להזין מפתח בהגדרות דרך הכפתור בראש העמוד.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  for await (const chunk of responseStream) {
    const chunkData = {
      text: chunk.text,
      sources: [],
    };
    onStream(chunkData);
  }
}

export async function sendMessage(
  message: string,
  onStream: (chunk: { text: string; sources?: any[] }) => void
): Promise<void> {
  try {
    if (isProduction) {
      await streamFromNetlify(message, onStream);
    } else {
      await streamFromGemini(message, onStream);
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
    let errorMessage = "מצטער, נתקלתי בבעיה. אנא נסה שוב מאוחר יותר.";
    if (error instanceof Error) {
      if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
        errorMessage = "מפתח ה-API שהוזן אינו תקין. יש לפתוח את ההגדרות, למחוק את המפתח השגוי ולהזין מפתח תקין.";
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      } else {
        // This will now correctly display the detailed error from streamFromNetlify
        errorMessage = error.message;
      }
    }
    onStream({ text: errorMessage });
  }
}
