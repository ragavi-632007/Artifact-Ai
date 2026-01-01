
import React, { useEffect, useRef } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 60;
    const connectionDistance = 150;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvasWidth) this.vx *= -1;
        if (this.y < 0 || this.y > canvasHeight) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(196, 90, 48, 0.3)';
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      particles = Array.from({ length: particleCount }, () => new Particle(canvas.width, canvas.height));
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(196, 90, 48, ${0.1 * (1 - dist / connectionDistance)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="bg-[#1a1612] text-[#f8f7f4] min-h-screen selection:bg-[#c45a30]/30 relative">
      <ParticleBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#1a1612]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c45a30] rounded-lg flex items-center justify-center shadow-lg shadow-[#c45a30]/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold leading-none tracking-tight">Artifact AI</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Archaeological Intelligence</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-400">
            <a href="#pipeline" className="hover:text-white transition">Pipeline</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <button onClick={onStart} className="hover:text-white transition">Demo</button>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="hidden sm:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Docs
            </a>
            <a href="#" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#c45a30]/10 blur-[120px] rounded-full -z-10"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[100px] rounded-full -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-8xl font-serif font-bold mb-8 leading-[1.1]">
            Uncover Hidden <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c45a30] via-[#e6b17a] to-[#c45a30]">Archaeological Patterns</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            Analyze thousands of excavation reports to compute semantic similarity between archaeological sites. Discover cultural connections, trade networks, and validate classifications through AI-powered analysis.
          </p>
          
          <div className="flex flex-col sm:row gap-4 justify-center">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-gradient-to-br from-[#c45a30] to-[#e67e22] text-white font-bold rounded-xl shadow-xl shadow-[#c45a30]/20 hover:scale-105 transition flex items-center justify-center gap-2 group"
            >
              Start Analyzing
              <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
            <button className="px-8 py-4 bg-white/5 border border-white/10 font-bold rounded-xl hover:bg-white/10 transition">
              View Documentation
            </button>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                 <svg className="w-6 h-6 text-[#c45a30]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
              </div>
              <div className="text-3xl font-bold mb-1">1000+</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-medium">Reports Analyzed</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                <svg className="w-6 h-6 text-[#c45a30]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div className="text-3xl font-bold mb-1">98.5%</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-medium">NER Accuracy</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                <svg className="w-6 h-6 text-[#c45a30]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
              </div>
              <div className="text-3xl font-bold mb-1">47</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-medium">Sites Connected</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Step Pipeline Section */}
      <section id="pipeline" className="py-32 px-6 bg-[#1f1b17] relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="px-4 py-1.5 bg-[#c45a30]/10 text-[#c45a30] text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-[#c45a30]/20">End-to-End Pipeline</span>
            <h3 className="text-4xl md:text-6xl font-serif font-bold mt-6 mb-4">7-Step Analysis Pipeline</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">From raw excavation reports to actionable archaeological insights, our automated NLP pipeline handles every step with research-grade accuracy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PipelineCard 
              num="1" 
              title="Data Ingestion" 
              desc="Accept PDFs, scanned documents with OCR. Normalize historical language and segment by site, layer, and artifact."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <PipelineCard 
              num="2" 
              title="Domain NLP" 
              desc="Custom archaeological ontology with fine-tuned NER models for artifacts, materials, and chronology."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
            <PipelineCard 
              num="3" 
              title="Semantic Encoding" 
              desc="Generate embeddings using domain-adapted transformers to create semantic fingerprints for each site."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.268 0 2.39.63 3.068 1.593m-4.714 14.34l-.472.356M4.557 5.769A10.038 10.038 0 0112 3c4.991 0 9.113 3.641 9.873 8.364m-1.418 4.07a10.014 10.014 0 01-3.048 3.57" /></svg>}
            />
            <PipelineCard 
              num="4" 
              title="Similarity Analysis" 
              desc="Compute cosine similarity, perform hierarchical clustering, and identify classification outliers."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
            />
            <PipelineCard 
              num="5" 
              title="Pattern Discovery" 
              desc="Analyze semantic similarity with geographic, chronological, and trade network data."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
            <PipelineCard 
              num="6" 
              title="Explainability" 
              desc="Highlight influential text segments with entity-level contribution analysis for transparent research."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            />
            <PipelineCard 
              num="7" 
              title="Visualization" 
              desc="Interactive heatmaps, network graphs, and cluster dendrograms for research output."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <div className="bg-[#c45a30] p-8 rounded-2xl flex flex-col justify-center items-center text-center shadow-xl shadow-[#c45a30]/10">
              <p className="font-bold text-xl mb-4">Ready to explore?</p>
              <button onClick={onStart} className="px-6 py-3 bg-white text-[#c45a30] font-bold rounded-lg hover:scale-105 transition">Start Demo</button>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="px-4 py-1.5 bg-[#c45a30]/10 text-[#c45a30] text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-[#c45a30]/20">Capabilities</span>
            <h3 className="text-4xl md:text-6xl font-serif font-bold mt-6 mb-4">Research-Grade Analysis</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">Purpose-built for archaeological research with domain-specific understanding and transparent, reproducible results.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CapabilityCard 
               title="Archaeological Ontology" 
               desc="Custom-built knowledge graph covering artifacts, materials, structures, and chronological periods specific to South Asian archaeology." 
               icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} 
            />
            <CapabilityCard 
               title="Tamil Nadu Focus" 
               desc="Specialized analysis for Sangam Age sites including Adichanallur, Kodumanal, Keeladi, and other significant excavation locations." 
               icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>} 
            />
            <CapabilityCard 
               title="Temporal Analysis" 
               desc="Track cultural evolution across Megalithic, Early Historic, and Sangam Age periods with chronological similarity scoring." 
               icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            />
            <CapabilityCard 
               title="Explainable Results" 
               desc="Every similarity score is backed by highlighted text passages and entity-level explanations for transparent research." 
               icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} 
            />
            <CapabilityCard 
               title="Scalable Processing" 
               desc="Process thousands of excavation reports efficiently with GPU-accelerated transformer models and vector search." 
               icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} 
            />
            <CapabilityCard 
               title="Trade Network Discovery" 
               desc="Uncover hidden commercial and cultural connections between sites through semantic pattern analysis." 
               icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>} 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-[#1a1612] to-[#2d2a26] relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-[#c45a30] text-sm font-bold uppercase tracking-widest">Interactive Demo</span>
          <h3 className="text-4xl md:text-6xl font-serif font-bold mt-6 mb-12">See It In Action</h3>
          <p className="text-xl text-gray-400 mb-12">Upload excavation reports or explore our pre-analyzed Tamil Nadu datasets to discover hidden patterns.</p>
          <button 
            onClick={onStart}
            className="px-12 py-5 bg-[#c45a30] text-white font-bold rounded-2xl text-lg hover:scale-105 transition shadow-2xl shadow-[#c45a30]/20"
          >
            Launch Analyst Dashboard
          </button>
        </div>
      </section>
      
      <footer className="py-12 border-t border-white/5 text-center text-gray-600 text-sm relative z-10">
        <p>© 2024 Artifact AI • Digital Humanities Initiative • Tamil Nadu State Archaeology Department Context</p>
      </footer>
    </div>
  );
};

