import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { NodeField, NodeData } from '../components/SchemaNode';

export type DetectedFormat = 'sql' | 'json' | 'csv' | 'unknown';

export interface ParseResult {
  format: DetectedFormat;
  detectedType: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
  error?: string;
  stats: {
    nodeCount: number;
    edgeCount: number;
    fieldCount: number;
  };
}

/**
 * Heuristics to detect format
 */
export function detectFormat(raw: string): DetectedFormat {
  const trimmed = raw.trim();
  if (!trimmed) return 'unknown';

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // ignore
    }
  }

  const upper = trimmed.toUpperCase();
  if (upper.includes('CREATE TABLE') || upper.includes('REFERENCES') || upper.includes('PRIMARY KEY')) {
    return 'sql';
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length >= 2) {
    const firstLineCommas = (lines[0].match(/,/g) || []).length;
    const secondLineCommas = (lines[1].match(/,/g) || []).length;
    if (firstLineCommas > 0 && Math.abs(firstLineCommas - secondLineCommas) <= 1) {
      return 'csv';
    }
  }

  return 'unknown';
}

/**
 * Dagre layout
 */
export function applyDagreLayout(
  nodes: Node<NodeData>[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 75,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const fieldCount = node.data.fields?.length || 1;
    const estHeight = 48 + fieldCount * 28 + 24;
    const estWidth = 288;
    g.setNode(node.id, { width: estWidth, height: estHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPos = g.node(node.id);
    const fieldCount = node.data.fields?.length || 1;
    const estHeight = 48 + fieldCount * 28 + 24;
    const estWidth = 288;

    return {
      ...node,
      position: {
        x: nodeWithPos ? nodeWithPos.x - estWidth / 2 : 0,
        y: nodeWithPos ? nodeWithPos.y - estHeight / 2 : 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Parse SQL
 */
function parseSQL(raw: string): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge[] = [];

  const tableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\)(?:;|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(raw)) !== null) {
    const tableName = match[1];
    const body = match[2];

    const fields: NodeField[] = [];
    const columnDefinitions = splitByCommaOutsideParens(body);

    columnDefinitions.forEach((colDef) => {
      const cleanCol = colDef.trim();
      if (!cleanCol) return;

      const upperCol = cleanCol.toUpperCase();

      if (upperCol.startsWith('PRIMARY KEY') || (upperCol.startsWith('CONSTRAINT') && upperCol.includes('PRIMARY KEY'))) {
        const pkMatch = cleanCol.match(/\(([^)]+)\)/);
        if (pkMatch) {
          const pkCols = pkMatch[1].split(',').map((c) => c.trim().replace(/["`]/g, ''));
          fields.forEach((f) => {
            if (pkCols.includes(f.name)) f.isPK = true;
          });
        }
        return;
      }

      if (upperCol.startsWith('FOREIGN KEY') || (upperCol.includes('FOREIGN KEY') && upperCol.includes('REFERENCES'))) {
        const fkMatch = cleanCol.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*(?:\(([^)]+)\))?/i);
        if (fkMatch) {
          const colName = fkMatch[1].trim().replace(/["`]/g, '');
          const targetTable = fkMatch[2].trim();

          const existingField = fields.find((f) => f.name.toLowerCase() === colName.toLowerCase());
          if (existingField) {
            existingField.isFK = true;
          }

          edges.push({
            id: `edge-${tableName}-${colName}->${targetTable}`,
            source: tableName,
            target: targetTable,
            animated: true,
            style: { stroke: '#6366F1', strokeWidth: 1.8 },
          });
        }
        return;
      }

      const parts = cleanCol.split(/\s+/);
      if (parts.length >= 2) {
        const colName = parts[0].replace(/["`]/g, '');
        const colType = parts[1].replace(/,$/, '');

        const isPK = upperCol.includes('PRIMARY KEY');
        const hasInlineRef = upperCol.includes('REFERENCES');

        if (hasInlineRef) {
          const refMatch = cleanCol.match(/REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*(?:\(([^)]+)\))?/i);
          if (refMatch) {
            const targetTable = refMatch[1];
            edges.push({
              id: `edge-${tableName}-${colName}->${targetTable}`,
              source: tableName,
              target: targetTable,
              animated: true,
              style: { stroke: '#6366F1', strokeWidth: 1.8 },
            });
          }
        }

        fields.push({
          name: colName,
          type: colType.toUpperCase(),
          isPK,
          isFK: hasInlineRef,
        });
      }
    });

    nodes.push({
      id: tableName,
      type: 'schemaNode',
      position: { x: 0, y: 0 },
      data: {
        label: tableName,
        type: 'table',
        fields,
      },
    });
  }

  return { nodes, edges };
}

function splitByCommaOutsideParens(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    result.push(current.trim());
  }
  return result;
}

/**
 * Parse JSON
 */
function parseJSON(raw: string): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge[] = [];

  const parsed = JSON.parse(raw);

  function traverse(obj: any, nodeId: string, label: string, parentId?: string) {
    const fields: NodeField[] = [];

    if (Array.isArray(obj)) {
      fields.push({
        name: 'item_count',
        type: 'number',
        sample: String(obj.length),
      });

      if (obj.length > 0) {
        const sampleItem = obj[0];
        if (typeof sampleItem === 'object' && sampleItem !== null) {
          const childId = `${nodeId}_item`;
          traverse(sampleItem, childId, `${label}[0]`, nodeId);
        } else {
          fields.push({
            name: 'items_type',
            type: typeof sampleItem,
            sample: String(sampleItem),
          });
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const valType = Array.isArray(value) ? 'array' : typeof value;

        if (value !== null && typeof value === 'object') {
          const childId = `${nodeId}_${key}`;
          fields.push({
            name: key,
            type: valType,
            sample: Array.isArray(value) ? `[${value.length}]` : '{...}',
          });

          traverse(value, childId, key, nodeId);
        } else {
          fields.push({
            name: key,
            type: value === null ? 'null' : valType,
            sample: value === null ? 'null' : String(value),
          });
        }
      });
    }

    nodes.push({
      id: nodeId,
      type: 'schemaNode',
      position: { x: 0, y: 0 },
      data: {
        label,
        type: 'object',
        fields,
      },
    });

    if (parentId) {
      edges.push({
        id: `edge-${parentId}->${nodeId}`,
        source: parentId,
        target: nodeId,
        animated: true,
        style: { stroke: '#EC4899', strokeWidth: 1.8 },
      });
    }
  }

  traverse(parsed, 'root', 'root');
  return { nodes, edges };
}

/**
 * Parse CSV
 */
function parseCSV(raw: string): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge[] = [];

  const lines = raw.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { nodes, edges };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map((line) => line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, '')));

  const fields: NodeField[] = headers.map((header, colIdx) => {
    let inferredType = 'string';
    const sampleValues = rows.slice(0, 5).map((r) => r[colIdx]).filter(Boolean);

    const isNumeric = sampleValues.length > 0 && sampleValues.every((v) => !isNaN(Number(v)));
    const isBool = sampleValues.length > 0 && sampleValues.every((v) => v.toLowerCase() === 'true' || v.toLowerCase() === 'false');

    if (isNumeric) inferredType = 'number';
    else if (isBool) inferredType = 'boolean';

    const isPK = header.toLowerCase() === 'id' || header.toLowerCase().endsWith('_id');

    return {
      name: header,
      type: inferredType,
      isPK,
      sample: sampleValues[0] || '',
    };
  });

  nodes.push({
    id: 'csv_dataset',
    type: 'schemaNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'CSV Dataset',
      type: 'csv',
      rowCount: rows.length,
      fields,
    },
  });

  const previewRows = rows.slice(0, 2);
  previewRows.forEach((row, rIdx) => {
    const rowFields: NodeField[] = headers.map((header, colIdx) => ({
      name: header,
      type: 'value',
      sample: row[colIdx] || '',
    }));

    const previewId = `row_${rIdx + 1}`;
    nodes.push({
      id: previewId,
      type: 'schemaNode',
      position: { x: 0, y: 0 },
      data: {
        label: `Row #${rIdx + 1}`,
        type: 'csv',
        fields: rowFields,
      },
    });

    edges.push({
      id: `edge-csv->${previewId}`,
      source: 'csv_dataset',
      target: previewId,
      animated: true,
      style: { stroke: '#10B981', strokeWidth: 1.5, strokeDasharray: '4 4' },
    });
  });

  return { nodes, edges };
}

