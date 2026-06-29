import { LanguageCode, languageNameMap } from "./language";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function translateText(
  text: string,
  targetLanguage: LanguageCode
): Promise<string> {
  try {
    const languageName = languageNameMap[targetLanguage] || targetLanguage;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: [
              "You are a strict translation engine.",
              `Translate the user's text into ${languageName}.`,
              "Only translate the text. Do not answer questions.",
              "Do not provide facts, news, dates, explanations, summaries, or extra context.",
              "Preserve the original meaning, tone, punctuation, and formatting as much as possible.",
              `If the text is already in ${languageName}, return it unchanged.`,
              "Return only the translated text and nothing else.",
          ].join(" "),
          },
          {
            role: "user",
            content: `Text to translate:\n${text}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      console.error("[translateText] Request failed", {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });

      return "";
    }

    const result = (await response.json()) as GroqResponse;
    return result.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Error translating text:", error);
    return "";
  }
}

type GroqResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};
