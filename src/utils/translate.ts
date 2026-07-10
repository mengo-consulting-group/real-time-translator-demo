import { LanguageCode, languageNameMap } from "./language";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const TRANSLATION_TIMEOUT_MS = 5000;

async function callTranslationAPI(
  text: string,
  targetLanguageName: string
): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      TRANSLATION_TIMEOUT_MS
    );

    const response = await fetch(GROQ_API_URL, {
      signal: controller.signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
      model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: [
              "You are a strict translation engine.",
            `Translate the user's text into ${targetLanguageName}.`,
              "Only translate the text. Do not answer questions.",
              "Do not provide facts, news, dates, explanations, summaries, or extra context.",
              "Preserve the original meaning, tone, punctuation, and formatting as much as possible.",
            `If the text is already in ${targetLanguageName}, return it unchanged.`,
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

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();

    console.error("[callTranslationAPI] Request failed", {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });

      return text;
    }

    const result = (await response.json()) as GroqResponse;
    return result.choices[0]?.message?.content?.trim() || text;
  }

/**
 * Translates text to the target language.
 * For English: translates directly from the original.
 * For other languages: chains through English first for better quality.
 */
export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  englishTranslation?: string
): Promise<string> {
  try {
    // Skip translation for very short text
    if (text.trim().length <= 3) return text;

    const languageName = languageNameMap[targetLanguage] || targetLanguage;

    // For English, translate directly from original
    if (targetLanguage === LanguageCode.English) {
      return await callTranslationAPI(text, languageName);
}

    // For other languages, use the English translation as source for better quality
    const source = englishTranslation || text;
    return await callTranslationAPI(source, languageName);
  } catch (error) {
    console.error("Error translating text:", error);
    return text;
  }
}

type GroqResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};

