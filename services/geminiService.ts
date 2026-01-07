
import { GoogleGenAI, Type } from "@google/genai";
import { LessonPlan } from "../types";

// Fix: Implemented actual lesson plan generation using Gemini 3 Pro to provide teachers with high-quality structured RPHs.
export const generateLessonPlan = async (subject: string, grade: string, topic: string): Promise<Partial<LessonPlan>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Subject: ${subject}, Grade: ${grade}, Topic: ${topic}`,
            config: {
                systemInstruction: "You are an expert Malaysian educator specialized in the TS25 pedagogical framework. Generate a detailed Lesson Plan (RPH) in JSON format.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING },
                        objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                        successCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
                        activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                        reflection: { type: Type.STRING }
                    },
                    required: ["topic", "objectives", "successCriteria", "activities", "reflection"]
                }
            }
        });

        if (!response.text) throw new Error("No response text from Gemini");
        return JSON.parse(response.text);
    } catch (error: any) {
        console.error("Gemini Lesson Generation Failed:", error);
        if (error.message?.includes("Requested entity was not found")) {
            throw new Error("API_KEY_NOT_FOUND");
        }
        throw error;
    }
};

// Fix: Implemented field suggestions using Gemini 3 Flash for low-latency intelligent context-aware autocomplete.
export const suggestFieldContent = async (field: string, context: Partial<LessonPlan>): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Field: ${field}, Context: ${JSON.stringify(context)}`,
            config: {
                systemInstruction: "Suggest 5 short, professional strings for the specified lesson plan field. Return as a JSON array of strings.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        if (!response.text) return [];
        return JSON.parse(response.text);
    } catch (error: any) {
        console.error("Gemini Suggestion Failed:", error);
        if (error.message?.includes("Requested entity was not found")) {
            throw new Error("API_KEY_NOT_FOUND");
        }
        return [];
    }
};
