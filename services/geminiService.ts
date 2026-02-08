import { GoogleGenAI, Type } from "@google/genai";
import { AspectRatio, ImageSize, BlogPost, ApiConfig } from "../types";

// --- HELPERS ---

// Retry helper
const runWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isOverloaded = error?.status === 503 || error?.message?.includes('overloaded');
    const isRateLimited = error?.status === 429;
    
    if (retries > 0 && (isOverloaded || isRateLimited)) {
      console.warn(`API Error (${error.status || 'overloaded'}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return runWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const validateConfig = (config: ApiConfig) => {
  if (!config.apiKey) {
    throw new Error(`Please enter your ${config.provider.toUpperCase()} API Key in the settings.`);
  }
};

// --- PROMPTS ---

const getSystemInstruction = (tone: string, audience: string) => `
You are an expert professional blog writer and SEO specialist. 
Your goal is to write a completely original, human-like, and engaging blog post.

CRITICAL INSTRUCTIONS:
1. **Respect the Count:** If the title mentions a specific number (e.g., "23 Ideas", "10 Tips"), you MUST provide exactly that many distinct sections. Do not summarize, do not group them. Write them all out.
2. **Structure:** Use <h1> for Title, <h2> for Main Sections. Use Semantic HTML.
3. **Image Placeholders:** You must insert a placeholder text exactly like this: "[[INSERT_IMAGE_#]]" where you think an image should go.
    - You MUST put "[[INSERT_IMAGE_1]]" immediately after the main <h1> Title (Hero Image).
    - You MUST put a new placeholder "[[INSERT_IMAGE_2]]", "[[INSERT_IMAGE_3]]", etc., immediately after **EVERY** <h2> header or major section in the blog.
    - Ensure the numbering is sequential (1, 2, 3, 4...).

Target Audience: ${audience}.
Tone: ${tone}.

Output Format: JSON with one field: 'contentHtml' containing the full blog post formatted in Semantic HTML.
`;

const getBlogPrompt = (title: string, referenceContent: string) => `
Blog Title: "${title}"
Reference/Competitor Content: "${referenceContent}"

Write the full blog post now. Ensure you write ALL items if it is a listicle and include an image placeholder for every single one.
Return ONLY valid JSON.
`;

const getPromptGenPrompt = (blogContent: string, count: number) => {
  const truncatedContent = blogContent.length > 50000 
    ? blogContent.substring(0, 50000) + "...(truncated)" 
    : blogContent;

  return `
  Analyze the following blog post content and generate exactly ${count} detailed image prompts.
  The prompts must correspond to the image placeholders (Hero image first, then section images).
  
  Blog Content: ${truncatedContent}
  
  Output a JSON array of strings. Example: ["A modern sunroom...", "A cozy reading nook..."]
  `;
};

// --- GEMINI IMPLEMENTATION ---

const generateGeminiContent = async (apiKey: string, prompt: string, systemInstruction: string, isArray = false) => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: isArray ? {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      } : {
        type: Type.OBJECT,
        properties: { contentHtml: { type: Type.STRING } },
        required: ["contentHtml"]
      }
    }
  });
  const text = response.text;
  if (!text) throw new Error("No content generated");
  return JSON.parse(text);
};

const generateGeminiImage = async (apiKey: string, prompt: string, size: ImageSize, ratio: AspectRatio) => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { imageSize: size, aspectRatio: ratio } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image data returned from Gemini");
};

// --- OPENAI / GROQ IMPLEMENTATION (REST) ---

const fetchOpenAiCompatibleCompletion = async (
  provider: 'openai' | 'groq',
  apiKey: string,
  prompt: string,
  systemInstruction: string,
  isArray = false
) => {
  const baseUrl = provider === 'openai' 
    ? 'https://api.openai.com/v1/chat/completions' 
    : 'https://api.groq.com/openai/v1/chat/completions';
  
  const model = provider === 'openai' ? 'gpt-4o' : 'llama-3.3-70b-versatile';

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`${provider.toUpperCase()} API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.choices[0].message.content;
  
  // Clean potential markdown code blocks if the model adds them despite json_object mode
  const jsonStr = textContent.replace(/```json\n?|\n?```/g, '');
  
  const parsed = JSON.parse(jsonStr);

  if (isArray) {
    // Groq/OpenAI might return { "prompts": [...] } or just [...] depending on how strictly they follow instructions inside the json object constraint
    // If the prompt asked for an array, but json_object forces an object wrapper often.
    if (Array.isArray(parsed)) return parsed;
    // Check if values are wrapped in a key (common with json_object mode)
    const values = Object.values(parsed);
    if (values.length > 0 && Array.isArray(values[0])) return values[0];
    return values;
  }
  
  return parsed;
};

const generateOpenAiImage = async (apiKey: string, prompt: string, size: ImageSize) => {
  // Map ImageSize to DALL-E 3 supported sizes
  const dallESize = size === ImageSize.SIZE_4K ? "1024x1792" : "1024x1024"; // DALL-E 3 is limited on sizes

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: dallESize,
      response_format: "b64_json"
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI Image Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return `data:image/png;base64,${data.data[0].b64_json}`;
};

// --- MAIN EXPORTED FUNCTIONS ---

export const generateBlogContent = async (
  apiConfig: ApiConfig,
  title: string,
  referenceContent: string,
  tone: string,
  audience: string
): Promise<BlogPost> => {
  validateConfig(apiConfig);
  
  const systemInstruction = getSystemInstruction(tone, audience);
  const prompt = getBlogPrompt(title, referenceContent);

  return runWithRetry(async () => {
    let result;
    if (apiConfig.provider === 'gemini') {
      result = await generateGeminiContent(apiConfig.apiKey, prompt, systemInstruction);
    } else {
      result = await fetchOpenAiCompatibleCompletion(apiConfig.provider, apiConfig.apiKey, prompt, systemInstruction);
    }

    return {
      title: title,
      contentHtml: result.contentHtml,
      suggestedImagePrompts: []
    };
  });
};

export const generateImagePromptsFromContent = async (
  apiConfig: ApiConfig,
  blogContent: string,
  count: number
): Promise<string[]> => {
  validateConfig(apiConfig);
  const prompt = getPromptGenPrompt(blogContent, count);
  // Simple system instruction for prompts
  const systemInstruction = "You are an AI assistant that extracts image prompts from blog content. Output JSON.";

  return runWithRetry(async () => {
    if (apiConfig.provider === 'gemini') {
      return await generateGeminiContent(apiConfig.apiKey, prompt, systemInstruction, true);
    } else {
      return await fetchOpenAiCompatibleCompletion(apiConfig.provider, apiConfig.apiKey, prompt, systemInstruction, true);
    }
  });
};

export const generateBlogImage = async (
  apiConfig: ApiConfig,
  prompt: string,
  size: ImageSize,
  ratio: AspectRatio
): Promise<string> => {
  validateConfig(apiConfig);

  return runWithRetry(async () => {
    if (apiConfig.provider === 'gemini') {
      return await generateGeminiImage(apiConfig.apiKey, prompt, size, ratio);
    } else if (apiConfig.provider === 'openai') {
      return await generateOpenAiImage(apiConfig.apiKey, prompt, size);
    } else {
      throw new Error("Groq does not support image generation. Please use Gemini or OpenAI for images.");
    }
  }, 2, 4000); // 2 retries, 4s delay for images
};