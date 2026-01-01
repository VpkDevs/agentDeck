
import { GoogleGenAI, Content, Part, Tool, Modality, Type } from "@google/genai";
import { ChatMessage, Profile, Prompt, Attachment } from '../types';

function generateSystemInstruction(prompt: Prompt | null, profile: Profile): string {
    let instruction = prompt ? prompt.prompt : "You are a helpful AI assistant.";
    
    instruction += "\n\n--- PREFERENCES ---";
    instruction += `\nUser: ${profile.userName || 'User'}.`;
    
    // Tone adjustments
    if (profile.creativity > 0.7) instruction += " Be creative and expansive.";
    else if (profile.creativity < 0.3) instruction += " Be strictly analytical and factual.";
    
    if (profile.conciseness > 0.7) instruction += " Be extremely concise. Bullet points preferred.";
    else if (profile.conciseness < 0.3) instruction += " Provide comprehensive, detailed explanations.";
    
    if (profile.useEmojis) instruction += " Use emojis.";
    if (profile.askClarifyingQuestions) instruction += " Ask clarifying questions if requirements are vague.";

    return instruction;
}

function historyToContent(history: ChatMessage[]): Content[] {
    // Filter out empty model responses that might occur during streaming init
    const validHistory = history.filter((msg, index) => 
        !(index === history.length - 1 && msg.role === 'model' && !msg.content)
    );

    return validHistory.map(msg => {
        const parts: Part[] = [];
        
        if (msg.content) {
            parts.push({ text: msg.content });
        }

        if (msg.attachments) {
            msg.attachments.forEach(att => {
                if (att.type === 'image') {
                    parts.push({ inlineData: { data: att.content, mimeType: att.mimeType } });
                } else if (att.type === 'text') {
                    parts.push({ text: `\n--- ATTACHED FILE: ${att.name} ---\n${att.content}\n--- END ATTACHMENT ---\n` });
                }
            });
        }

        return {
            role: msg.role,
            parts: parts
        };
    });
}

export async function testSystemPrompt(prompt: Prompt, profile: Profile, userMessage: string): Promise<string> {
    if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = generateSystemInstruction(prompt, profile);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: { systemInstruction }
    });
    
    return response.text || "";
}

export async function streamGeminiResponse(
    currentSessionHistory: ChatMessage[],
    userMessage: string,
    attachments: Attachment[],
    activePrompt: Prompt | null,
    profile: Profile,
    configOptions: { useSearch: boolean; useThinking: boolean; useMaps: boolean; location?: { lat: number; lng: number } }
) {
    if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = generateSystemInstruction(activePrompt, profile);
    
    const tools: Tool[] = [];
    if (configOptions.useSearch) tools.push({ googleSearch: {} });
    if (configOptions.useMaps) tools.push({ googleMaps: {} });

    const config: any = { systemInstruction };

    if (tools.length > 0) {
        config.tools = tools;
        if (configOptions.location && configOptions.useMaps) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: configOptions.location.lat,
                        longitude: configOptions.location.lng
                    }
                }
            }
        }
    }

    // Model Selection
    let model = 'gemini-2.5-flash';
    if (configOptions.useThinking) {
        model = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 16000 }; 
    } else if (attachments.some(a => a.type === 'image')) {
        // Flash is great for images, but let's ensure we use a capable model
        model = 'gemini-2.5-flash';
    }

    // Construct the latest user message content to send (Chat vs GenerateContent)
    // We use chat.sendMessageStream for history awareness
    const historyContent = historyToContent(currentSessionHistory);
    
    const chat = ai.chats.create({
        model,
        config,
        history: historyContent
    });

    // Prepare current turn parts
    const currentParts: Part[] = [{ text: userMessage }];
    attachments.forEach(att => {
        if (att.type === 'image') {
            currentParts.push({ inlineData: { data: att.content, mimeType: att.mimeType } });
        } else if (att.type === 'text') {
            currentParts.push({ text: `\n[Context from ${att.name}]:\n${att.content}\n` });
        }
    });

    return await chat.sendMessageStream({ parts: currentParts });
}

export async function getChatResponseStream(
    prompt: Prompt, 
    profile: Profile, 
    history: ChatMessage[], 
    message: string, 
    configOptions: { useSearch: boolean; useThinking: boolean; useMaps: boolean; location?: { lat: number; lng: number } }
) {
    // Use the existing streamGeminiResponse with empty attachments
    return streamGeminiResponse(history, message, [], prompt, profile, configOptions);
}

export async function getChatResponseStreamWithContext(
    documentContent: string, 
    systemPrompt: string, 
    history: ChatMessage[], 
    message: string
) {
    if (!process.env.API_KEY) throw new Error("API_KEY missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const config = {
        systemInstruction: `${systemPrompt}\n\n--- DOCUMENT CONTEXT ---\n${documentContent}`
    };

    const historyContent = historyToContent(history);
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config,
        history: historyContent
    });

    return await chat.sendMessageStream({ parts: [{ text: message }] });
}

export async function getChatResponseStreamForImage(
    imageBase64: string, 
    mimeType: string, 
    history: ChatMessage[], 
    message: string
) {
    if (!process.env.API_KEY) throw new Error("API_KEY missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // For image chat, we include the image in the system context or first message, 
    // but since we want persistent context, we'll assume the image is relevant to the session.
    // However, the historyToContent handles attachments if they were in history.
    // For a dedicated "Image Session", we might need to prepend the image if it's not in history yet, 
    // OR we just rely on the history.
    // simpler approach: pass the image as part of the *current* user message if it's the first one,
    // or system instruction? System instruction doesn't support images easily in all models.
    // We'll treat the image as a Part of the user message if it's not already in history, 
    // but typically the session starts with the image.
    
    // If the image is "attached" to the session, we can include it in every request or just rely on caching context.
    // Here we will include it in the parts for this turn if history is empty-ish or just send it again (Flash handles it).
    
    const historyContent = historyToContent(history);
    const parts: Part[] = [
        { inlineData: { data: imageBase64, mimeType } },
        { text: message }
    ];

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: historyContent
    });

    return await chat.sendMessageStream({ parts });
}

export async function getSmartSuggestions(history: ChatMessage[]): Promise<string[]> {
    if (!process.env.API_KEY) return [];
    
    // Only look at the last few turns to save context
    const recentHistory = history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const instruction = `Suggest 3 short, relevant follow-up actions for the user based on this conversation:\n${recentHistory}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Fast and cheap
            contents: instruction,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } }
                }
            }
        });
        
        const jsonText = response.text?.trim();
        if (!jsonText) return [];
        const result = JSON.parse(jsonText);
        return result.suggestions?.slice(0, 3) || [];
    } catch (e) {
        return [];
    }
}

export async function transcribeAudio(audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> {
    if (!process.env.API_KEY) throw new Error("API_KEY missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: audioBase64, mimeType } },
                { text: "Transcribe this audio strictly verbatim." }
            ]
        }
    });
    return response.text || "";
}

export async function generateSpeech(text: string): Promise<ArrayBuffer> {
    if (!process.env.API_KEY) throw new Error("API_KEY missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
        }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio returned");
    
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
}

export function createLiveClient() {
    if (!process.env.API_KEY) throw new Error("API_KEY missing");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}