/**
 * Universal Auto-Parser
 */
export function parseUniversalInput(
  rawInput: string,
  direction: 'LR' | 'TB' = 'LR'
): ParseResult {
  const format = detectFormat(rawInput);
  let parsed = { nodes: [] as Node<NodeData>[], edges: [] as Edge[] };
  let error: string | undefined;
  let detectedType = 'Unknown Format';

  if (format === 'sql') {
    detectedType = 'SQL DDL';
    parsed = parseSQL(rawInput);
  } else if (format === 'json') {
    detectedType = 'Nested JSON';
    parsed = parseJSON(rawInput);
  } else if (format === 'csv') {
    detectedType = 'Analytics CSV';
    parsed = parseCSV(rawInput);
  } else {
    try {
      parsed = parseJSON(rawInput);
      detectedType = 'JSON Payload';
    } catch {
      parsed = parseSQL(rawInput);
      detectedType = 'SQL Schema';
    }
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = applyDagreLayout(
    parsed.nodes,
    parsed.edges,
    direction
  );

  const fieldCount = layoutedNodes.reduce((acc, n) => acc + (n.data?.fields?.length || 0), 0);

  return {
    format,
    detectedType,
    nodes: layoutedNodes,
    edges: layoutedEdges,
    error,
    stats: {
      nodeCount: layoutedNodes.length,
      edgeCount: layoutedEdges.length,
      fieldCount,
    },
  };
}

export const parseUniversal = parseUniversalInput;
