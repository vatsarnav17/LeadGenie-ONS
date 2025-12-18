import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateColdEmail = async (lead: Lead): Promise<string> => {
  if (!apiKey) {
    return "Error: No API Key provided. Please set process.env.API_KEY.";
  }

  // Filter out internal metadata keys (starting with _)
  const cleanData = Object.entries(lead)
    .filter(([key]) => !key.startsWith('_') && key !== 'id')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const prompt = `
    You are an expert sales representative. Write a personalized cold outreach email for the following lead.
    Keep it professional, concise, and persuasive. Focus on starting a conversation.
    
    Lead Details:
    ${cleanData}

    Subject: [Generate a catchy subject line]
    Body: [Generate the email body]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate email.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating email. Please try again.";
  }
};

export const analyzeLead = async (lead: Lead): Promise<string> => {
    if (!apiKey) return "API Key missing.";

    const cleanData = Object.entries(lead)
    .filter(([key]) => !key.startsWith('_') && key !== 'id')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

    const prompt = `
        Analyze this lead and provide 3 brief bullet points on how to best approach them based on their industry, role, or company.
        Lead Data:
        ${cleanData}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "No analysis available.";
    } catch (error) {
        return "Error analyzing lead.";
    }
}