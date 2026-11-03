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
import { ExportModal } from './components/ExportModal';
import { samples } from './parsers/samples';
import { parseUniversalInput } from './parsers';
import {
  generatePrismaSchema,
  generateDrizzleSchema,
  generateTypeScriptInterfaces,
} from './parsers/generators';
import { encodeStateToHash, decodeHashToState } from './parsers/urlState';
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
  Share2,
  Code2,
  Box,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  FileCode2,
} from 'lucide-react';
import { toPng } from 'html-to-image';

const nodeTypes = { schemaNode: SchemaNode };

type PresetType = 'sql' | 'json' | 'csv';

export default function App() {
  const initialUrlState = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return decodeHashToState(window.location.hash);
    }
    return null;
  }, []);

  const [inputCode, setInputCode] = useState(initialUrlState ? initialUrlState.code : samples.sql);
  const [activePreset, setActivePreset] = useState<PresetType>('sql');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutDir, setLayoutDir] = useState<'LR' | 'TB'>(initialUrlState ? initialUrlState.direction : 'LR');
  const [copiedContext, setCopiedContext] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Responsive UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'canvas' | 'editor'>('canvas');

  const flowContainerRef = useRef<HTMLDivElement>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    code: string;
    language: string;
    filename: string;
  }>({
    isOpen: false,
    title: '',
    code: '',
    language: '',
    filename: '',
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [formatInfo, setFormatInfo] = useState<{ type: string; valid: boolean; error?: string }>({
    type: 'SQL DDL',
    valid: true,
  });

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

  // Keyboard shortcuts (⌘1, ⌘2, ⌘3)
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
    setIsMobileMenuOpen(false);
  };

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

  const handleShareLink = useCallback(() => {
    const hash = encodeStateToHash({ code: inputCode, direction: layoutDir });
    const shareableUrl = `${window.location.origin}${window.location.pathname}#${hash}`;
    window.history.replaceState(null, '', `#${hash}`);
    navigator.clipboard.writeText(shareableUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  }, [inputCode, layoutDir]);

  const handleExportPNG = useCallback(() => {
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) return;
    setIsExporting(true);

    toPng(viewportElement, {
      cacheBust: true,
      backgroundColor: '#020205',
      pixelRatio: 3,
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

  const handleCopyAIContext = () => {
    const markdown = `# RawMap Architecture Context // Telemetry Map\n- **Target Schema Type:** ${formatInfo.type}\n- **Total Active Entities:** ${nodes.length}\n- **Total Synaptic Relations:** ${edges.length}\n\n\`\`\`json\n${inputCode.slice(0, 1800)}\n\`\`\``;
    navigator.clipboard.writeText(markdown);
    setCopiedContext(true);
    setTimeout(() => setCopiedContext(false), 2000);
  };

  const handleOpenPrisma = () => {
    const code = generatePrismaSchema(nodes);
    setModalConfig({
      isOpen: true,
      title: 'Prisma Schema Export (schema.prisma)',
      code,
      language: 'prisma',
      filename: 'schema.prisma',
    });
    setIsMobileMenuOpen(false);
  };

  const handleOpenDrizzle = () => {
    const code = generateDrizzleSchema(nodes);
    setModalConfig({
      isOpen: true,
      title: 'Drizzle ORM Schema Export (schema.ts)',
      code,
      language: 'typescript',
      filename: 'schema.ts',
    });
    setIsMobileMenuOpen(false);
  };

  const handleOpenTypeScript = () => {
    const code = generateTypeScriptInterfaces(nodes);
    setModalConfig({
      isOpen: true,
      title: 'TypeScript Interface Types (types.d.ts)',
      code,
      language: 'typescript',
      filename: 'types.d.ts',
    });
    setIsMobileMenuOpen(false);
  };

  const codeLines = useMemo(() => inputCode.split('\n'), [inputCode]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020205] text-[#F3F4F6] overflow-hidden font-sans select-none">
      
      {/* 🚀 1. Responsive Cinematic Header */}
      <header className="h-14 md:h-16 border-b border-white/[0.08] bg-[#08080C]/90 backdrop-blur-2xl px-3 md:px-6 flex items-center justify-between z-30 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        
        {/* BRAND & SIDEBAR TOGGLE */}
        <div className="flex items-center space-x-2 md:space-x-3.5">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/[0.06] hidden md:flex"
            title={isSidebarOpen ? 'Collapse Code Studio' : 'Expand Code Studio'}
          >
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>

          <div className="relative group cursor-pointer flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 rounded-lg blur-sm opacity-50 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#090910] border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-black text-xs md:text-sm tracking-widest text-white">
                RAWMAP
              </span>
              <span className="hidden sm:inline text-zinc-600 font-mono">//</span>
              <span className="hidden sm:flex items-center space-x-1 px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] tracking-wider font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cyber-pulse-green" />
                <span>v0.1</span>
              </span>
            </div>
            <span className="text-[9px] text-zinc-400 font-mono tracking-tight hidden lg:flex items-center gap-1">
              <Cpu size={10} className="text-emerald-400/80" />
              SYNAPTIC DATA VISUALIZER
            </span>
          </div>
        </div>

        {/* CENTER PRESETS (Desktop/Tablet) */}
        <div className="hidden lg:flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner space-x-1">
          <button
            onClick={() => selectPreset('sql')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'sql'
                ? 'bg-zinc-800/90 text-white border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>SQL</span>
            <kbd className="text-[9px] px-1 rounded bg-black/40 text-zinc-400 border border-white/10">⌘1</kbd>
          </button>

          <button
            onClick={() => selectPreset('json')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'json'
                ? 'bg-zinc-800/90 text-white border border-pink-500/40 shadow-[0_0_12px_rgba(236,72,153,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            <span>JSON</span>
            <kbd className="text-[9px] px-1 rounded bg-black/40 text-zinc-400 border border-white/10">⌘2</kbd>
          </button>

          <button
            onClick={() => selectPreset('csv')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'csv'
                ? 'bg-zinc-800/90 text-white border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>CSV</span>
            <kbd className="text-[9px] px-1 rounded bg-black/40 text-zinc-400 border border-white/10">⌘3</kbd>
          </button>
        </div>

        {/* RIGHT ACTION SUITE */}
        <div className="flex items-center space-x-1.5 md:space-x-2">
          {/* Search Box (Desktop) */}
          <div className="relative w-32 xl:w-44 hidden md:block">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/[0.08] hover:border-emerald-500/40 rounded-lg pl-7 pr-2.5 py-1 text-xs text-zinc-200 font-mono placeholder-zinc-500 focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Generators (Desktop 2XL screen) */}
          <div className="hidden 2xl:flex items-center space-x-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
            <button
              onClick={handleOpenPrisma}
              className="px-2 py-1 text-[11px] font-mono text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Box size={12} className="text-indigo-400" />
              <span>Prisma</span>
            </button>
            <button
              onClick={handleOpenDrizzle}
              className="px-2 py-1 text-[11px] font-mono text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Code2 size={12} className="text-cyan-400" />
              <span>Drizzle</span>
            </button>
            <button
              onClick={handleOpenTypeScript}
              className="px-2 py-1 text-[11px] font-mono text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="text-blue-400 font-bold text-[10px]">TS</span>
              <span>Types</span>
            </button>
          </div>

          {/* Direction Toggle */}
          <button
            onClick={() => setLayoutDir(layoutDir === 'LR' ? 'TB' : 'LR')}
            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-[#0e0e16] hover:bg-zinc-800 border border-white/[0.08] text-xs font-mono text-zinc-300 transition-all cursor-pointer"
            title={`Direction: ${layoutDir}`}
          >
            {layoutDir === 'LR' ? (
              <ArrowRightLeft size={12} className="text-emerald-400" />
            ) : (
              <ArrowUpDown size={12} className="text-indigo-400" />
            )}
            <span className="text-[11px]">{layoutDir}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareLink}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#0e0e16] hover:bg-zinc-800 border border-white/[0.08] text-xs font-mono text-zinc-300 transition-all cursor-pointer"
            title="Share interactive graph"
          >
            {copiedShare ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
            <span className="hidden sm:inline text-[11px]">{copiedShare ? 'COPIED' : 'SHARE'}</span>
          </button>

          {/* Copy AI Context */}
          <button
            onClick={handleCopyAIContext}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#0e0e16] hover:bg-zinc-800 border border-emerald-500/40 text-xs font-mono font-semibold text-emerald-300 hover:text-white transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)] cursor-pointer"
          >
            {copiedContext ? <Check size={12} className="text-emerald-400" /> : <Sparkles size={12} className="text-emerald-400" />}
            <span className="hidden sm:inline text-[11px]">{copiedContext ? 'COPIED' : 'AI CONTEXT'}</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-zinc-950 text-xs font-mono font-bold tracking-tight transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
          >
            <Download size={12} className="stroke-[2.5]" />
            <span className="text-[11px]">{isExporting ? 'EXPORT...' : 'EXPORT 4K'}</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg bg-white/[0.04] text-zinc-300 hover:text-white border border-white/[0.08] lg:hidden cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* MOBILE FLOATING DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#08080f]/95 border-b border-white/[0.1] backdrop-blur-2xl p-4 flex flex-col space-y-3 z-40 animate-fadeIn">
          {/* Presets */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => selectPreset('sql')}
                className={`py-1.5 rounded-lg text-xs font-mono border text-center ${
                  activePreset === 'sql' ? 'bg-zinc-800 text-white border-cyan-400' : 'bg-zinc-900/60 text-zinc-400 border-white/5'
                }`}
              >
                SQL
              </button>
              <button
                onClick={() => selectPreset('json')}
                className={`py-1.5 rounded-lg text-xs font-mono border text-center ${
                  activePreset === 'json' ? 'bg-zinc-800 text-white border-pink-400' : 'bg-zinc-900/60 text-zinc-400 border-white/5'
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => selectPreset('csv')}
                className={`py-1.5 rounded-lg text-xs font-mono border text-center ${
                  activePreset === 'csv' ? 'bg-zinc-800 text-white border-emerald-400' : 'bg-zinc-900/60 text-zinc-400 border-white/5'
                }`}
              >
                CSV
              </button>
            </div>
          </div>

          {/* Export Code Generators */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Generators</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleOpenPrisma}
                className="py-1.5 rounded-lg bg-zinc-900/80 text-zinc-300 hover:text-white border border-white/5 text-xs font-mono flex items-center justify-center gap-1"
              >
                <Box size={12} className="text-indigo-400" /> Prisma
              </button>
              <button
                onClick={handleOpenDrizzle}
                className="py-1.5 rounded-lg bg-zinc-900/80 text-zinc-300 hover:text-white border border-white/5 text-xs font-mono flex items-center justify-center gap-1"
              >
                <Code2 size={12} className="text-cyan-400" /> Drizzle
              </button>
              <button
                onClick={handleOpenTypeScript}
                className="py-1.5 rounded-lg bg-zinc-900/80 text-zinc-300 hover:text-white border border-white/5 text-xs font-mono flex items-center justify-center gap-1"
              >
                <FileCode2 size={12} className="text-blue-400" /> TS Types
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="relative w-full">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search nodes or fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050508] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 font-mono placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      )}

      {/* MOBILE VIEW TOGGLE TABS (Canvas vs Editor) */}
      <div className="md:hidden h-9 bg-[#06060a] border-b border-white/[0.08] flex items-center shrink-0">
        <button
          onClick={() => setActiveMobileTab('canvas')}
          className={`flex-1 h-full text-xs font-mono flex items-center justify-center gap-1.5 border-r border-white/[0.06] ${
            activeMobileTab === 'canvas' ? 'bg-zinc-800 text-emerald-400 font-bold border-b-2 border-b-emerald-400' : 'text-zinc-400'
          }`}
        >
          <Layers size={13} />
          <span>Canvas View</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('editor')}
          className={`flex-1 h-full text-xs font-mono flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'editor' ? 'bg-zinc-800 text-emerald-400 font-bold border-b-2 border-b-emerald-400' : 'text-zinc-400'
          }`}
        >
          <Terminal size={13} />
          <span>Code Studio</span>
        </button>
      </div>

      {/* 🖥️ 2. Main High-Performance Studio Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL: Code Studio */}
        <section
          className={`bg-[#06060a] border-r border-white/[0.08] flex flex-col shrink-0 z-20 shadow-2xl transition-all duration-300 ${
            // Desktop behavior: collapse when isSidebarOpen is false
            isSidebarOpen ? 'md:w-[360px] lg:w-[390px]' : 'md:w-0 md:opacity-0 md:pointer-events-none'
          } ${
            // Mobile behavior: tab-based show/hide
            activeMobileTab === 'editor' ? 'w-full flex-1' : 'max-md:hidden'
          }`}
        >
          <div className="h-10 px-4 bg-[#0a0a10] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal size={13} className="text-emerald-400" />
              <span className="text-xs font-mono font-bold text-zinc-300">CODE STUDIO</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${
                  formatInfo.valid
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/40'
                }`}
              >
                {formatInfo.type}
              </span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden bg-[#040407]">
            <div className="w-10 py-3 bg-[#030306] border-r border-white/[0.04] text-zinc-600 font-mono text-[10px] select-none text-right pr-2 leading-relaxed overflow-hidden">
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="// Paste SQL DDL, JSON payload, or CSV raw text here..."
              className="flex-1 bg-transparent text-[#e4e4e7] font-mono text-[11px] md:text-[12px] p-3 leading-relaxed resize-none focus:outline-none border-none selection:bg-emerald-500/30 selection:text-emerald-200 overflow-y-auto"
              spellCheck={false}
            />
          </div>

          <footer className="h-9 px-4 bg-[#0a0a10] border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <Activity size={11} className="text-emerald-400" />
              <span>{inputCode.length.toLocaleString()} chars</span>
              <span className="text-zinc-600">//</span>
              <span>{codeLines.length} lines</span>
            </div>

            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <Layers size={11} />
              <span>{nodes.length} nodes</span>
              <span className="text-zinc-600">//</span>
              <span className="text-indigo-400">{edges.length} links</span>
            </div>
          </footer>
        </section>

        {/* Floating Sidebar Toggle when closed on Desktop */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-30 p-2 rounded-xl bg-[#0e0e16]/90 border border-white/[0.1] text-zinc-400 hover:text-white backdrop-blur-xl shadow-xl transition-all cursor-pointer hidden md:flex items-center gap-1.5 font-mono text-xs"
          >
            <PanelLeftOpen size={16} className="text-emerald-400" />
            <span>Open Studio</span>
          </button>
        )}

        {/* RIGHT PANEL: Canvas Area */}
        <main
          ref={flowContainerRef}
          className={`flex-1 relative cyber-canvas-surface overflow-hidden ${
            activeMobileTab === 'editor' ? 'max-md:hidden' : 'w-full h-full'
          }`}
        >
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
              className="!bg-[#08080e]/95 !backdrop-blur-xl !border !border-white/[0.08] !rounded-xl !shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden !hidden sm:!block"
              nodeColor="#10B981"
              maskColor="rgba(2, 2, 5, 0.85)"
            />
          </ReactFlow>

          {/* Floating Cyber Watermark */}
          <div className="absolute bottom-4 right-4 pointer-events-none z-10 hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#08080f]/90 backdrop-blur-xl border border-emerald-500/30 text-[10px] md:text-[11px] font-mono text-zinc-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cyber-pulse-green" />
            <span className="tracking-wide">
              MAPPED WITH <strong className="text-white font-bold">RAWMAP</strong> // <span className="text-emerald-400 font-semibold">CLIENT-SIDE</span>
            </span>
          </div>
        </main>

      </div>

      {/* Code Export Modal */}
      <ExportModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        code={modalConfig.code}
        language={modalConfig.language}
        filename={modalConfig.filename}
      />
    </div>
  );
}
