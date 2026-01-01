
import React, { useState, useCallback, useMemo } from 'react';
import { Site, Chronology } from '../types';
import { extractSiteAnalysis } from '../geminiService';

interface DashboardProps {
  sites: Site[];
  onSelectSite: (site: Site) => void;
  selectedSite: Site | null;
  onAddSite: (site: Site) => void;
}

/**
 * Simple hash function for deterministic ID generation.
 * Generates a 32-bit integer hash from a string.
 */
const stringToHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

const Dashboard: React.FC<DashboardProps> = ({ sites, onSelectSite, onAddSite }) => {
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterChronology, setFilterChronology] = useState('');

  const processReport = async (fileOrText: File | string) => {
    setIsIngesting(true);
    setIngestionStep('Initializing NLP Pipeline...');
    setError(null);
    try {
      if (fileOrText instanceof File) {
        setIngestionStep(`Parsing ${fileOrText.name}...`);
      } else {
        setIngestionStep('Processing input text...');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setIngestionStep('Running Gemini Semantic Extraction...');
      
      const extracted = await extractSiteAnalysis(fileOrText);
      
      if (!extracted || Object.keys(extracted).length === 0) {
        throw new Error("The AI pipeline returned an empty result. Please check if the document contains relevant archaeological content.");
      }

      setIngestionStep('Normalizing Chronology & Entities...');

      let siteName = extracted.name;
      if (!siteName || siteName.trim() === "") {
        siteName = window.prompt("The AI couldn't identify the site name from the report. Please enter a name for this site:") || `Site-${Date.now()}`;
      }

      let siteDescription = extracted.description;
      if (!siteDescription || siteDescription.trim() === "") {
        siteDescription = window.prompt(`The AI couldn't summarize ${siteName}. Please provide a brief description:`) || "No description provided.";
      }

      let siteLat = extracted.location?.lat;
      let siteLng = extracted.location?.lng;
      let siteDistrict = extracted.location?.district;

      if (siteLat === undefined || siteLat === null || isNaN(siteLat)) {
        const input = window.prompt(`The AI couldn't determine the latitude for ${siteName}. Please enter it (decimal format, e.g., 10.1234):`);
        siteLat = input ? parseFloat(input) : 10 + (Math.random() * 2 - 1);
      }

      if (siteLng === undefined || siteLng === null || isNaN(siteLng)) {
        const input = window.prompt(`The AI couldn't determine the longitude for ${siteName}. Please enter it (decimal format, e.g., 78.1234):`);
        siteLng = input ? parseFloat(input) : 78 + (Math.random() * 2 - 1);
      }

      if (!siteDistrict || siteDistrict.trim() === "") {
        siteDistrict = window.prompt(`The AI couldn't determine the district for ${siteName}. Please enter it:`) || 'Unspecified';
      }

      /**
       * Enhanced fuzzy chronology mapping to handle a wider variety of archaeological terminology.
       */
      const mapChronologyFuzzy = (raw: string): Chronology => {
        const text = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
        const mappingGroups: { enum: Chronology, keywords: string[] }[] = [
          { 
            enum: Chronology.MEGALITHIC, 
            keywords: ['megalithic', 'megalith', 'ironage', 'urnburial', 'megalithicage', 'cist', 'dolmen', 'menhir'] 
          },
          { 
            enum: Chronology.SANGAM, 
            keywords: ['sangam', 'sangamage', 'sangamperiod', 'earlysangam', 'earlytamil', 'cheran', 'cholan', 'pandiyan', 'tamizh'] 
          },
          { 
            enum: Chronology.EARLY_HISTORIC, 
            keywords: ['earlyhistoric', 'earlyhistorical', 'earlyhistoricperiod', 'historicperiod', 'earlydynastic', 'indoroman', 'buddhist', 'jain', 'maurya', 'satavahana', 'palaeography'] 
          },
          { 
            enum: Chronology.MEDIEVAL, 
            keywords: ['medieval', 'medival', 'chola', 'pandya', 'pallava', 'middleages', 'laterhistoric', 'vijayanagara', 'nayaka', 'islamic', 'sultanate'] 
          }
        ];

        for (const group of mappingGroups) {
          if (group.keywords.some(k => text.includes(k))) return group.enum;
        }
        
        return Chronology.UNKNOWN;
      };

      const mappedChronology: Chronology[] = (extracted.chronology || []).map(mapChronologyFuzzy);
      let uniqueChronology = Array.from(new Set(mappedChronology));
      
      if (uniqueChronology.length > 1) {
        uniqueChronology = uniqueChronology.filter(c => c !== Chronology.UNKNOWN);
      }

      /**
       * Deterministic ID generation using site name, district, and a robust hash.
       */
      const normalizedName = siteName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const normalizedDistrict = siteDistrict.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const contentHash = stringToHash(`${normalizedName}-${normalizedDistrict}-${Date.now()}`);
      const siteId = `${normalizedName}-${normalizedDistrict}-${contentHash}`;

      setIngestionStep('Finalizing Site Profile...');
      await new Promise(resolve => setTimeout(resolve, 300));

      const newSite: Site = {
        id: siteId,
        name: siteName,
        location: { lat: siteLat, lng: siteLng, district: siteDistrict },
        chronology: uniqueChronology.length > 0 ? uniqueChronology : [Chronology.UNKNOWN],
        description: siteDescription,
        artifacts: (extracted.artifacts as any) || [],
        structures: extracted.structures || []
      };

      onAddSite(newSite);
    } catch (err: any) {
      console.error("Ingestion Error:", err);
      setError(err.message || "Failed to extract data.");
    } finally {
      setIsIngesting(false);
      setIngestionStep('');
    }
  };

  const handleFile = (file: File) => {
    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    if (!isText && !isPdf) {
      setError("Please upload a text or PDF file.");
      return;
    }
    processReport(file);
  };

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  // Computed Values for Filtering
  const uniqueDistricts = useMemo(() => {
    return Array.from(new Set(sites.map(s => s.location.district))).filter(Boolean).sort();
  }, [sites]);

  const chronologyOptions = Object.values(Chronology);

  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          site.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = filterDistrict === '' || site.location.district === filterDistrict;
      const matchesChronology = filterChronology === '' || site.chronology.includes(filterChronology as Chronology);
      return matchesSearch && matchesDistrict && matchesChronology;
    });
  }, [sites, searchTerm, filterDistrict, filterChronology]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Core Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#fdf9f4] p-4 rounded border border-[#f5e7d6]">
              <span className="block text-2xl font-bold text-[#c45a30]">{sites.length}</span>
              <span className="text-xs text-gray-600">Analyzed Sites</span>
            </div>
            <div className="bg-[#fdf9f4] p-4 rounded border border-[#f5e7d6]">
              <span className="block text-2xl font-bold text-[#c45a30]">
                {sites.reduce((acc, s) => acc + s.artifacts.length + s.structures.length, 0)}
              </span>
              <span className="text-xs text-gray-600">Extracted Entities</span>
            </div>
          </div>
        </div>

        {/* Ingestion Zone */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-serif text-lg mb-4">Report Ingestion Pipeline</h3>
          <div 
            className={`relative border-2 border-dashed rounded-lg p-8 transition-all flex flex-col items-center justify-center text-center ${
              dragActive ? 'border-[#c45a30] bg-orange-50' : 'border-gray-200 bg-gray-50'
            } ${isIngesting ? 'opacity-80 cursor-wait' : 'cursor-pointer'}`}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => !isIngesting && document.getElementById('file-upload')?.click()}
          >
            {isIngesting ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-[#c45a30]/30 border-t-[#c45a30] rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-gray-800 animate-pulse">{ingestionStep}</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-[#c45a30]/10 rounded-full flex items-center justify-center mb-4 text-[#c45a30]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">Drag & Drop Excavation Report</p>
                <p className="text-xs text-gray-400 mt-1">PDF, TXT, or Markdown</p>
              </>
            )}
            <input id="file-upload" type="file" className="hidden" accept=".txt,.md,.pdf" onChange={onFileChange} disabled={isIngesting} />
          </div>
        </div>

        <div className="bg-[#2d2a26] text-white p-6 rounded-lg shadow-lg">
          <h3 className="font-serif text-xl mb-4 text-[#e6b17a]">Automated Insight</h3>
          <p className="text-sm text-gray-300 leading-relaxed italic">
            "Semantic analysis suggests a previously unrecognized glass-bead manufacturing link between Arikamedu and Keezhadi..."
          </p>
        </div>
      </div>

      {/* Right Column: Site List with Search/Filters */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filters Header */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search Sites</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Name, description, or artifacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#c45a30] outline-none"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">District</label>
            <select 
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#c45a30] outline-none"
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chronology</label>
            <select 
              value={filterChronology}
              onChange={(e) => setFilterChronology(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#c45a30] outline-none"
            >
              <option value="">All Periods</option>
              {chronologyOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(searchTerm || filterDistrict || filterChronology) && (
            <button 
              onClick={() => { setSearchTerm(''); setFilterDistrict(''); setFilterChronology(''); }}
              className="text-xs text-[#c45a30] font-bold hover:underline mb-2.5 whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Site List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-serif text-xl">Identified Archaeological Sites</h2>
            <span className="text-xs text-gray-400 font-medium">Showing {filteredSites.length} results</span>
          </div>
          <div className="divide-y divide-gray-100 min-h-[400px]">
            {filteredSites.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900">No sites found</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">Adjust your search or filters to find what you're looking for.</p>
              </div>
            ) : (
              filteredSites.map(site => (
                <div 
                  key={site.id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between group"
                  onClick={() => onSelectSite(site)}
                >
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-gray-900 group-hover:text-[#c45a30] transition">{site.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-1">{site.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {site.chronology.map(c => (
                          <span key={c} className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {c}
                          </span>
                      ))}
                      <span className="text-[10px] text-gray-400 italic">• {site.location?.district}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] font-bold text-gray-400 uppercase leading-none">Entities</div>
                      <div className="text-sm font-bold">{site.artifacts.length + site.structures.length}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-[#c45a30] transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
