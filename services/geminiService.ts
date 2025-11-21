import { GoogleGenAI, Type } from "@google/genai";
import { ParsedDataResponse } from '../types';

export const parseGradesImage = async (base64Image: string): Promise<ParsedDataResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze the provided image of a student grade spreadsheet.
    Extract the data into a JSON structure.
    
    The columns typically correspond to:
    1. Student Name (Nombre)
    2. Trabajo Final -> Avances (advances)
    3. Trabajo Final -> Replica (replica)
    4. Trabajo Final -> Informe (report)
    5. Nota Final Corte I 15% (final15)
    6. Nota Final Corte I 20% (final20)
    7. Corte (finalCut)

    Ignore the row numbers. Ensure numerical values are parsed as numbers.
    If a cell is empty or '-', treat it as 0.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', 
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            students: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  advances: { type: Type.NUMBER },
                  replica: { type: Type.NUMBER },
                  report: { type: Type.NUMBER },
                  final15: { type: Type.NUMBER },
                  final20: { type: Type.NUMBER },
                  finalCut: { type: Type.NUMBER }
                },
                required: ["name", "advances", "replica", "report", "final15", "final20", "finalCut"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ParsedDataResponse;

  } catch (error) {
    console.error("Error parsing image with Gemini:", error);
    throw error;
  }
};

export const generateEncouragingMessage = async (studentName: string, grade: number) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Keep up the good work!";

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a very short (1 sentence), encouraging message for a student named ${studentName} who got a final grade of ${grade}. If the grade is low (below 3.0), be supportive. If high, be congratulatory. Language: Spanish.`
        });
        return response.text || "¡Buen trabajo!";
    } catch (e) {
        return "¡Buen trabajo!";
    }
}
