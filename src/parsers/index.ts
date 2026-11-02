import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { FieldItem, SchemaNodeData } from '../components/SchemaNode';

export type DetectedFormat = 'sql' | 'json' | 'csv' | 'unknown';

export interface ParseResult {
  format: DetectedFormat;
  nodes: Node<SchemaNodeData>[];
  edges: Edge[];
  error?: string;
  stats: {
    nodeCount: number;
    edgeCount: number;
    fieldCount: number;
  };
}

/**
 * Heuristics to detect whether text is SQL DDL, JSON, or CSV
 */
export function detectFormat(raw: string): DetectedFormat {
  const trimmed = raw.trim();
  if (!trimmed) return 'unknown';

  // Check JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Might still be JSON with minor syntax or partial, let's keep checking
    }
  }

  // Check SQL DDL
  const upper = trimmed.toUpperCase();
  if (upper.includes('CREATE TABLE') || upper.includes('REFERENCES') || upper.includes('PRIMARY KEY')) {
    return 'sql';
  }

  // Check CSV: contains comma/tab separated rows, at least 2 lines
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
 * Layout nodes using Dagre
 */
export function applyDagreLayout(
  nodes: Node<SchemaNodeData>[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node<SchemaNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 45,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const fieldCount = node.data.fields?.length || 1;
    const estHeight = 44 + fieldCount * 28 + 20;
    const estWidth = 280;
    g.setNode(node.id, { width: estWidth, height: estHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPos = g.node(node.id);
    const fieldCount = node.data.fields?.length || 1;
    const estHeight = 44 + fieldCount * 28 + 20;
    const estWidth = 280;

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
 * Parse SQL CREATE TABLE DDL
 */
function parseSQL(raw: string): { nodes: Node<SchemaNodeData>[]; edges: Edge[] } {
  const nodes: Node<SchemaNodeData>[] = [];
  const edges: Edge[] = [];

  const tableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\)(?:;|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(raw)) !== null) {
    const tableName = match[1];
    const body = match[2];

    const fields: FieldItem[] = [];
    const columnDefinitions = splitByCommaOutsideParens(body);

    columnDefinitions.forEach((colDef) => {
      const cleanCol = colDef.trim();
      if (!cleanCol) return;

      const upperCol = cleanCol.toUpperCase();

      // Check table-level PRIMARY KEY (col1, col2)
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

      // Check table-level FOREIGN KEY
      if (upperCol.startsWith('FOREIGN KEY') || (upperCol.includes('FOREIGN KEY') && upperCol.includes('REFERENCES'))) {
        const fkMatch = cleanCol.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*(?:\(([^)]+)\))?/i);
        if (fkMatch) {
          const colName = fkMatch[1].trim().replace(/["`]/g, '');
          const targetTable = fkMatch[2].trim();
          const targetCol = (fkMatch[3] || 'id').trim().replace(/["`]/g, '');

          const existingField = fields.find((f) => f.name.toLowerCase() === colName.toLowerCase());
          if (existingField) {
            existingField.isFK = true;
            existingField.refTable = targetTable;
          }

          edges.push({
            id: `edge-${tableName}-${colName}->${targetTable}-${targetCol}`,
            source: tableName,
            target: targetTable,
            sourceHandle: `field-out-${tableName}_${colName}`,
            targetHandle: `field-in-${targetTable}_${targetCol}`,
            animated: true,
            style: { stroke: '#6366F1', strokeWidth: 2 },
          });
        }
        return;
      }

      // Individual Column definition: col_name TYPE constraints
      const parts = cleanCol.split(/\s+/);
      if (parts.length >= 2) {
        const colName = parts[0].replace(/["`]/g, '');
        const colType = parts[1].replace(/,$/, '');

        const isPK = upperCol.includes('PRIMARY KEY');
        const hasInlineRef = upperCol.includes('REFERENCES');

        let refTable: string | undefined;
        let refCol: string | undefined;

        if (hasInlineRef) {
          const refMatch = cleanCol.match(/REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*(?:\(([^)]+)\))?/i);
          if (refMatch) {
            refTable = refMatch[1];
            refCol = refMatch[2] ? refMatch[2].replace(/["`]/g, '') : 'id';

            edges.push({
              id: `edge-${tableName}-${colName}->${refTable}-${refCol}`,
              source: tableName,
              target: refTable,
              sourceHandle: `field-out-${tableName}_${colName}`,
              targetHandle: `field-in-${refTable}_${refCol}`,
              animated: true,
              style: { stroke: '#6366F1', strokeWidth: 2 },
            });
          }
        }

        fields.push({
          id: `${tableName}_${colName}`,
          name: colName,
          type: colType.toUpperCase(),
          isPK,
          isFK: hasInlineRef,
          refTable,
        });
      }
    });

    nodes.push({
      id: tableName,
      type: 'schemaNode',
      position: { x: 0, y: 0 },
      data: {
        title: tableName,
        category: 'sql',
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
 * Parse JSON into hierarchical nodes & edges
 */
function parseJSON(raw: string): { nodes: Node<SchemaNodeData>[]; edges: Edge[] } {
  const nodes: Node<SchemaNodeData>[] = [];
  const edges: Edge[] = [];

  const parsed = JSON.parse(raw);

  function traverse(obj: any, nodeId: string, title: string, parentId?: string) {
    const fields: FieldItem[] = [];

    if (Array.isArray(obj)) {
      fields.push({
        id: `${nodeId}_length`,
        name: 'item_count',
        type: 'number',
        sampleValue: String(obj.length),
      });

      if (obj.length > 0) {
        const sampleItem = obj[0];
        if (typeof sampleItem === 'object' && sampleItem !== null) {
          const childId = `${nodeId}_item`;
          traverse(sampleItem, childId, `${title}[0]`, nodeId);
        } else {
          fields.push({
            id: `${nodeId}_sample`,
            name: 'items_type',
            type: typeof sampleItem,
            sampleValue: String(sampleItem),
          });
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const valType = Array.isArray(value) ? 'array' : typeof value;

        if (value !== null && typeof value === 'object') {
          const childId = `${nodeId}_${key}`;
          fields.push({
            id: `${nodeId}_${key}`,
            name: key,
            type: valType,
            sampleValue: Array.isArray(value) ? `[${value.length}]` : '{...}',
          });

          traverse(value, childId, key, nodeId);
        } else {
          fields.push({
            id: `${nodeId}_${key}`,
            name: key,
            type: value === null ? 'null' : valType,
            sampleValue: value === null ? 'null' : String(value),
          });
        }
      });
    }

    nodes.push({
      id: nodeId,
      type: 'schemaNode',
      position: { x: 0, y: 0 },
      data: {
        title,
        category: 'json',
        fields,
      },
    });

    if (parentId) {
      edges.push({
        id: `edge-${parentId}->${nodeId}`,
        source: parentId,
        target: nodeId,
        animated: true,
        style: { stroke: '#EC4899', strokeWidth: 2 },
      });
    }
  }

  traverse(parsed, 'root', 'root');
  return { nodes, edges };
}

/**
 * Parse CSV into Schema node + preview nodes
 */
function parseCSV(raw: string): { nodes: Node<SchemaNodeData>[]; edges: Edge[] } {
  const nodes: Node<SchemaNodeData>[] = [];
  const edges: Edge[] = [];

  const lines = raw.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { nodes, edges };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map((line) => line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, '')));

  const fields: FieldItem[] = headers.map((header, colIdx) => {
    let inferredType = 'string';
    const sampleValues = rows.slice(0, 5).map((r) => r[colIdx]).filter(Boolean);

    const isNumeric = sampleValues.length > 0 && sampleValues.every((v) => !isNaN(Number(v)));
    const isBool = sampleValues.length > 0 && sampleValues.every((v) => v.toLowerCase() === 'true' || v.toLowerCase() === 'false');

    if (isNumeric) inferredType = 'number';
    else if (isBool) inferredType = 'boolean';

    const isPK = header.toLowerCase() === 'id' || header.toLowerCase().endsWith('_id');

    return {
      id: `csv_col_${colIdx}`,
      name: header,
      type: inferredType,
      isPK,
      sampleValue: sampleValues[0] || '',
    };
  });

  nodes.push({
    id: 'csv_schema',
    type: 'schemaNode',
    position: { x: 0, y: 0 },
    data: {
      title: 'CSV Dataset Schema',
      category: 'csv',
      rowCount: rows.length,
      fields,
    },
  });

  const previewRows = rows.slice(0, 3);
  previewRows.forEach((row, rIdx) => {
    const rowFields: FieldItem[] = headers.map((header, colIdx) => ({
      id: `row_${rIdx}_${colIdx}`,
      name: header,
      type: 'value',
      sampleValue: row[colIdx] || '',
    }));

    const previewId = `csv_row_${rIdx + 1}`;
    nodes.push({
      id: previewId,
      type: 'schemaNode',
      position: { x: 0, y: 0 },
      data: {
        title: `Row Sample #${rIdx + 1}`,
        category: 'csv',
        fields: rowFields,
      },
    });

    edges.push({
      id: `edge-csv-schema->${previewId}`,
      source: 'csv_schema',
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
export function parseUniversal(
  rawInput: string,
  direction: 'LR' | 'TB' = 'LR'
): ParseResult {
  const format = detectFormat(rawInput);
  let parsed = { nodes: [] as Node<SchemaNodeData>[], edges: [] as Edge[] };
  let error: string | undefined;

  try {
    if (format === 'json') {
      parsed = parseJSON(rawInput);
    } else if (format === 'sql') {
      parsed = parseSQL(rawInput);
    } else if (format === 'csv') {
      parsed = parseCSV(rawInput);
    } else {
      try {
        parsed = parseJSON(rawInput);
      } catch {
        parsed = parseSQL(rawInput);
      }
    }
  } catch (err: any) {
    error = err.message || 'Failed to parse input';
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = applyDagreLayout(
    parsed.nodes,
    parsed.edges,
    direction
  );

  const fieldCount = layoutedNodes.reduce((acc, n) => acc + (n.data?.fields?.length || 0), 0);

  return {
    format,
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

/**
 * Export graph as clean LLM Context Markdown
 */
export function generateLLMContext(nodes: Node<SchemaNodeData>[], edges: Edge[]): string {
  let output = `# RawMap Architecture & Data Context\n\n`;
  output += `Generated by RawMap (https://rawmap.vercel.app)\n\n`;
  output += `## Overview\n`;
  output += `- Total Entities / Nodes: ${nodes.length}\n`;
  output += `- Total Relationships / Edges: ${edges.length}\n\n`;

  output += `## Entities & Schemas\n\n`;
  nodes.forEach((node) => {
    output += `### ${node.data.title} (${node.data.category || 'entity'})\n`;
    if (node.data.rowCount !== undefined) {
      output += `*Record Count: ${node.data.rowCount}*\n`;
    }
    output += `| Field Name | Type | Key / Constraint | Sample Value |\n`;
    output += `| :--- | :--- | :--- | :--- |\n`;

    node.data.fields?.forEach((f) => {
      let keyBadge = '-';
      if (f.isPK) keyBadge = 'PRIMARY KEY';
      else if (f.isFK) keyBadge = `FOREIGN KEY -> ${f.refTable || 'Ref'}`;

      output += `| \`${f.name}\` | \`${f.type}\` | ${keyBadge} | ${f.sampleValue || '-'} |\n`;
    });
    output += `\n`;
  });

  if (edges.length > 0) {
    output += `## Relationships & Foreign Keys\n\n`;
    edges.forEach((edge) => {
      output += `- \`${edge.source}\` ➔ \`${edge.target}\`\n`;
    });
  }

  return output;
}
