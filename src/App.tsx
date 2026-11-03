import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SchemaNode } from './components/SchemaNode';
import { samples } from './parsers/samples';
import { parseUniversalInput } from './parsers';
import {
  Sparkles,
  Download,
  Search,
  Check,
  Terminal,
  Activity,
  Layers,
  ArrowRightLeft,
  ArrowUpDown,
  Zap,
  Cpu,
} from 'lucide-react';
import { toPng } from 'html-to-image';

const nodeTypes = { schemaNode: SchemaNode };

type PresetType = 'sql' | 'json' | 'csv';

export default function App() {
  const [inputCode, setInputCode] = useState(samples.sql);
  const [activePreset, setActivePreset] = useState<PresetType>('sql');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutDir, setLayoutDir] = useState<'LR' | 'TB'>('LR');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [formatInfo, setFormatInfo] = useState<{ type: string; valid: boolean; error?: string }>({
    type: 'SQL DDL',
    valid: true,
  });

  // Real-time parsing with error resilience
  useEffect(() => {
    try {
      const result = parseUniversalInput(inputCode, layoutDir);
      setNodes(result.nodes);
      setEdges(result.edges);
      setFormatInfo({ type: result.detectedType, valid: true });
    } catch (err: any) {
      setFormatInfo({ type: 'SYNTAX_ERROR', valid: false, error: err.message });
    }
  }, [inputCode, layoutDir, setNodes, setEdges]);

  // Keyboard shortcuts (⌘1, ⌘2, ⌘3 / Ctrl+1, 2, 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          selectPreset('sql');
        } else if (e.key === '2') {
          e.preventDefault();
          selectPreset('json');
        } else if (e.key === '3') {
          e.preventDefault();
          selectPreset('csv');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectPreset = (type: PresetType) => {
    setActivePreset(type);
    if (type === 'sql') setInputCode(samples.sql);
    if (type === 'json') setInputCode(samples.json);
    if (type === 'csv') setInputCode(samples.csv);
  };

  // Filter nodes with cinematic glow & focus
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.map((node: any) => {
      const matchLabel = node.data?.label?.toLowerCase()?.includes(q);
      const matchField = node.data?.fields?.some(
        (f: any) => f.name?.toLowerCase()?.includes(q) || f.type?.toLowerCase()?.includes(q)
      );
      const isMatched = matchLabel || matchField;
      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: isMatched,
        },
        style: {
          ...node.style,
          opacity: isMatched ? 1 : 0.2,
          filter: isMatched ? 'none' : 'grayscale(100%)',
          transition: 'all 0.3s ease',
        },
      };
    });
  }, [nodes, searchQuery]);

  // Export 4K PNG with cinematic dark canvas
  const handleExportPNG = useCallback(() => {
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) return;
    setIsExporting(true);

    toPng(viewportElement, {
      cacheBust: true,
      backgroundColor: '#020205',
      pixelRatio: 3, // 4K resolution density
      filter: (domNode) => {
        const el = domNode as HTMLElement;
        return !(
          el.classList &&
          (el.classList.contains('react-flow__controls') || el.classList.contains('react-flow__minimap'))
        );
      },
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `rawmap-architecture-4k-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error('Failed to export image', err))
      .finally(() => setIsExporting(false));
  }, []);

  // Handle Copy AI Context
  const handleCopyAIContext = () => {
    const markdown = `# RawMap Architecture Context // Telemetry Map\n- **Target Schema Type:** ${formatInfo.type}\n- **Total Active Entities:** ${nodes.length}\n- **Total Synaptic Relations:** ${edges.length}\n\n\`\`\`json\n${inputCode.slice(0, 1800)}\n\`\`\``;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Line numbering for code studio
  const codeLines = useMemo(() => inputCode.split('\n'), [inputCode]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020205] text-[#F3F4F6] overflow-hidden font-sans select-none">
      
      {/* 🚀 1. Cinematic Cyberpunk Header */}
      <header className="h-16 border-b border-white/[0.08] bg-[#08080C]/85 backdrop-blur-2xl px-6 flex items-center justify-between z-30 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        
        {/* BRAND IDENTITY: Glowing Logo & Live Pulse */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-9 h-9 rounded-xl bg-[#090910] border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-sm tracking-widest text-white flex items-center gap-1.5">
                RAWMAP <span className="text-zinc-600">//</span>
              </span>
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] tracking-wider font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cyber-pulse-green" />
                <span>v0.1-CORE</span>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono tracking-tight flex items-center gap-1">
              <Cpu size={11} className="text-emerald-400/80" />
              SYNAPTIC DATA VISUALIZER
            </span>
          </div>
        </div>

        {/* CENTER INTERACTIVE PRESET CAPSULES with Shortcuts */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner space-x-1">
          <button
            onClick={() => selectPreset('sql')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activePreset === 'sql'
                ? 'bg-zinc-800/90 text-white border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
            <span>SQL E-Commerce</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-zinc-400 border border-white/10 font-mono">⌘1</kbd>
          </button>

          <button
            onClick={() => selectPreset('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activePreset === 'json'
                ? 'bg-zinc-800/90 text-white border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 drop-shadow-[0_0_4px_rgba(236,72,153,0.8)]" />
            <span>Nested JSON API</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-zinc-400 border border-white/10 font-mono">⌘2</kbd>
          </button>

          <button
            onClick={() => selectPreset('csv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activePreset === 'csv'
                ? 'bg-zinc-800/90 text-white border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
            <span>Analytics CSV</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-zinc-400 border border-white/10 font-mono">⌘3</kbd>
          </button>
        </div>

        {/* RIGHT ACTION SUITE: Search, Direction & High-Glow Buttons */}
        <div className="flex items-center space-x-2.5">
          {/* Neon Search Glass Box */}
          <div className="relative w-48 lg:w-60 hidden sm:block">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search telemetry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/[0.08] hover:border-emerald-500/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 font-mono placeholder-zinc-500 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all"
            />
          </div>

          {/* Direction Switcher */}
          <button
            onClick={() => setLayoutDir(layoutDir === 'LR' ? 'TB' : 'LR')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0e0e16] hover:bg-zinc-800 border border-white/[0.08] text-xs font-mono text-zinc-300 transition-all cursor-pointer"
            title={`Direction: ${layoutDir === 'LR' ? 'Horizontal LR' : 'Vertical TB'}`}
          >
            {layoutDir === 'LR' ? (
              <ArrowRightLeft size={13} className="text-emerald-400" />
            ) : (
              <ArrowUpDown size={13} className="text-indigo-400" />
            )}
            <span>{layoutDir}</span>
          </button>

          {/* Copy AI Context Button */}
          <button
            onClick={handleCopyAIContext}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#0e0e16] hover:bg-zinc-800/90 border border-emerald-500/40 text-xs font-mono font-semibold text-emerald-300 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="hidden lg:inline">COPIED CONTEXT</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-emerald-400" />
                <span className="hidden lg:inline">COPY AI CONTEXT</span>
              </>
            )}
          </button>

          {/* Export 4K PNG Button */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-zinc-950 text-xs font-mono font-bold tracking-tight transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] disabled:opacity-50 cursor-pointer"
          >
            <Download size={13} className="stroke-[2.5]" />
            <span>{isExporting ? 'EXPORTING...' : 'EXPORT 4K PNG'}</span>
          </button>
        </div>
      </header>

      {/* 🖥️ 2. Main High-Performance Studio: Left Code IDE + Right Cyber Canvas */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: Professional Terminal Code Studio */}
        <section className="w-[390px] bg-[#06060a] border-r border-white/[0.08] flex flex-col shrink-0 z-20 shadow-2xl">
          {/* Terminal Title Bar */}
          <div className="h-11 px-4 bg-[#0a0a10] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <Terminal size={13} className="text-emerald-400" />
              <span className="text-xs font-mono font-bold text-zinc-300">CODE STUDIO</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                  formatInfo.valid
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-red-500/15 text-red-400 border-red-500/40'
                }`}
              >
                {formatInfo.type}
              </span>
            </div>
          </div>

          {/* Code Editor Body with Line Numbering */}
          <div className="flex-1 flex overflow-hidden bg-[#040407]">
            {/* Gutter Line Numbers */}
            <div className="w-11 py-3.5 bg-[#030306] border-r border-white/[0.04] text-zinc-600 font-mono text-[11px] select-none text-right pr-2 leading-relaxed overflow-hidden">
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input Textarea */}
            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="// Paste SQL DDL, JSON payload, or CSV raw text here..."
              className="flex-1 bg-transparent text-[#e4e4e7] font-mono text-[12px] p-3.5 leading-relaxed resize-none focus:outline-none border-none selection:bg-emerald-500/30 selection:text-emerald-200 overflow-y-auto"
              spellCheck={false}
            />
          </div>

          {/* Real-time IDE Telemetry Status Bar */}
          <footer className="h-10 px-4 bg-[#0a0a10] border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <div className="flex items-center space-x-2 text-zinc-400">
              <Activity size={12} className="text-emerald-400 animate-pulse" />
              <span>{inputCode.length.toLocaleString()} chars</span>
              <span className="text-zinc-600">//</span>
              <span>{codeLines.length} lines</span>
            </div>

            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <Layers size={12} />
              <span>{nodes.length} nodes</span>
              <span className="text-zinc-600">//</span>
              <span className="text-indigo-400">{edges.length} active links</span>
            </div>
          </footer>
        </section>

        {/* RIGHT PANEL: High-Craft Cyberpunk Canvas */}
        <main ref={flowContainerRef} className="flex-1 relative cyber-canvas-surface overflow-hidden">
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 2, stroke: '#6366F1' },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={28} size={1.5} color="#27273a" />
            
            <Controls className="!bg-[#090910]/95 !backdrop-blur-xl !border !border-white/[0.08] !rounded-xl !shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden [&>button]:!bg-[#090910] [&>button]:!border-b [&>button]:!border-white/[0.06] [&>button]:!text-zinc-300 hover:[&>button]:!bg-zinc-800" />
            
            <MiniMap
              className="!bg-[#08080e]/95 !backdrop-blur-xl !border !border-white/[0.08] !rounded-xl !shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden"
              nodeColor="#10B981"
              maskColor="rgba(2, 2, 5, 0.85)"
            />
          </ReactFlow>

          {/* Floating Cyber Watermark */}
          <div className="absolute bottom-5 right-5 pointer-events-none z-10 flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#08080f]/90 backdrop-blur-xl border border-emerald-500/30 text-[11px] font-mono text-zinc-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 cyber-pulse-green" />
            <span className="tracking-wide">
              MAPPED WITH <strong className="text-white font-bold">RAWMAP</strong> // <span className="text-emerald-400 font-semibold">SECURE CLIENT-SIDE</span>
            </span>
          </div>
        </main>

      </div>
    </div>
  );
}
