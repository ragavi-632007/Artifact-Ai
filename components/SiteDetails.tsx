import React, { useState, useEffect, useMemo, useRef } from "react";
import { Site, Artifact } from "../types";
import { computeSimilarityExplanation } from "../geminiService";

interface SiteDetailsProps {
  site: Site;
  allSites: Site[];
  onClose: () => void;
  onUpdateSite: (site: Site) => void;
}

const SiteDetails: React.FC<SiteDetailsProps> = ({
  site,
  allSites,
  onClose,
  onUpdateSite,
}) => {
  const [activeView, setActiveView] = useState<"details" | "similarity">(
    "details"
  );
  const [similarityInsights, setSimilarityInsights] = useState<{
    [targetId: string]: string;
  }>({});
  const [loadingSimilarity, setLoadingSimilarity] = useState<string | null>(
    null
  );
  const [errorSimilarity, setErrorSimilarity] = useState<{
    [targetId: string]: string;
  }>({});
  const requestInProgress = useRef<{ [targetId: string]: boolean }>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newArtifact, setNewArtifact] = useState<Artifact>({
    name: "",
    material: "",
    category: "other",
    description: "",
  });

  // Simple similarity scoring for finding candidates to compare
  const topSimilarSites = useMemo(() => {
    return allSites
      .filter((s) => s.id !== site.id)
      .map((s) => {
        const materialsA = new Set(
          site.artifacts.map((art) => art.material.toLowerCase())
        );
        const materialsB = new Set(
          s.artifacts.map((art) => art.material.toLowerCase())
        );
        const intersection = new Set(
          [...materialsA].filter((x) => materialsB.has(x))
        );
        const union = new Set([...materialsA, ...materialsB]);
        const score = union.size === 0 ? 0 : intersection.size / union.size;
        return { site: s, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [site, allSites]);

  const fetchSimilarityExplanation = async (targetSite: Site) => {
    // Prevent duplicate requests
    if (requestInProgress.current[targetSite.id]) {
      return;
    }

    // Don't fetch if already cached
    if (similarityInsights[targetSite.id]) return;

    requestInProgress.current[targetSite.id] = true;
    setLoadingSimilarity(targetSite.id);
    setErrorSimilarity((prev) => ({ ...prev, [targetSite.id]: "" }));

    try {
      const explanation = await computeSimilarityExplanation(site, targetSite);
      setSimilarityInsights((prev) => ({
        ...prev,
        [targetSite.id]: explanation,
      }));
    } catch (err: any) {
      let errorMsg = err.message || "Failed to generate comparison.";

      // Check for quota exceeded error
      if (
        err.message?.includes("quota") ||
        err.message?.includes("RESOURCE_EXHAUSTED")
      ) {
        errorMsg =
          "API quota exceeded. Please wait a moment and try again, or upgrade to a paid plan for unlimited access.";
      } else if (err.message?.includes("API key")) {
        errorMsg =
          "Invalid API key. Please check your VITE_GEMINI_API_KEY in the .env file.";
      }

      setErrorSimilarity((prev) => ({ ...prev, [targetSite.id]: errorMsg }));
      console.error(err);
    } finally {
      setLoadingSimilarity(null);
      requestInProgress.current[targetSite.id] = false;
    }
  };

  const handleAddArtifact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtifact.name || !newArtifact.material) {
      alert("Please provide at least a name and material.");
      return;
    }
    const updatedSite: Site = {
      ...site,
      artifacts: [...site.artifacts, newArtifact],
    };
    onUpdateSite(updatedSite);
    setNewArtifact({
      name: "",
      material: "",
      category: "other",
      description: "",
    });
    setShowAddForm(false);
  };

  const removeArtifact = (index: number) => {
    const updatedArtifacts = site.artifacts.filter((_, i) => i !== index);
    onUpdateSite({ ...site, artifacts: updatedArtifacts });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="p-8 border-b bg-gray-50/50 flex justify-between items-start">
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 bg-[#c45a30] rounded-xl flex items-center justify-center text-3xl text-white shadow-lg">
              🏺
            </div>
            <div>
              <h2 className="text-3xl font-serif text-gray-900">{site.name}</h2>
              <div className="flex gap-3 items-center mt-2">
                <span className="text-sm text-gray-500 font-medium">
                  {site.location.district} District
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <div className="flex gap-2">
                  {site.chronology.map((c) => (
                    <span
                      key={c}
                      className="bg-white border text-stone-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 border-b flex gap-8">
          <button
            onClick={() => setActiveView("details")}
            className={`py-4 text-sm font-bold border-b-2 transition-colors ${
              activeView === "details"
                ? "border-[#c45a30] text-[#c45a30]"
                : "border-transparent text-gray-400"
            }`}
          >
            Site Analysis
          </button>
          <button
            onClick={() => setActiveView("similarity")}
            className={`py-4 text-sm font-bold border-b-2 transition-colors ${
              activeView === "similarity"
                ? "border-[#c45a30] text-[#c45a30]"
                : "border-transparent text-gray-400"
            }`}
          >
            Similarity Insights
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeView === "details" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h3 className="text-lg font-serif mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#c45a30]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Semantic Narrative
                  </h3>
                  <p className="text-gray-600 leading-relaxed italic bg-gray-50 p-4 rounded-lg border-l-4 border-[#c45a30]">
                    "{site.description}"
                  </p>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-serif">Artifact Assembly</h3>
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="text-xs font-bold text-[#c45a30] hover:underline"
                    >
                      {showAddForm ? "Cancel" : "+ Register Artifact"}
                    </button>
                  </div>

                  {showAddForm && (
                    <form
                      onSubmit={handleAddArtifact}
                      className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          placeholder="Artifact Name"
                          className="p-2 border rounded text-sm"
                          value={newArtifact.name}
                          onChange={(e) =>
                            setNewArtifact({
                              ...newArtifact,
                              name: e.target.value,
                            })
                          }
                        />
                        <input
                          placeholder="Material"
                          className="p-2 border rounded text-sm"
                          value={newArtifact.material}
                          onChange={(e) =>
                            setNewArtifact({
                              ...newArtifact,
                              material: e.target.value,
                            })
                          }
                        />
                      </div>
                      <textarea
                        placeholder="Description"
                        className="w-full p-2 border rounded text-sm h-20"
                        value={newArtifact.description}
                        onChange={(e) =>
                          setNewArtifact({
                            ...newArtifact,
                            description: e.target.value,
                          })
                        }
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#c45a30] text-white text-xs font-bold rounded"
                      >
                        Add to Assembly
                      </button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {site.artifacts.map((art, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-gray-100 rounded-lg hover:border-[#c45a30] transition group relative"
                      >
                        <button
                          onClick={() => removeArtifact(idx)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {art.name}
                        </h4>
                        <div className="text-[10px] text-[#c45a30] font-bold uppercase mb-2">
                          {art.material}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-snug">
                          {art.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <div className="bg-[#2d2a26] text-white p-6 rounded-xl shadow-lg">
                  <h4 className="text-[#e6b17a] font-serif mb-4">
                    Site Coordinates
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Latitude</span>
                      <span className="font-mono">
                        {site.location.lat.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Longitude</span>
                      <span className="font-mono">
                        {site.location.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">District</span>
                      <span>{site.location.district}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border rounded-xl">
                  <h4 className="font-serif mb-4 text-gray-800">
                    Structural Remains
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {site.structures.map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 text-[10px] px-2 py-1 rounded"
                      >
                        {s}
                      </span>
                    ))}
                    {site.structures.length === 0 && (
                      <span className="text-xs text-gray-400 italic">
                        No structural data.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="max-w-3xl">
                <h3 className="text-2xl font-serif mb-4">
                  Inter-Site Connectivity
                </h3>
                <p className="text-gray-500 text-sm mb-8">
                  We've identified {topSimilarSites.length} existing sites in
                  our database that show significant material culture overlap
                  with <strong>{site.name}</strong>. Our AI model can analyze
                  these links to reveal shared trade routes or cultural
                  diffusion.
                </p>
              </div>

              <div className="space-y-6">
                {topSimilarSites.map(({ site: target, score }) => (
                  <div
                    key={target.id}
                    className="bg-white border rounded-2xl overflow-hidden hover:shadow-md transition"
                  >
                    <div className="p-6 flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-64 shrink-0">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-serif text-lg font-bold">
                            {target.name}
                          </h4>
                          <span className="bg-[#c45a30]/10 text-[#c45a30] text-[10px] font-bold px-2 py-1 rounded-full">
                            {(score * 100).toFixed(0)}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-3 mb-4">
                          {target.description}
                        </p>
                        <button
                          onClick={() => fetchSimilarityExplanation(target)}
                          disabled={loadingSimilarity === target.id}
                          className="w-full py-2 bg-[#2d2a26] text-white text-[10px] font-bold rounded-lg hover:bg-black transition flex items-center justify-center gap-2"
                        >
                          {loadingSimilarity === target.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          )}
                          {similarityInsights[target.id]
                            ? "Re-Analyze Link"
                            : "Compute Cultural Link"}
                        </button>
                      </div>

                      <div className="flex-1 bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
                        {errorSimilarity[target.id] ? (
                          <div className="animate-in fade-in slide-in-from-left-2 duration-700">
                            <div className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-3">
                              Error
                            </div>
                            <p className="text-sm text-red-700 leading-relaxed">
                              {errorSimilarity[target.id]}
                            </p>
                            <button
                              onClick={() => fetchSimilarityExplanation(target)}
                              className="mt-3 text-xs font-bold text-[#c45a30] hover:underline"
                            >
                              Try Again
                            </button>
                          </div>
                        ) : similarityInsights[target.id] ? (
                          <div className="animate-in fade-in slide-in-from-left-2 duration-700">
                            <div className="text-[10px] text-[#c45a30] font-bold uppercase tracking-widest mb-3">
                              AI Comparison Summary
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed italic">
                              {similarityInsights[target.id]}
                            </p>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <svg
                              className="w-10 h-10 mb-2 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                            <p className="text-xs">
                              Click "Compute Cultural Link" to generate an
                              AI-powered explanation of the trade or cultural
                              connection between these sites.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {topSimilarSites.length === 0 && (
                  <div className="p-20 text-center border-2 border-dashed rounded-3xl text-gray-400">
                    No similarity candidates found in current database.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteDetails;