const PipelineCard: React.FC<{ num: string, title: string, desc: string, icon: React.ReactNode }> = ({ num, title, desc, icon }) => (
  <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/[0.08] transition group relative overflow-hidden backdrop-blur-sm">
    <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#c45a30] text-white rounded-full flex items-center justify-center font-bold text-lg z-10 shadow-lg">{num}</div>
    <div className="w-12 h-12 bg-[#c45a30]/10 rounded-xl flex items-center justify-center mb-6 text-[#c45a30] group-hover:scale-110 transition duration-500">
      {icon}
    </div>
    <h4 className="text-xl font-bold mb-3">{title}</h4>
    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

const CapabilityCard: React.FC<{ title: string, desc: string, icon: React.ReactNode }> = ({ title, desc, icon }) => (
  <div className="bg-[#231f1b]/80 border border-white/5 p-8 rounded-2xl hover:border-[#c45a30]/50 transition duration-500 group backdrop-blur-sm">
    <div className="w-12 h-12 bg-[#c45a30]/10 rounded-xl flex items-center justify-center mb-6 text-[#c45a30] group-hover:bg-[#c45a30] group-hover:text-white transition duration-500">
      {icon}
    </div>
    <h4 className="text-xl font-serif font-bold text-[#e6b17a] mb-4 group-hover:text-white transition">{title}</h4>
    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
