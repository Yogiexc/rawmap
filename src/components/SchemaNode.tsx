import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Braces, Table, KeyRound, Link2 } from 'lucide-react';

export interface FieldItem {
  id: string;
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
  sampleValue?: string;
  refTable?: string;
  [key: string]: unknown;
}

export interface SchemaNodeData extends Record<string, unknown> {
  title: string;
  category?: 'sql' | 'json' | 'csv';
  fields: FieldItem[];
  rowCount?: number;
  isHighlighted?: boolean;
}

const getBadgeStyle = (field: FieldItem) => {
  if (field.isPK) {
    return {
      label: 'PK',
      className: 'bg-amber-400/10 text-amber-300 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
    };
  }
  if (field.isFK) {
    return {
      label: 'FK',
      className: 'bg-indigo-400/10 text-indigo-300 border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)]',
    };
  }

  const typeLower = (field.type || '').toLowerCase();
  if (typeLower.includes('int') || typeLower.includes('num') || typeLower.includes('float') || typeLower.includes('decimal')) {
    return {
      label: field.type,
      className: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
    };
  }
  if (typeLower.includes('bool')) {
    return {
      label: field.type,
      className: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    };
  }
  if (typeLower.includes('array') || typeLower.includes('object') || typeLower.includes('json')) {
    return {
      label: field.type,
      className: 'bg-pink-500/10 text-pink-300 border-pink-500/25',
    };
  }
  return {
    label: field.type || 'string',
    className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  };
};

export const SchemaNode = memo(({ data }: { data: SchemaNodeData }) => {
  const getCategoryMeta = () => {
    switch (data.category) {
      case 'sql':
        return {
          icon: <Database className="w-3.5 h-3.5 text-blue-400" />,
          glow: 'from-blue-500/10 via-transparent to-transparent',
          badgeColor: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
        };
      case 'json':
        return {
          icon: <Braces className="w-3.5 h-3.5 text-pink-400" />,
          glow: 'from-pink-500/10 via-transparent to-transparent',
          badgeColor: 'text-pink-400 border-pink-500/20 bg-pink-500/5',
        };
      case 'csv':
        return {
          icon: <Table className="w-3.5 h-3.5 text-emerald-400" />,
          glow: 'from-emerald-500/10 via-transparent to-transparent',
          badgeColor: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
        };
      default:
        return {
          icon: <Database className="w-3.5 h-3.5 text-blue-400" />,
          glow: 'from-blue-500/10 via-transparent to-transparent',
          badgeColor: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
        };
    }
  };

  const meta = getCategoryMeta();

  return (
    <div
      className={`relative min-w-[270px] max-w-[340px] rounded-xl glass-card transition-all duration-300 shadow-2xl shadow-black/80 group/card ${
        data.isHighlighted
          ? 'ring-2 ring-emerald-400 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.35)] -translate-y-0.5'
          : 'border-white/[0.08] hover:border-white/[0.2] hover:shadow-[0_8px_30px_rgba(0,0,0,0.7)]'
      }`}
    >
      {/* Ambient gradient top glow inside card */}
      <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${meta.glow} rounded-t-xl pointer-events-none opacity-80`} />

      {/* Target handle at node level */}
      <Handle
        type="target"
        position={Position.Left}
        id="node-target"
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-[#0E0E14] -left-1.5 transition-all duration-200 group-hover/card:!bg-emerald-400 group-hover/card:!scale-125"
      />

      {/* Header Bar */}
      <div className="relative flex items-center justify-between px-3.5 py-3 border-b border-white/[0.06] rounded-t-xl">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] shadow-inner flex-shrink-0">
            {meta.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-sans font-bold text-[13px] tracking-tight text-white truncate" title={data.title}>
              {data.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {data.rowCount !== undefined && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
              {data.rowCount} rows
            </span>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
            {data.fields?.length || 0} fields
          </span>
        </div>
      </div>

      {/* Fields List */}
      <div className="py-1.5 max-h-[380px] overflow-y-auto">
        {data.fields?.length === 0 ? (
          <div className="px-3.5 py-2.5 text-xs text-zinc-500 italic">No fields detected</div>
        ) : (
          data.fields?.map((field) => {
            const badge = getBadgeStyle(field);
            return (
              <div
                key={field.id}
                className="relative flex items-center justify-between px-3.5 py-1.5 hover:bg-white/[0.04] transition-colors group/row text-xs font-mono"
              >
                {/* Specific field target handle */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`field-in-${field.id}`}
                  className="!w-2 !h-2 !bg-zinc-500 !border-2 !border-[#0E0E14] -left-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
                />

                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {field.isPK && (
                    <span title="Primary Key">
                      <KeyRound className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    </span>
                  )}
                  {field.isFK && (
                    <span title={`Foreign Key: references ${field.refTable || 'table'}`}>
                      <Link2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    </span>
                  )}
                  <span
                    className={`truncate transition-colors ${
                      field.isPK ? 'text-amber-200/90 font-medium' : 'text-zinc-300 group-hover/row:text-white'
                    }`}
                    title={field.name}
                  >
                    {field.name}
                  </span>
                  {field.sampleValue !== undefined && (
                    <span className="text-[10px] text-zinc-500 truncate max-w-[85px] font-mono" title={field.sampleValue}>
                      = {field.sampleValue}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-mono tracking-tight font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Specific field source handle */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`field-out-${field.id}`}
                  className="!w-2 !h-2 !bg-zinc-500 !border-2 !border-[#0E0E14] -right-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Source handle at node level */}
      <Handle
        type="source"
        position={Position.Right}
        id="node-source"
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-[#0E0E14] -right-1.5 transition-all duration-200 group-hover/card:!bg-emerald-400 group-hover/card:!scale-125"
      />
    </div>
  );
});

SchemaNode.displayName = 'SchemaNode';
