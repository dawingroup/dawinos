/**
 * CSV Splitter Utility
 * Parses Polyboard Master CSV and groups rows by Cabinet_Code
 */

import type { Panel } from '@/shared/services/optimization';

// ============================================
// Types
// ============================================

export interface PolyboardRow {
  partId: string;
  label: string;
  cabinetCode: string;
  cabinetName?: string;
  material: string;
  thickness: number;
  length: number;
  width: number;
  quantity: number;
  grain: number;
  edgeTop?: string;
  edgeBottom?: string;
  edgeLeft?: string;
  edgeRight?: string;
  notes?: string;
}

export interface CabinetGroup {
  cabinetCode: string;
  cabinetName?: string;
  panels: Panel[];
  totalPanels: number;
  totalArea: number;
  materials: string[];
}

export interface SplitResult {
  groups: CabinetGroup[];
  totalRows: number;
  totalCabinets: number;
  parseErrors: string[];
}

// ============================================
// Column Mapping
// ============================================

const COLUMN_MAPPINGS: Record<string, string[]> = {
  partId: ['Part ID', 'PartID', 'Part_ID', 'ID', 'Part'],
  label: ['Label', 'Name', 'Part Name', 'PartName', 'Description'],
  cabinetCode: ['Cabinet', 'Cabinet_Code', 'CabinetCode', 'Cabinet Code', 'Unit', 'Unit_Code'],
  cabinetName: ['Cabinet Name', 'CabinetName', 'Cabinet_Name', 'Unit Name'],
  material: ['Material', 'Board', 'Material Name', 'MaterialName', 'Mat'],
  thickness: ['Thickness', 'Thk', 'T', 'Board Thickness'],
  length: ['Length', 'L', 'Len', 'Height'],
  width: ['Width', 'W', 'Wid', 'Depth'],
  quantity: ['Quantity', 'Qty', 'Q', 'Count', 'No.'],
  grain: ['Grain', 'Grain Direction', 'GrainDir', 'Rotation'],
  edgeTop: ['Edge Top', 'EdgeTop', 'Top Edge', 'Edge1'],
  edgeBottom: ['Edge Bottom', 'EdgeBottom', 'Bottom Edge', 'Edge2'],
  edgeLeft: ['Edge Left', 'EdgeLeft', 'Left Edge', 'Edge3'],
  edgeRight: ['Edge Right', 'EdgeRight', 'Right Edge', 'Edge4'],
  notes: ['Notes', 'Comments', 'Remarks'],
};

// ============================================
// CSV Parser
// ============================================

/**
 * Parse CSV text into rows
 */
