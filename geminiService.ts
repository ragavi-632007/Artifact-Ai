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
    const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
    const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error(
        "Gemini API key is not configured. Please set a key in settings or check your .env file."
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

    const ai = new GoogleGenAI({ apiKey: apiKey! });
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
 * Heuristic fallback for similarity explanations when API is unavailable.
 */
const computeHeuristicSimilarity = (siteA: Site, siteB: Site): string => {
  const sharedMaterials = siteA.artifacts
    .map((a) => a.material.toLowerCase())
    .filter((m) =>
      siteB.artifacts.some((b) => b.material.toLowerCase() === m)
    );
  
  const uniqueSharedMaterials = Array.from(new Set(sharedMaterials));
  
  const sharedChronology = siteA.chronology.filter((c) =>
    siteB.chronology.includes(c)
  );

  const sharedStructures = siteA.structures.filter((s) =>
    siteB.structures.some(bs => bs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(bs.toLowerCase()))
  );

  let explanation = `The comparison between ${siteA.name} and ${siteB.name} suggests a deep cultural link. `;

  if (sharedChronology.length > 0) {
    explanation += `Both sites were contemporaneous during the ${sharedChronology.join(" and ")} periods, `;
  } else {
    explanation += `While belonging to different primary chronologies, `;
  }

  if (uniqueSharedMaterials.length > 0) {
    explanation += `they share a significant material culture focused on ${uniqueSharedMaterials.slice(0, 3).join(", ")}, indicating shared manufacturing techniques or trade-based technological diffusion. `;
  } else {
    explanation += `they show complementary resource usage across the region. `;
  }

  if (sharedStructures.length > 0) {
    explanation += `The presence of similar structural remains like ${sharedStructures[0]} underscores a shared architectural tradition. `;
  }

  if (siteA.location.district === siteB.location.district) {
    explanation += `Their shared location in the ${siteA.location.district} district highlights a localized cultural hub. `;
  } else {
    explanation += `The connection between ${siteA.location.district} and ${siteB.location.district} suggests an active inland or maritime trade corridor. `;
  }

  return explanation;
};

/**
 * Computes deep similarity between two specific sites using Gemini 2.0 Flash for advanced reasoning.
 */
export const computeSimilarityExplanation = async (
  siteA: Site,
  siteB: Site
): Promise<string> => {
  try {
    const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
    const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return computeHeuristicSimilarity(siteA, siteB);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey! });
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

    // Fallback to heuristic on quota error
    if (
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      console.warn("API Quota exceeded. Using heuristic fallback for similarity explanation.");
      return computeHeuristicSimilarity(siteA, siteB);
    }

    throw new Error(
      `Failed to generate comparison: ${error.message || "Unknown error"}`
    );
  }
};

const discoverHeuristicPatterns = (allSites: Site[]): string => {
  const allMaterials = allSites.flatMap(s => s.artifacts.map(a => a.material.toLowerCase()));
  const commonMaterials = allMaterials.reduce((acc, m) => {
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedMaterials = Object.entries(commonMaterials)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(m => m[0]);

  const districts = Array.from(new Set(allSites.map(s => s.location.district)));

  return `Analysis of the current archaeological dataset indicates several macro-patterns:
  
1. Material Homogenization: The prevalence of ${sortedMaterials.join(", ")} across ${districts.length} different districts suggests an extensive internal trade network moving both raw resources and finished luxury goods.
2. Regional Specialization: Technological clusters, particularly in ironwork and terracotta production, appear to cross-cut traditional geographic boundaries, indicating a shared craft tradition.
3. Cultural Diffusion corridors: Material similarities suggest strong cultural parallels between coastal and inland sites, likely facilitated by riverine trade routes.`;
};

/**
 * Discover broader patterns across the entire site collection using Gemini 1.5 Pro.
 */
export const discoverPatterns = async (allSites: Site[]): Promise<string> => {
  try {
    const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
    const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return discoverHeuristicPatterns(allSites);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey! });
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
    
    // Fallback to heuristic on quota error
    if (
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      console.warn("API Quota exceeded. Using heuristic fallback for global insights.");
      return discoverHeuristicPatterns(allSites);
    }

    throw new Error(
      `Failed to discover patterns: ${error.message || "Unknown error"}`
    );
  }
};
