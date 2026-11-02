import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import {
  Sparkles,
  Download,
  Check,
  Search,
  Code2,
  Database,
  Braces,
  Table,
  ArrowRightLeft,
  ArrowUpDown,
  Zap,
  Layers,
} from 'lucide-react';

import { SchemaNode, type SchemaNodeData } from './components/SchemaNode';
import { parseUniversal, generateLLMContext, type DetectedFormat } from './parsers';
import { SAMPLE_SQL, SAMPLE_JSON, SAMPLE_CSV } from './parsers/samples';

const nodeTypes = {
  schemaNode: SchemaNode,
};

type PresetKey = 'sql' | 'json' | 'csv';

function RawMapStudio() {
  const [inputText, setInputText] = useState(SAMPLE_SQL);
  const [activePreset, setActivePreset] = useState<PresetKey>('sql');
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedContext, setCopiedContext] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);

  const { fitView } = useReactFlow();

  // Parse input with memoization
  const parsed = useMemo(() => {
    return parseUniversal(inputText, direction);
  }, [inputText, direction]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SchemaNodeData>>(parsed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsed.edges);

  // Sync parsed nodes & apply search highlight
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const updatedNodes = parsed.nodes.map((node) => {
      const matchTitle = node.data.title.toLowerCase().includes(query);
      const matchField = node.data.fields?.some((f) =>
        f.name.toLowerCase().includes(query) || f.type.toLowerCase().includes(query)
      );
      const isHighlighted = query.length > 0 && (matchTitle || matchField);

      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted,
        },
      };
    });

    setNodes(updatedNodes);
    setEdges(parsed.edges);

    const timer = setTimeout(() => {
      fitView({ duration: 500, padding: 0.18 });
    }, 50);
    return () => clearTimeout(timer);
  }, [parsed, searchQuery, setNodes, setEdges, fitView]);

  // Handle Preset selection
  const handleSelectPreset = (preset: PresetKey) => {
    setActivePreset(preset);
    if (preset === 'sql') setInputText(SAMPLE_SQL);
    if (preset === 'json') setInputText(SAMPLE_JSON);
    if (preset === 'csv') setInputText(SAMPLE_CSV);
  };

  // Copy AI Context
  const handleCopyContext = useCallback(() => {
    const md = generateLLMContext(nodes, edges);
    navigator.clipboard.writeText(md);
    setCopiedContext(true);
    setTimeout(() => setCopiedContext(false), 2000);
  }, [nodes, edges]);

  // Export HD PNG
  const handleExportPNG = useCallback(async () => {
    if (!flowContainerRef.current) return;
    setIsExporting(true);

    try {
      const viewportElement = flowContainerRef.current.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElement) return;

      const dataUrl = await toPng(viewportElement, {
        backgroundColor: '#08080B',
        quality: 1,
        pixelRatio: 2,
        filter: (node) => {
          const element = node as HTMLElement;
          return !(element.classList && (element.classList.contains('react-flow__controls') || element.classList.contains('react-flow__minimap')));
        },
      });

      const a = document.createElement('a');
      a.setAttribute('download', `rawmap-schema-${Date.now()}.png`);
      a.setAttribute('href', dataUrl);
      a.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const getFormatBadge = (fmt: DetectedFormat) => {
    switch (fmt) {
      case 'sql':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            SQL DDL
          </span>
        );
      case 'json':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-pink-500/10 text-pink-400 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            JSON Payload
          </span>
        );
      case 'csv':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CSV Dataset
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Auto-Detecting
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070709] text-zinc-100 overflow-hidden select-none">
      {/* Top Studio Navbar — Divided into 3 Distinct High-Craft Zones */}
      <header className="h-16 border-b border-white/[0.07] bg-[#0c0c10]/80 backdrop-blur-2xl px-6 flex items-center justify-between z-30 flex-shrink-0">
        
        {/* ZONE 1 (LEFT): Brand Identity + Glowing Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Zap className="w-5 h-5 text-zinc-950 font-black fill-current" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-sans font-extrabold text-[15px] tracking-tight text-white">
                RawMap
              </span>
              <span className="relative flex items-center">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                <span className="ml-2 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm">
                  v0.1
                </span>
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono tracking-wide">Instant Schema & AI Context</span>
          </div>
        </div>

        {/* ZONE 2 (CENTER): Floating Quick Presets Pill Selector */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-inner">
          <button
            onClick={() => handleSelectPreset('sql')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activePreset === 'sql'
                ? 'bg-zinc-800/90 text-white shadow-md shadow-black/40 border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            SQL Schema
          </button>
          <button
            onClick={() => handleSelectPreset('json')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activePreset === 'json'
                ? 'bg-zinc-800/90 text-white shadow-md shadow-black/40 border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Braces className="w-3.5 h-3.5 text-pink-400" />
            JSON Payload
          </button>
          <button
            onClick={() => handleSelectPreset('csv')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activePreset === 'csv'
                ? 'bg-zinc-800/90 text-white shadow-md shadow-black/40 border border-white/[0.1]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            Analytics CSV
          </button>
        </div>

        {/* ZONE 3 (RIGHT): Search + Layout Toggle + High-Conversion Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Quick Search with Subtle Glass styling */}
          <div className="relative w-56 hidden lg:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search schema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Direction Toggle */}
          <button
            onClick={() => setDirection((prev) => (prev === 'LR' ? 'TB' : 'LR'))}
            title={`Layout Direction: ${direction === 'LR' ? 'Horizontal (LR)' : 'Vertical (TB)'}`}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {direction === 'LR' ? (
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowUpDown className="w-4 h-4 text-indigo-400" />
            )}
            <span className="font-mono text-[11px] font-semibold">{direction}</span>
          </button>

          {/* Copy AI Context Button with Ambient Border */}
          <button
            onClick={handleCopyContext}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer"
          >
            {copiedContext ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">
              {copiedContext ? 'Copied Context!' : 'Copy AI Context'}
            </span>
          </button>

          {/* Export HD PNG Button — High Contrast Neon Gradient */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="relative group px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export HD PNG'}</span>
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/Yogiexc/rawmap"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Repository"
            className="p-2 rounded-lg text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Studio Body: Left Editor + Right Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Split Panel: Editor */}
        <section className="w-80 md:w-96 flex flex-col border-r border-white/[0.07] bg-[#0c0c10] flex-shrink-0 z-10 shadow-xl">
          {/* Editor Header */}
          <div className="h-11 px-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0e0e13]">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-200">Raw Input Source</span>
            </div>
            {getFormatBadge(parsed.format)}
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw SQL DDL (CREATE TABLE), JSON payload, or CSV text here..."
              className="w-full h-full p-4 bg-[#08080c] text-zinc-200 font-mono text-[12px] leading-relaxed resize-none focus:outline-none border-none selection:bg-emerald-500/30 selection:text-emerald-200 overflow-y-auto"
              spellCheck={false}
            />
          </div>

          {/* Footer Stats */}
          <footer className="h-10 px-4 border-t border-white/[0.06] bg-[#0e0e13] flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>{inputText.length.toLocaleString()} chars</span>
              <span className="text-zinc-600">•</span>
              <span>{inputText.split('\n').length} lines</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <span>{parsed.stats.nodeCount} nodes</span>
              <span className="text-zinc-600">•</span>
              <span>{parsed.stats.edgeCount} edges</span>
            </div>
          </footer>
        </section>

        {/* Right Studio Canvas with Ambient Atmosphere */}
        <main ref={flowContainerRef} className="flex-1 relative ambient-canvas-bg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 1.8, stroke: '#6366F1' },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.4}
              color="#2a2a36"
            />
            <Controls className="!bg-[#14141a]/90 !backdrop-blur-md !border-white/[0.08] !rounded-xl !overflow-hidden [&>button]:!bg-transparent [&>button]:!border-b-white/[0.06] [&>button]:!fill-zinc-300 [&>button:hover]:!bg-white/[0.08]" />
            <MiniMap
              nodeColor={() => '#22222c'}
              maskColor="rgba(8, 8, 11, 0.75)"
              className="!bg-[#111117]/90 !backdrop-blur-md !border !border-white/[0.08] !rounded-xl !shadow-2xl"
            />
          </ReactFlow>

          {/* High-Craft Watermark Badge */}
          <div className="absolute bottom-5 right-5 pointer-events-none px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl text-[11px] font-mono text-zinc-400 flex items-center gap-2 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span>Mapped with <strong className="text-white font-semibold">RawMap Studio</strong></span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <RawMapStudio />
    </ReactFlowProvider>
  );
}
