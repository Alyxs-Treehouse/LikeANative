import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationResult, SocialPlatform, TargetLanguage, SystemLanguage } from '../types';

const getAiClient = (customApiKey?: string) => {
  // STRICT REQUIREMENT: User must provide their own key. No fallback to process.env.
  const apiKey = customApiKey?.trim();
  
  if (!apiKey) {
    throw new Error("API Key is required. Please enter your Google Gemini API Key in the settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVariations = async (
  input: string,
  language: TargetLanguage,
  platform: SocialPlatform,
  persona: string,
  apiKey?: string
): Promise<GenerationResult[]> => {
  const ai = getAiClient(apiKey);
  
  const effectivePersona = persona.trim() || "Average Native Speaker";
  
  const systemInstruction = `You are a world-class linguist and social media expert specializing in ${language}. 
  Your task is to rewrite the user's input text to sound like a specific persona on a specific platform.
  
  Target Language: ${language}
  Target Platform: ${platform}
  Target Persona: ${effectivePersona}
  
  Rules:
  1. If the input is not in ${language}, translate it first, then adapt it.
  2. Adopt the nuance, slang, sentence structure, and tone of the requested persona on the given platform.
  3. Provide exactly 3 distinct variations (e.g., one standard/safe, one very stylistic/slang-heavy, one mixed).
  4. Ensure the output fits the typical length constraints or style of the platform (e.g., hashtags for Instagram/RedNote).
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        tone: {
          type: Type.STRING,
          description: "A short label for the tone of this variation (e.g. 'Formal', 'Gen Z Slang', 'Poetic').",
        },
        content: {
          type: Type.STRING,
          description: "The rewritten content in the target language.",
        },
      },
      required: ["tone", "content"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7, // Slightly creative
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);
    return rawData.map((item: any, index: number) => ({
      id: `result-${Date.now()}-${index}`,
      tone: item.tone,
      content: item.content,
    }));

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate variations. Please check your API key and try again.");
  }
};

export const explainSelection = async (
  selection: string,
  fullContext: string,
  targetLanguage: TargetLanguage,
  referenceInput: string,
  outputLanguage: SystemLanguage,
  apiKey?: string
): Promise<string> => {
  const ai = getAiClient(apiKey);

  const prompt = `
  The user has highlighted the following phrase: "${selection}".
  
  Full Context Sentence/Post (Target Language: ${targetLanguage}): "${fullContext}"
  
  User's Original Input: "${referenceInput.substring(0, 1000)}"
  
  Task: Explain the meaning of the highlighted phrase "${selection}". 
  CRITICAL: The explanation MUST be written in ${outputLanguage}.
  
  - If it is slang, explain the connotation.
  - If it is a cultural reference, explain the origin briefly.
  - If it is standard language, explain the definition.
  - Keep the explanation concise (under 50 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Gemini Explain Error:", error);
    return "Error generating explanation. Please check your connection or API key.";
  }
};