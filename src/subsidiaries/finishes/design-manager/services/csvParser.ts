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
 * Remove BOM (Byte Order Mark) from string
 */
function removeBOM(str: string): string {
  // Remove UTF-8 BOM
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.slice(1);
  }
  // Remove UTF-8 BOM as bytes
  if (str.startsWith('\uFEFF') || str.startsWith('\xEF\xBB\xBF')) {
    return str.slice(1);
  }
  return str;
}

/**
 * Detect the delimiter used in the CSV (comma or semicolon)
 */
function detectDelimiter(csvString: string): string {
  const firstLine = csvString.split(/[\r\n]/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Parse CSV string into rows
 */
function parseCSVToRows(csvString: string): string[][] {
  // Remove BOM if present
  const cleanedString = removeBOM(csvString);
  
  // Detect delimiter
  const delimiter = detectDelimiter(cleanedString);
  
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanedString.length; i++) {
    const char = cleanedString[i];
    const nextChar = cleanedString[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
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
 * Detect if a row is a header row or a data row
 * Polyboard exports often have no header - data starts immediately
 */
function detectIfHeaderRow(row: string[]): boolean {
  if (row.length < 7) return false;
  
  // In Polyboard format: columns 5 and 6 are Length and Width (0-indexed)
  // If they're numeric, this is likely a data row, not headers
  const col5 = row[5]?.trim() || '';
  const col6 = row[6]?.trim() || '';
  
  const col5IsNumeric = /^\d+(\.\d+)?$/.test(col5);
  const col6IsNumeric = /^\d+(\.\d+)?$/.test(col6);
  
  if (col5IsNumeric && col6IsNumeric) {
    return false;
  }
  
  // Also check column 3 (thickness) and 4 (quantity)
  const col3 = row[3]?.trim() || '';
  const col4 = row[4]?.trim() || '';
  const col3IsNumeric = /^\d+(\.\d+)?$/.test(col3);
  const col4IsNumeric = /^\d+(\.\d+)?$/.test(col4);
  
  const numericCount = [col3IsNumeric, col4IsNumeric, col5IsNumeric, col6IsNumeric].filter(Boolean).length;
  if (numericCount >= 3) {
    return false;
  }
  
  return true;
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

  // Generic mapping - try many common variations
  return {
    name: headerMap['name'] ?? headerMap['part'] ?? headerMap['description'] ?? headerMap['part name'] ?? headerMap['component'] ?? headerMap['item'] ?? 0,
    length: headerMap['length'] ?? headerMap['l'] ?? headerMap['len'] ?? headerMap['long'] ?? 1,
    width: headerMap['width'] ?? headerMap['w'] ?? headerMap['wid'] ?? headerMap['wide'] ?? 2,
    thickness: headerMap['thickness'] ?? headerMap['t'] ?? headerMap['thk'] ?? headerMap['thick'] ?? headerMap['depth'] ?? headerMap['d'] ?? 3,
    quantity: headerMap['quantity'] ?? headerMap['qty'] ?? headerMap['count'] ?? headerMap['no'] ?? headerMap['num'] ?? headerMap['pcs'] ?? 4,
    material: headerMap['material'] ?? headerMap['mat'] ?? headerMap['board'] ?? headerMap['sheet'] ?? headerMap['panel'] ?? 5,
    grain: headerMap['grain'] ?? headerMap['grain direction'] ?? headerMap['direction'],
    notes: headerMap['notes'] ?? headerMap['comment'] ?? headerMap['comments'] ?? headerMap['remarks'],
  };
}

/**
 * Get positional mapping for headerless Polyboard exports
 * Format: Cabinet;Label;Material;Thickness;Quantity;Length;Width;Grain;Edge1;Edge2;Edge3;Edge4
 */
function getPolyboardPositionalMapping(): ColumnMapping {
  return {
    name: 1,        // Label
    length: 5,      // Length
    width: 6,       // Width
    thickness: 3,   // Thickness
    quantity: 4,    // Quantity
    material: 2,    // Material
    grain: 7,       // Grain
    edgeTop: 8,     // Edge1
    edgeBottom: 10, // Edge3
    edgeLeft: 11,   // Edge4
    edgeRight: 9,   // Edge2
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
  
  if (rows.length < 1) {
    return {
      success: false,
      sourceType: 'unknown',
      parts: [],
      errors: [{ row: 0, message: 'CSV file is empty' }],
      warnings: [],
      metadata: {
        totalRows: rows.length,
        parsedRows: 0,
        skippedRows: 0,
        filename,
      },
    };
  }

  // Detect if first row is header or data
  const firstRow = rows[0];
  const isHeaderRow = detectIfHeaderRow(firstRow);
  
  let headers: string[];
  let dataStartIndex: number;
  
  if (isHeaderRow) {
    headers = firstRow;
    dataStartIndex = 1;
  } else {
    // No header row - use Polyboard positional format
    // Format: Cabinet;Label;Material;Thickness;Quantity;Length;Width;Grain;Edge1;Edge2;Edge3;Edge4
    headers = ['cabinet', 'label', 'material', 'thickness', 'quantity', 'length', 'width', 'grain', 'topEdge', 'rightEdge', 'bottomEdge', 'leftEdge'];
    dataStartIndex = 0;
  }
  
  const sourceType = isHeaderRow ? detectSourceType(headers) : 'polyboard';
  const mapping = isHeaderRow ? getColumnMapping(headers, sourceType) : getPolyboardPositionalMapping();

  const parts: ParsedPart[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  if (sourceType === 'unknown') {
    warnings.push('Could not detect CSV format, using generic mapping');
  }
  
  if (!isHeaderRow) {
    warnings.push('No header row detected - using Polyboard positional format');
  }

  for (let i = dataStartIndex; i < rows.length; i++) {
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
