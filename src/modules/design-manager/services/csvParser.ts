/**
 * CSV Parser Service
 * Parses cutlist CSV exports from various CAD software
 */

import type { PartEntry, GrainDirection, PartEdgeBanding } from '../types';

export type CSVSourceType = 'polyboard' | 'sketchup' | 'generic' | 'unknown';

export interface CSVParseResult {
  success: boolean;
  sourceType: CSVSourceType;
  parts: ParsedPart[];
  errors: ParseError[];
  warnings: string[];
  metadata: {
    totalRows: number;
    parsedRows: number;
    skippedRows: number;
    filename?: string;
  };
}

export interface ParsedPart {
  name: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  materialName: string;
  materialCode?: string;
  grainDirection: GrainDirection;
  edgeBanding: PartEdgeBanding;
  notes?: string;
  originalRow: number;
}

export interface ParseError {
  row: number;
  column?: string;
  message: string;
  rawData?: string;
}

interface ColumnMapping {
  name: string | number;
  length: string | number;
  width: string | number;
  thickness: string | number;
  quantity: string | number;
  material: string | number;
  grain?: string | number;
  edgeTop?: string | number;
  edgeBottom?: string | number;
  edgeLeft?: string | number;
  edgeRight?: string | number;
  notes?: string | number;
}

/**
 * Parse CSV string into rows
 */
function parseCSVToRows(csvString: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvString.length; i++) {
    const char = csvString[i];
    const nextChar = csvString[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Detect CSV source type from headers
 */
function detectSourceType(headers: string[]): CSVSourceType {
  const headerString = headers.join(',').toLowerCase();

  if (
    headerString.includes('désignation') ||
    headerString.includes('longueur') ||
    headerString.includes('largeur') ||
    headerString.includes('polyboard')
  ) {
    return 'polyboard';
  }

  if (
    headerString.includes('sub-assembly') ||
    headerString.includes('part name') ||
    headerString.includes('sketchup') ||
    headerString.includes('cutlist')
  ) {
    return 'sketchup';
  }

  if (
    headerString.includes('length') &&
    headerString.includes('width') &&
    (headerString.includes('qty') || headerString.includes('quantity'))
  ) {
    return 'generic';
  }

  return 'unknown';
}

/**
 * Get column mapping based on source type
 */
function getColumnMapping(headers: string[], sourceType: CSVSourceType): ColumnMapping {
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerMap[h.toLowerCase().trim()] = i;
  });

  if (sourceType === 'polyboard') {
    return {
      name: headerMap['désignation'] ?? headerMap['designation'] ?? headerMap['name'] ?? 0,
      length: headerMap['longueur'] ?? headerMap['length'] ?? 1,
      width: headerMap['largeur'] ?? headerMap['width'] ?? 2,
      thickness: headerMap['épaisseur'] ?? headerMap['thickness'] ?? 3,
      quantity: headerMap['quantité'] ?? headerMap['qty'] ?? headerMap['quantity'] ?? 4,
      material: headerMap['matériau'] ?? headerMap['material'] ?? 5,
      grain: headerMap['fil'] ?? headerMap['grain'],
      edgeTop: headerMap['chant 1'] ?? headerMap['edge1'],
      edgeBottom: headerMap['chant 2'] ?? headerMap['edge2'],
      edgeLeft: headerMap['chant 3'] ?? headerMap['edge3'],
      edgeRight: headerMap['chant 4'] ?? headerMap['edge4'],
    };
  }

  if (sourceType === 'sketchup') {
    return {
      name: headerMap['part name'] ?? headerMap['part'] ?? headerMap['name'] ?? 0,
      length: headerMap['length'] ?? headerMap['l'] ?? 1,
      width: headerMap['width'] ?? headerMap['w'] ?? 2,
      thickness: headerMap['thickness'] ?? headerMap['t'] ?? headerMap['thk'] ?? 3,
      quantity: headerMap['quantity'] ?? headerMap['qty'] ?? headerMap['count'] ?? 4,
      material: headerMap['material'] ?? headerMap['sheet'] ?? 5,
      grain: headerMap['grain'] ?? headerMap['grain direction'],
      notes: headerMap['notes'] ?? headerMap['comments'],
    };
  }

  // Generic mapping
  return {
    name: headerMap['name'] ?? headerMap['part'] ?? headerMap['description'] ?? 0,
    length: headerMap['length'] ?? headerMap['l'] ?? 1,
    width: headerMap['width'] ?? headerMap['w'] ?? 2,
    thickness: headerMap['thickness'] ?? headerMap['t'] ?? headerMap['thk'] ?? 3,
    quantity: headerMap['quantity'] ?? headerMap['qty'] ?? headerMap['count'] ?? 4,
    material: headerMap['material'] ?? headerMap['mat'] ?? 5,
    grain: headerMap['grain'],
    notes: headerMap['notes'],
  };
}

/**
 * Parse dimension value (handles mm, cm, inches)
 */
