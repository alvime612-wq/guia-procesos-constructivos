import { GoogleGenAI, Modality } from "@google/genai";
import { type SearchResult, type Source, type Norm } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function getConstructionInfo(query: string): Promise<SearchResult> {
  const textModel = "gemini-2.5-flash";
  const imageModel = "gemini-2.5-flash-image";
  const fullQuery = `${query} construcción`;

  const systemInstruction = `Eres un asistente experto especializado en construcción, diseñado para funcionar de manera óptima en Vercel. Tu tarea es extraer información estructurada de los resultados de búsqueda web y generar un prompt para un generador de imágenes de IA. Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto explicativo).

Ejemplo de formato JSON requerido:
{
  "description": "Una descripción detallada y genérica del proceso constructivo, sin mencionar ubicaciones específicas.",
  "steps": [
    "Preparación del Terreno: Limpieza y nivelación del área donde se realizará la construcción.",
    "Excavación: Realización de zanjas y fosos según los planos para alojar la cimentación."
  ],
  "norms": [
    { "name": "Código de Construcción Internacional (IBC)", "description": "Establece los requisitos mínimos para la seguridad de los edificios." },
    { "name": "ASTM C90", "description": "Especificación estándar para unidades de mampostería de concreto de carga." }
  ],
  "image_prompt": "Una ilustración técnica clara, realista y detallada del proceso de excavación de cimentaciones, mostrando las capas del suelo y el entibado."
}

Ahora, basándote en la consulta del usuario y los resultados de búsqueda, genera un objeto JSON con las siguientes claves:
- "description": Una descripción genérica de 2 a 4 oraciones sobre la actividad, evitando referencias geográficas.
- "steps": Un array de hasta 8 pasos críticos. Cada elemento del array debe ser una cadena de texto que siga estrictamente el formato "Título del Paso: Descripción clara y concisa de la acción a realizar.".
- "norms": Un array de normas técnicas o regulaciones aplicables. Cada elemento DEBE ser un objeto con las claves "name" (nombre/código de la norma) y "description" (una explicación corta y puntual de su propósito).
- "image_prompt": Un prompt detallado y descriptivo para que una IA genere una ilustración técnica clara y relevante (diagrama, infografía) del proceso. Si ninguna ilustración es apropiada, DEBES devolver null.`;

  let responseText = '';
  try {
    const textResponse = await ai.models.generateContent({
      model: textModel,
      contents: fullQuery,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });
    
    responseText = textResponse.text.trim();
    
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
      console.error("Could not find a valid JSON object in the model's response. Response text:", responseText);
      throw new Error("The AI model's response did not contain a valid JSON object.");
    }
    
    const jsonString = responseText.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonString);

    const groundingMetadata = textResponse.candidates?.[0]?.groundingMetadata;
    const sources: Source[] = groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || ''
        }))
        .filter((source: Source) => source.uri) || [];

    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
    
    let image_base64: string | null = null;
    if (data.image_prompt) {
      try {
        const imageResponse = await ai.models.generateContent({
          model: imageModel,
          contents: {
            parts: [{ text: data.image_prompt }],
          },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });

        const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) {
          const base64Data = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType;
          image_base64 = `data:${mimeType};base64,${base64Data}`;
        }
      } catch (imageError) {
        console.error("Image generation failed:", imageError);
        // Fail gracefully, image will be null
      }
    }
    
    return {
      title: query,
      description: data.description,
      steps: data.steps || [],
      norms: data.norms || [],
      image_base64: image_base64,
      sources: uniqueSources
    };

  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof SyntaxError) {
        console.error("Failed to parse JSON response from model. Response text:", responseText);
        throw new Error("The AI model returned an invalid response format. Please try again.");
    }
    throw new Error("Failed to fetch information from the AI model. Please check the console for details.");
  }
}

export const geminiService = {
  getConstructionInfo,
};