import { GoogleGenAI } from "@google/genai";
import { LanguageMode } from "../types";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini to attempt to fix malformed code.
 * @param brokenCode The invalid string.
 * @param language The language type (json, xml, yaml).
 * @returns A promise that resolves to the fixed string.
 */
export const fixCodeWithAI = async (brokenCode: string, language: LanguageMode): Promise<string> => {
  try {
    const prompt = `Fix the following malformed ${language.toUpperCase()} and return ONLY the valid ${language.toUpperCase()} string. Do not add markdown formatting, code blocks, or explanations. \n\n${brokenCode}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // responseMimeType: language === 'json' ? "application/json" : "text/plain", // Only use JSON mime for JSON
        systemInstruction: `You are a specialized ${language} repair bot. Your only output is valid, parsed ${language} based on the input. If the input is completely unrecoverable, return an empty ${language === 'json' ? '{}' : 'string'}.`,
      }
    });

    let text = response.text;
    if (!text) return "";
    
    // Cleanup any markdown code blocks if the model ignores instruction
    text = text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');
    
    return text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to fix ${language} with AI.`);
  }
};