function parseDimension(value: string): number {
  if (!value) return 0;
  
  const cleaned = value.toString().trim().toLowerCase();
  const match = cleaned.match(/^([\d.,]+)\s*(mm|cm|in|inch|")?$/);
  
  if (!match) {
    const num = parseFloat(cleaned.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  }

  let num = parseFloat(match[1].replace(',', '.'));
  const unit = match[2];

  if (unit === 'cm') {
    num *= 10;
  } else if (unit === 'in' || unit === 'inch' || unit === '"') {
    num *= 25.4;
  }

  return Math.round(num * 100) / 100;
}

/**
 * Parse grain direction
 */
function parseGrain(value: string | undefined): GrainDirection {
  if (!value) return 'none';
  const v = value.toLowerCase().trim();
  if (v === 'l' || v === 'length' || v === 'longueur' || v === '1') return 'length';
  if (v === 'w' || v === 'width' || v === 'largeur' || v === '2') return 'width';
  return 'none';
}

/**
 * Parse edge banding indicator
 */
function parseEdge(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase().trim();
  return v === '1' || v === 'x' || v === 'yes' || v === 'true' || v === 'y';
}

/**
 * Parse a single row into a part
 */
function parseRow(
  row: string[],
  rowIndex: number,
  mapping: ColumnMapping
): { part: ParsedPart | null; error: ParseError | null } {
  try {
    const getValue = (key: keyof ColumnMapping): string => {
      const idx = mapping[key];
      if (idx === undefined) return '';
      return typeof idx === 'number' ? row[idx] || '' : '';
    };

    const name = getValue('name');
    const length = parseDimension(getValue('length'));
    const width = parseDimension(getValue('width'));
    const thickness = parseDimension(getValue('thickness'));
    const quantity = parseInt(getValue('quantity'), 10) || 1;
    const materialName = getValue('material') || 'Unspecified';

    if (!name) {
      return { part: null, error: { row: rowIndex, column: 'name', message: 'Missing part name' } };
    }
    if (length <= 0) {
      return { part: null, error: { row: rowIndex, column: 'length', message: 'Invalid length' } };
    }
    if (width <= 0) {
      return { part: null, error: { row: rowIndex, column: 'width', message: 'Invalid width' } };
    }

    const part: ParsedPart = {
      name,
      length,
      width,
      thickness: thickness || 18,
      quantity,
      materialName,
      grainDirection: parseGrain(getValue('grain')),
      edgeBanding: {
        top: parseEdge(getValue('edgeTop')),
        bottom: parseEdge(getValue('edgeBottom')),
        left: parseEdge(getValue('edgeLeft')),
        right: parseEdge(getValue('edgeRight')),
      },
      notes: getValue('notes') || undefined,
      originalRow: rowIndex,
    };

    return { part, error: null };
  } catch (err) {
    return {
      part: null,
      error: {
        row: rowIndex,
        message: err instanceof Error ? err.message : 'Parse error',
        rawData: row.join(','),
      },
    };
  }
}

/**
 * Main CSV parse function
 */
export function parseCSV(csvString: string, filename?: string): CSVParseResult {
  const rows = parseCSVToRows(csvString);
  
  if (rows.length < 2) {
    return {
      success: false,
      sourceType: 'unknown',
      parts: [],
      errors: [{ row: 0, message: 'CSV must have header row and at least one data row' }],
      warnings: [],
      metadata: {
        totalRows: rows.length,
        parsedRows: 0,
        skippedRows: 0,
        filename,
      },
    };
  }

  const headers = rows[0];
  const sourceType = detectSourceType(headers);
  const mapping = getColumnMapping(headers, sourceType);

  const parts: ParsedPart[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  if (sourceType === 'unknown') {
    warnings.push('Could not detect CSV format, using generic mapping');
  }

  for (let i = 1; i < rows.length; i++) {
    const { part, error } = parseRow(rows[i], i + 1, mapping);
    if (part) {
      parts.push(part);
    }
    if (error) {
      errors.push(error);
    }
  }

  return {
    success: parts.length > 0,
    sourceType,
    parts,
    errors,
    warnings,
    metadata: {
      totalRows: rows.length - 1,
      parsedRows: parts.length,
      skippedRows: errors.length,
      filename,
    },
  };
}

/**
 * Convert parsed parts to PartEntry format for saving
 */
export function parsedPartsToPartEntries(
  parsedParts: ParsedPart[],
  source: 'csv-import' | 'polyboard' | 'sketchup',
  filename?: string
): Omit<PartEntry, 'id' | 'createdAt' | 'updatedAt'>[] {
  return parsedParts.map((p, index) => ({
    partNumber: `P${String(index + 1).padStart(3, '0')}`,
    name: p.name,
    length: p.length,
    width: p.width,
    thickness: p.thickness,
    quantity: p.quantity,
    materialName: p.materialName,
    materialCode: p.materialCode,
    grainDirection: p.grainDirection,
    edgeBanding: p.edgeBanding,
    hasCNCOperations: false,
    notes: p.notes,
    source,
    importedFrom: filename,
  }));
}
