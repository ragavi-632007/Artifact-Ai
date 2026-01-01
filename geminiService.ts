import { GoogleGenAI, Type } from "@google/genai";
import { Site, Artifact } from "./types";
import * as pdfjs from "pdfjs-dist";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

/**
 * Parses a PDF file and extracts text content from all pages.
 */
async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const strings = textContent.items.map((item: any) => item.str);
      fullText += strings.join(" ") + "\n";
    }

    if (!fullText.trim()) {
      throw new Error(
        "The PDF appears to be empty or contains no extractable text."
      );
    }

    return fullText;
  } catch (err: any) {
    console.error("PDF Parsing Error:", err);
    throw new Error(
      `Failed to parse PDF: ${err.message || "Malformed PDF file"}`
    );
  }
}

/**
 * Service to interact with Gemini API for archaeological reasoning and entity extraction.
 */
export const extractSiteAnalysis = async (
  input: string | File
): Promise<Partial<Site>> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error(
        "Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file."
      );
    }

    let reportText = "";

    if (typeof input === "string") {
      reportText = input;
    } else if (input instanceof File) {
      if (
        input.type === "application/pdf" ||
        input.name.toLowerCase().endsWith(".pdf")
      ) {
        reportText = await extractTextFromPdf(input);
      } else {
        reportText = await input.text();
      }
    }

    // Truncate very long text to reduce token usage
    if (reportText.length > 5000) {
      reportText = reportText.substring(0, 5000) + "... [truncated for length]";
    }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Extract detailed archaeological data from this excavation report. Use professional archaeological terminology.
      
      You must extract:
      1. Site name (proper noun).
      2. Geographic location: latitude, longitude (decimal), and district (e.g., Sivaganga, Thoothukudi).
      3. Chronology: archaeological periods (e.g., Sangam Age, Megalithic).
      4. A concise semantic description emphasizing cultural importance.
      5. List of artifacts (name, material, category, description).
      6. List of structural remains (e.g., brick walls, ring wells).

      Report Text: ${reportText}`,
      config: {
        systemInstruction:
          "You are a senior archaeologist and NLP specialist. Your task is to perform high-precision named entity recognition and semantic summarization on excavation reports.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            location: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                district: { type: Type.STRING },
              },
              required: ["lat", "lng", "district"],
            },
            chronology: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            description: { type: Type.STRING },
            artifacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  material: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: [
                      "pottery",
                      "bead",
                      "tool",
                      "coin",
                      "ornament",
                      "other",
                    ],
                  },
                  description: { type: Type.STRING },
                },
                required: ["name", "material", "category", "description"],
              },
            },
            structures: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "name",
            "location",
            "chronology",
            "description",
            "artifacts",
            "structures",
          ],
        },
      },
    });

    try {
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (err) {
      console.error("JSON Parse Error from Gemini:", err);
      throw new Error(
        "Failed to process archaeological data. Please ensure the document is a valid report."
      );
    }
  } catch (error: any) {
    console.error("Error extracting site analysis:", error);

    if (
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      throw new Error(
        "API quota exceeded. Please wait a moment before trying again or upgrade to a paid plan."
      );
    }

    throw new Error(
      `Failed to extract site data: ${error.message || "Unknown error"}`
    );
  }
};

/**
 * Computes deep similarity between two specific sites using Gemini 2.0 Flash for advanced reasoning.
 */
export const computeSimilarityExplanation = async (
  siteA: Site,
  siteB: Site
): Promise<string> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error(
        "Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file."
      );
    }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
    const prompt = `Perform a domain-specific comparative analysis between two archaeological sites in Tamil Nadu.
    
    SITE A: ${siteA.name}
    Context: ${siteA.description}
    Chronology: ${siteA.chronology.join(", ")}
    Artifacts: ${siteA.artifacts
      .map((a) => `${a.name} (${a.material})`)
      .join(", ")}
    Structures: ${siteA.structures.join(", ")}
    
    SITE B: ${siteB.name}
    Context: ${siteB.description}
    Chronology: ${siteB.chronology.join(", ")}
    Artifacts: ${siteB.artifacts
      .map((a) => `${a.name} (${a.material})`)
      .join(", ")}
    Structures: ${siteB.structures.join(", ")}
    
    Identify:
    1. Material Culture Overlap (e.g., shared use of specific semi-precious stones or pottery types).
    2. Potential Trade/Cultural Connections (did they belong to the same trade network or guild?).
    3. Chronological Correspondence.
    
    Provide a professional explanation (4-5 sentences).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are a digital humanities researcher specializing in maritime and inland trade networks of Early Historic South India.",
      },
    });

    return response.text || "No explanation could be generated.";
  } catch (error: any) {
    console.error("Error generating similarity explanation:", error);

    // More detailed error handling
    if (
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      throw new Error(
        "API quota exceeded for free tier. Please upgrade to a paid plan or wait before retrying."
      );
    }

    throw new Error(
      `Failed to generate comparison: ${error.message || "Unknown error"}`
    );
  }
};

/**
 * Discover broader patterns across the entire site collection using Gemini 1.5 Pro.
 */
export const discoverPatterns = async (allSites: Site[]): Promise<string> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error(
        "Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file."
      );
    }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
    const summary = allSites
      .map(
        (s) => `
      SITE: ${s.name}
      District: ${s.location.district}
      Chronology: ${s.chronology.join(", ")}
      Artifacts Summary: ${s.artifacts
        .map((a) => a.material)
        .slice(0, 5)
        .join(", ")}
    `
      )
      .join("\n---\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze this archaeological site dataset and discover hidden macro-patterns. 
      Focus on:
      1. Cross-regional trade routes (e.g., riverine or coastal links).
      2. Technological diffusion (e.g., shared iron-smelting techniques).
      3. Cultural homogenization across disparate districts.
      
      Data:
      ${summary}`,
      config: {
        systemInstruction:
          "You are a macro-historian analyzing archaeological datasets to uncover socio-economic trends.",
      },
    });
    return (
      response.text ||
      "No patterns discovered yet. Add more sites for analysis."
    );
  } catch (error: any) {
    console.error("Error discovering patterns:", error);
    throw new Error(
      `Failed to discover patterns: ${error.message || "Unknown error"}`
    );
  }
};