function parseCSVText(csvText: string): string[][] {
  const lines = csvText.trim().split(/\r?\n/);
  const rows: string[][] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Handle quoted fields with commas
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

/**
 * Find column index for a field
 */
function findColumnIndex(headers: string[], fieldName: string): number {
  const possibleNames = COLUMN_MAPPINGS[fieldName] || [fieldName];
  const headersLower = headers.map(h => h.toLowerCase().trim());
  
  for (const name of possibleNames) {
    const index = headersLower.indexOf(name.toLowerCase());
    if (index !== -1) return index;
  }
  
  return -1;
}

/**
 * Parse a single row into PolyboardRow
 */
function parseRow(
  values: string[],
  columnMap: Record<string, number>,
  rowIndex: number
): { row: PolyboardRow | null; error: string | null } {
  try {
    const getValue = (field: string, defaultValue: string = ''): string => {
      const index = columnMap[field];
      return index !== undefined && index < values.length ? values[index] : defaultValue;
    };
    
    const getNumericValue = (field: string, defaultValue: number): number => {
      const strValue = getValue(field);
      const numValue = parseFloat(strValue);
      return isNaN(numValue) ? defaultValue : numValue;
    };

    const cabinetCode = getValue('cabinetCode');
    if (!cabinetCode) {
      return { row: null, error: `Row ${rowIndex + 1}: Missing cabinet code` };
    }

    const row: PolyboardRow = {
      partId: getValue('partId', `part-${rowIndex}`),
      label: getValue('label', `Panel ${rowIndex}`),
      cabinetCode,
      cabinetName: getValue('cabinetName') || undefined,
      material: getValue('material', 'Unknown'),
      thickness: getNumericValue('thickness', 18),
      length: getNumericValue('length', 0),
      width: getNumericValue('width', 0),
      quantity: Math.max(1, Math.round(getNumericValue('quantity', 1))),
      grain: getNumericValue('grain', 0),
      edgeTop: getValue('edgeTop') || undefined,
      edgeBottom: getValue('edgeBottom') || undefined,
      edgeLeft: getValue('edgeLeft') || undefined,
      edgeRight: getValue('edgeRight') || undefined,
      notes: getValue('notes') || undefined,
    };

    // Validate dimensions
    if (row.length <= 0 || row.width <= 0) {
      return { row: null, error: `Row ${rowIndex + 1}: Invalid dimensions (L=${row.length}, W=${row.width})` };
    }

    return { row, error: null };
  } catch (err) {
    return { row: null, error: `Row ${rowIndex + 1}: Parse error - ${err}` };
  }
}

/**
 * Convert PolyboardRow to Panel for optimization
 */
function rowToPanel(row: PolyboardRow): Panel {
  return {
    id: row.partId,
    label: row.label,
    cabinet: row.cabinetCode,
    material: row.material,
    thickness: row.thickness,
    length: row.length,
    width: row.width,
    quantity: row.quantity,
    grain: row.grain,
  };
}

// ============================================
// Main Export Functions
// ============================================

/**
 * Split Polyboard Master CSV by Cabinet Code
 * @param csvText - Raw CSV text content
 * @returns Split result with groups and statistics
 */
export function splitByCabinet(csvText: string): SplitResult {
  const rawRows = parseCSVText(csvText);
  
  if (rawRows.length < 2) {
    return {
      groups: [],
      totalRows: 0,
      totalCabinets: 0,
      parseErrors: ['CSV file is empty or has no data rows'],
    };
  }

  // First row is headers
  const headers = rawRows[0];
  
  // Build column map
  const columnMap: Record<string, number> = {};
  for (const field of Object.keys(COLUMN_MAPPINGS)) {
    const index = findColumnIndex(headers, field);
    if (index !== -1) {
      columnMap[field] = index;
    }
  }

  // Check required columns
  if (columnMap.cabinetCode === undefined) {
    return {
      groups: [],
      totalRows: 0,
      totalCabinets: 0,
      parseErrors: ['Missing required column: Cabinet Code. Expected one of: ' + COLUMN_MAPPINGS.cabinetCode.join(', ')],
    };
  }

  // Parse data rows
  const parseErrors: string[] = [];
  const cabinetGroups: Map<string, { rows: PolyboardRow[]; name?: string }> = new Map();

  for (let i = 1; i < rawRows.length; i++) {
    const { row, error } = parseRow(rawRows[i], columnMap, i);
    
    if (error) {
      parseErrors.push(error);
      continue;
    }
    
    if (row) {
      if (!cabinetGroups.has(row.cabinetCode)) {
        cabinetGroups.set(row.cabinetCode, { rows: [], name: row.cabinetName });
      }
      cabinetGroups.get(row.cabinetCode)!.rows.push(row);
    }
  }

  // Build result groups
  const groups: CabinetGroup[] = [];
  
  for (const [cabinetCode, groupData] of cabinetGroups) {
    const panels = groupData.rows.map(rowToPanel);
    const materials = [...new Set(groupData.rows.map(r => r.material))];
    
    let totalArea = 0;
    let totalPanels = 0;
    
    for (const row of groupData.rows) {
      totalArea += row.length * row.width * row.quantity;
      totalPanels += row.quantity;
    }

    groups.push({
      cabinetCode,
      cabinetName: groupData.name,
      panels,
      totalPanels,
      totalArea,
      materials,
    });
  }

  // Sort by cabinet code
  groups.sort((a, b) => a.cabinetCode.localeCompare(b.cabinetCode));

  return {
    groups,
    totalRows: rawRows.length - 1,
    totalCabinets: groups.length,
    parseErrors,
  };
}

/**
 * Parse CSV file and return all panels (unsplit)
 */
export function parsePolyboardCSV(csvText: string): { panels: Panel[]; errors: string[] } {
  const result = splitByCabinet(csvText);
  
  const allPanels: Panel[] = [];
  for (const group of result.groups) {
    allPanels.push(...group.panels);
  }
  
  return {
    panels: allPanels,
    errors: result.parseErrors,
  };
}

/**
 * Get summary statistics from split result
 */
export function getSplitSummary(result: SplitResult): {
  totalCabinets: number;
  totalPanels: number;
  totalArea: number;
  materialBreakdown: Record<string, number>;
} {
  let totalPanels = 0;
  let totalArea = 0;
  const materialBreakdown: Record<string, number> = {};

  for (const group of result.groups) {
    totalPanels += group.totalPanels;
    totalArea += group.totalArea;
    
    for (const material of group.materials) {
      if (!materialBreakdown[material]) {
        materialBreakdown[material] = 0;
      }
      materialBreakdown[material] += group.panels.filter(p => p.material === material).length;
    }
  }

  return {
    totalCabinets: result.totalCabinets,
    totalPanels,
    totalArea,
    materialBreakdown,
  };
}
