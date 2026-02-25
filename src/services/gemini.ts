import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export interface Citation {
  uri: string;
  title: string;
  text?: string;
}

export interface AnalysisResult {
  query: string;
  isCited: boolean;
  position: number | null;
  snippet: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  entityGap: string[];
  competitorsCited: string[];
  fullResponse: string;
}

export class GeminiService {
  private ai: GoogleGenAI | null;

  constructor() {
    const apiKey =
      import.meta.env.GEMINI_API_KEY ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      "";
    this.ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  private getAI(): GoogleGenAI {
    if (!this.ai) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to a local .env file and restart Vite."
      );
    }
    return this.ai;
  }

  async analyzeQuery(query: string, myWebsite: string, competitors: string[]): Promise<AnalysisResult> {
    const response = await this.getAI().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are an expert in GEO (Generative Engine Optimization). 
        Analyze the search results for the user's query. 
        Determine if the website "${myWebsite}" is cited as a source.
        Also check if these competitors are cited: ${competitors.join(", ")}.
        Provide a detailed response to the query based on the search results.`,
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    let isCited = false;
    let position: number | null = null;
    let snippet = "";
    const competitorsCited: string[] = [];

    groundingChunks.forEach((chunk, index) => {
      const uri = chunk.web?.uri || "";
      if (uri.toLowerCase().includes(myWebsite.toLowerCase())) {
        isCited = true;
        if (position === null) position = index + 1;
      }
      
      competitors.forEach(comp => {
        if (uri.toLowerCase().includes(comp.toLowerCase()) && !competitorsCited.includes(comp)) {
          competitorsCited.push(comp);
        }
      });
    });

    // Sentiment and Entity Gap analysis
    let entityGap: string[] = [];
    let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';

    if (isCited) {
      const sentimentResponse = await this.getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the sentiment of this AI response specifically regarding the website "${myWebsite}". 
        Is the brand described positively, neutrally, or negatively?
        
        AI Response: "${text.substring(0, 1000)}"
        
        Return ONLY one word: "Positive", "Neutral", or "Negative".`,
      });
      const sentimentText = sentimentResponse.text?.trim() || "Neutral";
      if (['Positive', 'Neutral', 'Negative'].includes(sentimentText)) {
        sentiment = sentimentText as 'Positive' | 'Neutral' | 'Negative';
      }
    }

    if (!isCited) {
      const gapResponse = await this.getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this AI response: "${text.substring(0, 500)}...", why was "${myWebsite}" NOT cited? 
        Identify the 'Entity Gap'. What keywords, facts, or technical terms do the cited competitors have that "${myWebsite}" might be missing? 
        Return a comma-separated list of 5-7 key terms.`,
      });
      entityGap = gapResponse.text?.split(",").map(t => t.trim()) || [];
    }

    return {
      query,
      isCited,
      position,
      snippet: text.substring(0, 200) + "...",
      sentiment,
      entityGap,
      competitorsCited,
      fullResponse: text
    };
  }

  async optimizeContent(content: string): Promise<{ answerFirst: string; schema: string }> {
    const response = await this.getAI().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Optimize the following content for AEO (Answer Engine Optimization).
      1. Rewrite the first 100 words into an 'Answer-First' structure (40-60 words) that directly answers a likely user query.
      2. Generate a 'JSON-LD FAQ Schema' block specifically designed to get cited by LLMs.
      
      Content: ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            answerFirst: { type: "STRING" },
            schema: { type: "STRING" }
          },
          required: ["answerFirst", "schema"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { answerFirst: "Error parsing response", schema: "" };
    }
  }

  async discoverTrendingPrompts(niche: string, myWebsite: string): Promise<{ prompt: string; score: number; reasoning: string }[]> {
    const response = await this.getAI().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Identify the top 10 most common and high-intent search queries/prompts that users ask AI engines regarding the "${niche}" space. 
      For each prompt, evaluate its "Citation Potential Score" (0-100) for the website "${myWebsite}". 
      The score should reflect how likely an AI is to cite this specific website based on its relevance to the query.
      Also provide a brief 1-sentence reasoning for the score.
      
      Return the result as a JSON array of objects with keys: "prompt", "score", and "reasoning".`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              prompt: { type: "STRING" },
              score: { type: "NUMBER" },
              reasoning: { type: "STRING" }
            },
            required: ["prompt", "score", "reasoning"]
          }
        }
      },
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Discovery failed:", e);
      return [];
    }
  }

  async fetchAndAnalyzeUrl(url: string): Promise<{ content: string; summary: string }> {
    try {
      const response = await this.getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the content of this URL: ${url}. 
        1. Extract the main text content of the page (cleaned of HTML/boilerplate).
        2. Provide a 2-3 sentence summary of what the page is about.
        
        Return the result as a JSON object with "content" and "summary" keys.`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              content: { type: "STRING" },
              summary: { type: "STRING" }
            },
            required: ["content", "summary"]
          }
        },
      });

      const result = JSON.parse(response.text || "{}");
      if (!result.content || result.content.length < 10) {
        throw new Error("Empty content returned");
      }
      return result;
    } catch (e) {
      console.error("URL Context failed, trying Search Grounding fallback...", e);
      
      // Fallback: Use Google Search to find information about the site if direct fetch fails
      const fallbackResponse = await this.getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find information about the website or company at ${url}. 
        Summarize what they do and provide a sample of the type of content found on their homepage.
        Return as JSON with "content" (the sample/description) and "summary" (the overview).`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              content: { type: "STRING" },
              summary: { type: "STRING" }
            },
            required: ["content", "summary"]
          }
        },
      });

      try {
        return JSON.parse(fallbackResponse.text || "{}");
      } catch (err) {
        return { 
          content: "Could not fetch live content. Please paste your content manually for optimization.", 
          summary: "Fetch failed." 
        };
      }
    }
  }

  async generateStrategy(results: AnalysisResult[], myWebsite: string): Promise<string> {
    const summaryData = results.map(r => ({
      query: r.query,
      isCited: r.isCited,
      gaps: r.entityGap,
      competitors: r.competitorsCited,
      sentiment: r.sentiment
    }));

    const response = await this.getAI().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are a world-class GEO (Generative Engine Optimization) and AEO (Answer Engine Optimization) strategist. 
      Analyze the following bulk test results for the website "${myWebsite}":
      ${JSON.stringify(summaryData, null, 2)}
      
      Develop a comprehensive, high-level "GEO/AEO/SEO Dominance Strategy". 
      The strategy MUST include:
      
      1. **Executive Summary**: A high-level overview of the brand's current AI visibility and sentiment.
      2. **Content Gap Analysis**: 
         - Identify specific "Entity Gaps" (keywords, facts, technical terms) that are preventing citations.
         - List the top 3 topics where competitors are winning and we are losing.
      3. **Technical AEO Improvements**: 
         - Recommendations for "Answer-First" content restructuring.
         - Specific JSON-LD Schema enhancements (FAQ, HowTo, Product, etc.).
         - Semantic HTML improvements.
4. **Authority & Trust Building**: 
         - Recommendations for improving citation probability (expert quotes, data-backed claims, third-party mentions).
         - Sentiment improvement tactics if negative/neutral sentiment was detected.
      5. **4-Week Implementation Roadmap**: 
         - Week 1: Technical Foundations & Schema.
         - Week 2: Content Gap Filling (The "Entity" Push).
         - Week 3: Answer-First Restructuring.
         - Week 4: Authority & Backlink Alignment for AI.
      
      Format the response in professional, clean Markdown with clear headings and bullet points.`,
    });

    return response.text || "Failed to generate strategy.";
  }

  async generatePromptRoadmap(prompt: string, myWebsite: string, competitors: string[]): Promise<string> {
    const response = await this.getAI().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Create a highly specific, systematic implementation roadmap to get the website "${myWebsite}" cited by AI engines for the following prompt:
      
      PROMPT: "${prompt}"
      
      COMPETITORS TO BEAT: ${competitors.join(", ")}
      
      Your roadmap must include:
      1. **Deep Research**: Analyze what specific entities, facts, or data points the AI expects for this query. Use Google Search to identify what the top-cited sources are providing.
      2. **Content Blueprint**: Exactly what sections, headers, and "Answer-First" snippets need to be added to the page to satisfy the AI's retrieval model.
      3. **Technical Schema**: Specific JSON-LD properties (e.g., FAQ, FactCheck, Dataset) to highlight for this specific query.
      4. **Citation Strategy**: Where to get third-party mentions or data citations to build authority for this specific topic.
      5. **Step-by-Step Implementation**: A clear, prioritized list of actions.
      
      Format in professional Markdown.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "Failed to generate roadmap.";
  }

  async generateMultichannelStrategy(url: string, content: string): Promise<string> {
    const response = await this.getAI().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Perform a deep structural and multichannel strategy audit for the website: ${url}.
      
      CURRENT CONTENT SAMPLE:
      "${content.substring(0, 2000)}"
      
      Your task is to build a "Multichannel AI Dominance Strategy" that covers:
      1. **Website Structure Audit**: Analyze the current content hierarchy and suggest improvements for LLM readability (e.g., semantic nesting, data tables, clear entity definitions).
      2. **Multichannel Distribution**: Suggest how to use other channels (LinkedIn, X/Twitter, GitHub, Reddit, Niche Directories) to feed the AI's training data or retrieval context.
      3. **Platform-Specific Tactics**: 
         - How to rank in ChatGPT (OpenAI Search).
         - How to rank in Perplexity (Real-time citations).
         - How to rank in Google AI Overviews.
      4. **Technical Implementation**: Specific API-level or metadata-level changes to make the site a "Preferred Source".
      
      Format in professional Markdown with a focus on systematic, actionable steps.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "Failed to generate multichannel strategy.";
  }
}
