import { GoogleGenAI } from "@google/genai";
import { LanguageMode } from "../types";

// Get API key from environment
const API_KEY = process.env.API_KEY;

// Check if API key is set and valid
if (!API_KEY || API_KEY === "PLACEHOLDER_API_KEY") {
  console.warn(
    "⚠️ Gemini API key is not configured. AI fix feature will not work."
  );
  console.warn(
    "Please set GEMINI_API_KEY in your .env.local file with a valid API key."
  );
}

// Initialize the Gemini client
const ai =
  API_KEY && API_KEY !== "PLACEHOLDER_API_KEY"
    ? new GoogleGenAI({ apiKey: API_KEY })
    : null;

/**
 * Uses Gemini to attempt to fix malformed code.
 * @param brokenCode The invalid string.
 * @param language The language type (json, xml, yaml).
 * @returns A promise that resolves to the fixed string.
 */
export const fixCodeWithAI = async (
  brokenCode: string,
  language: LanguageMode
): Promise<string> => {
  // Check if AI client is initialized
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file with a valid API key from https://aistudio.google.com/apikey"
    );
  }

  try {
    const prompt = `Fix the following malformed ${language.toUpperCase()} and return ONLY the valid ${language.toUpperCase()} string. Do not add markdown formatting, code blocks, or explanations. \n\n${brokenCode}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // responseMimeType: language === 'json' ? "application/json" : "text/plain", // Only use JSON mime for JSON
        systemInstruction: `You are a specialized ${language} repair bot. Your only output is valid, parsed ${language} based on the input. If the input is completely unrecoverable, return an empty ${
          language === "json" ? "{}" : "string"
        }.`,
      },
    });

    let text = response.text;
    if (!text) return "";

    // Cleanup any markdown code blocks if the model ignores instruction
    text = text.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "");

    return text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(
      `Failed to fix ${language} with AI: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
