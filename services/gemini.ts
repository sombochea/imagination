import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ImageSize, AspectRatio, Language, Character } from "../types";

// Standard client for Text interactions using the injected environment key
const standardAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to get a client for Paid services (Veo)
// Note: Image gen downgraded to Nano Banana (Flash), so it now uses standardAI mostly, but Veo still needs Pro client.
export const getProClient = async (): Promise<GoogleGenAI> => {
  const win = window as any;
  if (win.aistudio) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
    }
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateStorySegments = async (
    topic: string, 
    language: Language = 'English', 
    characters: Character[] = [], 
    customStory?: string,
    educationalGoal?: string
): Promise<any[]> => {
  
  const languageInstruction = language === 'Khmer' 
    ? "Write the story text in Khmer (Cambodian) language. The visual prompts must remain in English." 
    : "Write the story text in English.";

  const characterContext = characters.length > 0 
    ? `\nKey Characters to include:\n${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}\nEnsure these characters appear in the story where appropriate.`
    : '';

  const goalContext = educationalGoal 
    ? `\nPRIMARY EDUCATIONAL GOAL: ${educationalGoal}\nEnsure the story specifically addresses this goal, explaining concepts clearly for a child audience.`
    : '';

  let prompt = '';

  if (customStory) {
     prompt = `
        You are an expert educational content creator powered by Gemini 3.
        Your task is to refine raw story content into a high-quality, engaging, and educational script for a children's visual storybook.
        
        INPUT CONTEXT:
        - Topic: "${topic}"
        - Raw Content: "${customStory}"
        ${goalContext}
        ${characterContext}
        ${languageInstruction}

        INSTRUCTIONS:
        1. Analyze the raw content and restructuring it to maximize educational value and engagement.
        2. Break the narrative into 4-6 distinct "scenes" or segments that flow logically.
        3. For each segment:
           - "text": The script to be read aloud. Keep it rhythmic, clear, and age-appropriate.
           - "visualPrompt": A highly detailed, artistic image generation prompt describing the scene. Use "anime style, vivid colors, high quality". Describe character actions, setting, and lighting.
        
        Return the result as a JSON array.
     `;
  } else {
     prompt = `
        You are an expert educational content creator powered by Gemini 3.
        Create a captivating and educational story to teach children about: "${topic}".

        ${goalContext}
        ${characterContext}
        ${languageInstruction}

        INSTRUCTIONS:
        1. Plan a narrative arc that introduces the concept, explores it through interaction/adventure, and concludes with a clear lesson.
        2. Break this narrative into 4-6 distinct "scenes".
        3. For each scene, provide:
           - "text": The narration script. Use engaging language, simple analogies, and a warm tone.
           - "visualPrompt": A highly detailed image generation prompt. Specify "anime style, vibrant 4k, detailed background". Explicitly describe characters and their actions.
        
        Return the result as a JSON array.
      `;
  }

  // Using Gemini 3 Pro for advanced reasoning and structure
  const response = await standardAI.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The educational story text for this segment" },
            visualPrompt: { type: Type.STRING, description: "A detailed image generation prompt for this segment (anime style)" }
          },
          required: ["text", "visualPrompt"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse story segments", e);
    return [];
  }
};

// Updated to use Nano Banana (gemini-2.5-flash-image)
export const generateProImage = async (
  prompt: string,
  size: ImageSize = ImageSize.Size1K, // Parameter kept for compatibility but ignored by Nano Banana
  aspectRatio: AspectRatio = AspectRatio.Square,
  referenceImages: string[] = []
): Promise<string | null> => {
  try {
    // Use standardAI for Nano Banana (Flash tier)
    const ai = standardAI;
    
    const parts: any[] = [{ text: prompt }];

    referenceImages.forEach(base64Str => {
      const data = base64Str.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = base64Str.match(/^data:([^;]+);/)?.[1] || "image/png";
      parts.push({
        inlineData: { data, mimeType }
      });
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          // imageSize is NOT supported by Nano Banana
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Nano Banana image generation failed", e);
    throw e;
  }
};

export const editImageWithFlash = async (
  base64Image: string,
  prompt: string
): Promise<string | null> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = base64Image.match(/^data:([^;]+);/)?.[1] || "image/png";

    const response = await standardAI.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image editing failed", e);
    throw e;
  }
};

export const generateVideo = async (
  prompt: string, 
  imageBase64?: string
): Promise<{ url: string, data: string } | null> => {
  try {
    const ai = await getProClient();

    let operation;
    
    const config = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    };

    if (imageBase64) {
       const data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
       const mimeType = imageBase64.match(/^data:([^;]+);/)?.[1] || "image/png";
       
       operation = await ai.models.generateVideos({
         model: 'veo-3.1-fast-generate-preview',
         prompt: prompt || "Animate this scene naturally",
         image: {
           imageBytes: data,
           mimeType: mimeType
         },
         config
       });
    } else {
       operation = await ai.models.generateVideos({
         model: 'veo-3.1-fast-generate-preview',
         prompt: prompt,
         config
       });
    }

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const videoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });

    return { url, data: videoBase64 };

  } catch (e) {
    console.error("Video generation failed", e);
    return null;
  }
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcm16ToWavBlob(pcm16Data: Uint8Array, sampleRate: number = 24000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcm16Data.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); 
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmBytes = new Uint8Array(buffer, 44);
  pcmBytes.set(pcm16Data);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const generateSpeech = async (text: string, voiceName: string = 'Puck'): Promise<{ url: string, data: string } | null> => {
  try {
    const response = await standardAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text: text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const pcmData = base64ToUint8Array(base64Audio);
    const wavBlob = pcm16ToWavBlob(pcmData, 24000);
    const url = URL.createObjectURL(wavBlob);
    
    const wavBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res); 
        };
        reader.readAsDataURL(wavBlob);
    });

    return { url, data: wavBase64 };
  } catch (e) {
    console.error("Speech generation failed", e);
    return null;
  }
};