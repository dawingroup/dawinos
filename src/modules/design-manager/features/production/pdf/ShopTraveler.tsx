/**
 * ShopTraveler PDF Document
 * Complete production documentation with cutting maps, edge banding, remnants, and labels
 * 
 * Enhanced with Dawin Finishes branding and Outfit font
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Project, ProductionResult, NestingSheet, PartPlacement, WasteRegion } from '@/shared/types';
import type { DesignItem, DesignFile } from '@/modules/design-manager/types';

// ============================================
// Font Configuration - Outfit Font Family
// ============================================

// Register Outfit font from Google Fonts CDN
Font.register({
  family: 'Outfit',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-300-normal.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-400-normal.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-500-normal.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-600-normal.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-700-normal.ttf',
      fontWeight: 700,
    },
  ],
});

// ============================================
// Dawin Finishes Brand Colors
// ============================================

const BRAND = {
  boysenberry: '#872E5C',      // Primary brand color
  boysenberryDark: '#6a2449',  // Dark variant
  cashmere: '#E2CAA9',         // Warm background
  cashmereLight: '#efe3d4',    // Light cashmere
  seaform: '#7ABDCD',          // Info/highlights
  pesto: '#8A7D4B',            // Success states
  edgeThick: '#E74C3C',        // Red - 2.0mm thick edge
  edgeThin: '#3498DB',         // Blue - 0.4mm thin edge
  text: '#212121',             // Primary text
  textLight: '#6b7280',        // Secondary text
  white: '#FFFFFF',
  grainArrow: '#872E5C',       // Grain direction indicator
};

// ============================================
// Types
// ============================================

interface ShopTravelerProps {
  project: Project;
  production: ProductionResult;
  designItems?: DesignItem[];  // For accessing drawings
  logoUrl?: string;  // Dawin Finishes logo URL from subsidiary branding
}

interface PartWithBanding {
  partId: string;
  partName: string;
  designItemName: string;
  cabinet?: string;
  length: number;
  width: number;
  thickness: number;
  grainDirection: 'length' | 'width' | 'none';
  edgeBanding: {
    top: string | boolean;
    bottom: string | boolean;
    left: string | boolean;
    right: string | boolean;
  };
  bandingLength: number;
  sheetNumber: number;
}

// ============================================
// Styles with Outfit Font
// ============================================

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Outfit',
    backgroundColor: BRAND.white,
  },
  labelPage: {
    padding: 15,
    fontSize: 7,
    fontFamily: 'Outfit',
    backgroundColor: BRAND.white,
  },
  // Header bar - Dawin branding
  headerBar: {
    backgroundColor: BRAND.boysenberry,
    marginHorizontal: -30,
    marginTop: -30,
    paddingHorizontal: 30,
    paddingVertical: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND.white,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 9,
    color: BRAND.cashmere,
    marginTop: 2,
  },
  headerRight: {
    position: 'absolute',
    right: 30,
    top: 12,
    alignItems: 'flex-end',
  },
  headerDate: {
    fontSize: 8,
    color: BRAND.cashmereLight,
  },
  headerPage: {
    fontSize: 9,
    color: BRAND.white,
    fontWeight: 600,
  },
  // Section titles
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: BRAND.boysenberry,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.cashmere,
  },
  sectionTitleBar: {
    backgroundColor: BRAND.cashmereLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.boysenberry,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: 600,
    color: BRAND.boysenberryDark,
  },
  // Cover page styles
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBrand: {
    fontSize: 11,
    fontWeight: 500,
    color: BRAND.boysenberry,
    letterSpacing: 3,
    marginBottom: 8,
  },
  coverTitle: {
    fontSize: 42,
    fontWeight: 700,
    color: BRAND.boysenberry,
    marginBottom: 12,
  },
  coverProjectCode: {
    fontSize: 32,
    fontWeight: 700,
    color: BRAND.text,
    marginBottom: 8,
  },
  coverCustomer: {
    fontSize: 16,
    fontWeight: 400,
    color: BRAND.textLight,
    marginBottom: 40,
  },
  coverDivider: {
    width: 80,
    height: 3,
    backgroundColor: BRAND.cashmere,
    marginBottom: 40,
  },
  coverStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  coverStat: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: BRAND.cashmereLight,
    borderRadius: 6,
    minWidth: 90,
  },
  coverStatValue: {
    fontSize: 28,
    fontWeight: 700,
    color: BRAND.boysenberry,
  },
  coverStatLabel: {
    fontSize: 9,
    fontWeight: 500,
    color: BRAND.textLight,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coverFooter: {
    marginTop: 60,
    alignItems: 'center',
  },
  coverGenerated: {
    fontSize: 8,
    color: BRAND.textLight,
  },
  // Sheet header styles
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.cashmere,
  },
  sheetNumber: {
    fontSize: 14,
    fontWeight: 600,
    color: BRAND.boysenberry,
  },
  sheetMaterial: {
    fontSize: 11,
    fontWeight: 500,
    color: BRAND.text,
  },
  sheetDimensions: {
    fontSize: 9,
    color: BRAND.textLight,
  },
  sheetUtilization: {
    fontSize: 10,
    fontWeight: 600,
  },
  utilizationGood: {
    color: BRAND.pesto,
  },
  utilizationWarn: {
    color: BRAND.edgeThick,
  },
  // Diagram styles
  diagram: {
    marginBottom: 15,
    alignItems: 'center',
  },
  sheetOutline: {
    borderWidth: 2,
    borderColor: BRAND.text,
    backgroundColor: BRAND.cashmereLight,
    position: 'relative',
  },
  part: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: BRAND.boysenberryDark,
    backgroundColor: BRAND.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partLabel: {
    fontSize: 6,
    fontWeight: 600,
    color: BRAND.text,
    textAlign: 'center',
  },
  partDimensions: {
    fontSize: 5,
    color: BRAND.textLight,
    textAlign: 'center',
  },
  cutSequence: {
    position: 'absolute',
    top: 1,
    right: 1,
    fontSize: 5,
    fontWeight: 700,
    color: BRAND.white,
    backgroundColor: BRAND.boysenberry,
    borderRadius: 5,
    width: 10,
    height: 10,
    textAlign: 'center',
  },
  // Edge banding indicators - offset from edge, black lines for B&W printing
  edgeBandTop: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: '#000000',
  },
  edgeBandBottom: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: '#000000',
  },
  edgeBandLeft: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 2,
    width: 1,
    backgroundColor: '#000000',
  },
  edgeBandRight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    right: 2,
    width: 1,
    backgroundColor: '#000000',
  },
  // Drawings section styles
  drawingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  drawingItem: {
    width: '48%',
    padding: 8,
    borderWidth: 1,
    borderColor: BRAND.cashmere,
    borderRadius: 4,
    marginBottom: 8,
  },
  drawingImage: {
    width: '100%',
    height: 150,
    objectFit: 'contain',
    marginBottom: 6,
  },
  drawingLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: BRAND.text,
  },
  drawingMeta: {
    fontSize: 6,
    color: BRAND.textLight,
    marginTop: 2,
  },
  grainArrow: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    fontSize: 7,
    color: BRAND.grainArrow,
    fontWeight: 600,
  },
  remnant: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: BRAND.pesto,
    borderStyle: 'dashed',
    backgroundColor: BRAND.cashmereLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remnantLabel: {
    fontSize: 5,
    color: BRAND.pesto,
    fontWeight: 600,
  },
  remnantDim: {
    fontSize: 4,
    color: BRAND.textLight,
  },
  // Parts list styles
  partsList: {
    marginTop: 12,
  },
  partsListHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.boysenberry,
    padding: 6,
    marginBottom: 4,
  },
  partsListHeaderCell: {
    fontSize: 7,
    fontWeight: 600,
    color: BRAND.white,
  },
  partsListRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.cashmereLight,
  },
  partsListCell: {
    fontSize: 7,
    color: BRAND.text,
  },
  partsListCellLabel: {
    width: '15%',
  },
  partsListCellName: {
    width: '30%',
  },
  partsListCellItem: {
    width: '25%',
  },
  partsListCellDim: {
    width: '15%',
    textAlign: 'right',
  },
  partsListCellEdge: {
    width: '15%',
    textAlign: 'center',
  },
  // Table styles
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.boysenberry,
    padding: 8,
  },
  tableHeaderCell: {
    color: BRAND.white,
    fontSize: 8,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 7,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.cashmereLight,
  },
  tableRowAlt: {
    backgroundColor: BRAND.cashmereLight,
  },
  tableCell: {
    fontSize: 7,
    color: BRAND.text,
  },
  tableCellBold: {
    fontSize: 7,
    color: BRAND.text,
    fontWeight: 600,
  },
  tableTotal: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: BRAND.cashmere,
    borderTopWidth: 2,
    borderTopColor: BRAND.boysenberry,
  },
  // Label styles
  labelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    width: '31%',
    padding: 8,
    borderWidth: 1,
    borderColor: BRAND.boysenberry,
    borderRadius: 3,
    marginBottom: 8,
  },
  labelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.cashmere,
  },
  labelCode: {
    fontSize: 10,
    fontWeight: 700,
    color: BRAND.boysenberry,
  },
  labelSheet: {
    fontSize: 7,
    fontWeight: 500,
    color: BRAND.textLight,
  },
  labelName: {
    fontSize: 7,
    fontWeight: 500,
    color: BRAND.text,
    marginBottom: 2,
  },
  labelItem: {
    fontSize: 6,
    color: BRAND.textLight,
    marginBottom: 4,
  },
  labelDim: {
    fontSize: 8,
    fontWeight: 600,
    color: BRAND.text,
  },
  labelThickness: {
    fontSize: 6,
    color: BRAND.textLight,
  },
  labelEdge: {
    fontSize: 6,
    fontWeight: 500,
    color: BRAND.seaform,
    marginTop: 4,
  },
  labelGrain: {
    fontSize: 6,
    color: BRAND.boysenberry,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND.cashmere,
  },
  footerLeft: {
    fontSize: 7,
    color: BRAND.boysenberry,
    fontWeight: 500,
  },
  footerCenter: {
    fontSize: 6,
    color: BRAND.textLight,
  },
  footerRight: {
    fontSize: 8,
    color: BRAND.text,
    fontWeight: 600,
  },
  // Legend
  legend: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
    padding: 8,
    backgroundColor: BRAND.cashmereLight,
    borderRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 6,
    color: BRAND.textLight,
  },
});

// ============================================
// Helper Functions
// ============================================

function calculateScale(sheetSize: { length: number; width: number }, maxWidth = 500, maxHeight = 350): number {
  // Calculate scale to fit sheet within max dimensions
  const scaleX = maxWidth / sheetSize.length;
  const scaleY = maxHeight / sheetSize.width;
  // Use the smaller scale to ensure sheet fits, no arbitrary cap
  return Math.min(scaleX, scaleY);
}

/**
 * Validate that a part fits within the sheet boundaries
 */
function validatePartPlacement(part: PartPlacement, sheetSize: { length: number; width: number }): boolean {
  const partLength = part.rotated ? part.width : part.length;
  const partWidth = part.rotated ? part.length : part.width;
  return (
    part.x >= 0 &&
    part.y >= 0 &&
    part.x + partLength <= sheetSize.length &&
    part.y + partWidth <= sheetSize.width
  );
}

function getAllPartsWithBanding(nestingSheets: NestingSheet[], sheetIndex?: number): PartWithBanding[] {
  const parts: PartWithBanding[] = [];
  
  const sheetsToProcess = sheetIndex !== undefined 
    ? [{ sheet: nestingSheets[sheetIndex], idx: sheetIndex }] 
    : nestingSheets.map((sheet, idx) => ({ sheet, idx }));
  
  for (const { sheet, idx } of sheetsToProcess) {
    for (const placement of sheet.placements) {
      // Read edge banding from actual part data, respecting the order applied
      const partEdgeBanding = placement.edgeBanding;
      const edgeBanding = {
        top: partEdgeBanding?.top ? (partEdgeBanding.material || true) : false,
        bottom: partEdgeBanding?.bottom ? (partEdgeBanding.material || true) : false,
        left: partEdgeBanding?.left ? (partEdgeBanding.material || true) : false,
        right: partEdgeBanding?.right ? (partEdgeBanding.material || true) : false,
      } as { top: string | boolean; bottom: string | boolean; left: string | boolean; right: string | boolean };
      
      const calcBandingLength = (edge: string | boolean, dim: number) => {
        if (!edge) return 0;
        return dim;
      };
      
      const bandingLength = 
        calcBandingLength(edgeBanding.top, placement.length) +
        calcBandingLength(edgeBanding.bottom, placement.length) +
        calcBandingLength(edgeBanding.left, placement.width) +
        calcBandingLength(edgeBanding.right, placement.width);
      
      parts.push({
        partId: placement.partId,
        partName: placement.partName,
        designItemName: placement.designItemName,
        length: placement.length,
        width: placement.width,
        thickness: partEdgeBanding?.thickness || 18,
        grainDirection: placement.grainAligned ? 'length' : 'none',
        edgeBanding,
        bandingLength,
        sheetNumber: idx + 1,
      });
    }
  }
  
  return parts;
}

function formatDate(date?: Date): string {
  if (!date) return new Date().toLocaleDateString();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDimensions(length: number, width: number): string {
  return `${length} × ${width} mm`;
}

function getEdgeBandingCode(edgeBanding: { top: string | boolean; bottom: string | boolean; left: string | boolean; right: string | boolean }): string {
  const codes: string[] = [];
  if (edgeBanding.top) codes.push('T');
  if (edgeBanding.bottom) codes.push('B');
  if (edgeBanding.left) codes.push('L');
  if (edgeBanding.right) codes.push('R');
  return codes.length > 0 ? codes.join('') : '-';
}

function getEdgeBandingDisplay(edgeBanding: { top: string | boolean; bottom: string | boolean; left: string | boolean; right: string | boolean }): string {
  const edges: string[] = [];
  if (edgeBanding.top) edges.push(`T:${typeof edgeBanding.top === 'string' ? edgeBanding.top : 'Y'}`);
  if (edgeBanding.bottom) edges.push(`B:${typeof edgeBanding.bottom === 'string' ? edgeBanding.bottom : 'Y'}`);
  if (edgeBanding.left) edges.push(`L:${typeof edgeBanding.left === 'string' ? edgeBanding.left : 'Y'}`);
  if (edgeBanding.right) edges.push(`R:${typeof edgeBanding.right === 'string' ? edgeBanding.right : 'Y'}`);
  return edges.length > 0 ? edges.join(' | ') : 'None';
}

function getGrainDirectionDisplay(direction: 'length' | 'width' | 'none'): string {
  switch (direction) {
    case 'length': return '→ Length';
    case 'width': return '↓ Width';
    default: return '-';
  }
}

// ============================================
// Sub-Components
// ============================================

interface CoverPageProps {
  projectCode: string;
  customerName?: string;
  totalSheets: number;
  targetYield: number;
  totalParts: number;
  generatedAt: string;
  logoUrl?: string;
}

const CoverPage: React.FC<CoverPageProps> = ({ 
  projectCode, 
  customerName, 
  totalSheets, 
  targetYield,
  totalParts,
  generatedAt,
  logoUrl,
}) => (
  <View style={styles.coverContainer}>
    {/* Company Logo */}
    {logoUrl ? (
      <Image src={logoUrl} style={{ width: 180, height: 60, objectFit: 'contain', marginBottom: 30 }} />
    ) : (
      <Text style={styles.coverBrand}>DAWIN FINISHES</Text>
    )}
    
    <Text style={styles.coverTitle}>SHOP TRAVELER</Text>
    <Text style={styles.coverProjectCode}>{projectCode}</Text>
    {customerName && <Text style={styles.coverCustomer}>{customerName}</Text>}
    
    <View style={styles.coverStats}>
      <View style={styles.coverStat}>
        <Text style={styles.coverStatValue}>{totalSheets}</Text>
        <Text style={styles.coverStatLabel}>Sheets</Text>
      </View>
      <View style={styles.coverStat}>
        <Text style={styles.coverStatValue}>{totalParts}</Text>
        <Text style={styles.coverStatLabel}>Parts</Text>
      </View>
      <View style={styles.coverStat}>
        <Text style={styles.coverStatValue}>{targetYield.toFixed(1)}%</Text>
        <Text style={styles.coverStatLabel}>Yield</Text>
      </View>
    </View>
    
    <Text style={[styles.coverStatLabel, { marginTop: 40 }]}>
      Generated: {generatedAt}
    </Text>
  </View>
);

interface SheetHeaderProps {
  sheetNumber: number;
  totalSheets: number;
  material: string;
  dimensions: { length: number; width: number };
  utilizationPercent: number;
}

const SheetHeader: React.FC<SheetHeaderProps> = ({ 
  sheetNumber, 
  totalSheets, 
  material, 
  dimensions,
  utilizationPercent,
}) => (
  <View style={styles.sheetHeader}>
    <View>
      <Text style={styles.sheetNumber}>Sheet {sheetNumber} of {totalSheets}</Text>
      <Text style={styles.sheetMaterial}>{material}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.sheetDimensions}>
        {formatDimensions(dimensions.length, dimensions.width)}
      </Text>
      <Text style={[styles.sheetDimensions, { color: utilizationPercent >= 85 ? '#48bb78' : '#ed8936' }]}>
        {utilizationPercent.toFixed(1)}% utilization
      </Text>
    </View>
  </View>
);

interface NestingDiagramProps {
  sheet: NestingSheet;
  showEdgeBanding?: boolean;
  showGrainDirection?: boolean;
  showCutSequence?: boolean;
}

const NestingDiagram: React.FC<NestingDiagramProps> = ({ 
  sheet, 
  showEdgeBanding = true,
  showGrainDirection = true,
  showCutSequence = true,
}) => {
  const scale = calculateScale(sheet.sheetSize);
  const scaledWidth = sheet.sheetSize.length * scale;
  const scaledHeight = sheet.sheetSize.width * scale;
  
  // Filter and validate placements - only show parts that fit within sheet
  const validPlacements = sheet.placements.filter(part => 
    validatePartPlacement(part, sheet.sheetSize)
  );
  
  // Track if any parts were filtered out
  const invalidCount = sheet.placements.length - validPlacements.length;
  
  return (
    <View style={styles.diagram}>
      {invalidCount > 0 && (
        <Text style={{ fontSize: 8, color: BRAND.edgeThick, marginBottom: 4 }}>
          ⚠ {invalidCount} part(s) have invalid placements and are not shown
        </Text>
      )}
      <View style={[styles.sheetOutline, { width: scaledWidth, height: scaledHeight }]}>
        {/* Parts */}
        {validPlacements.map((part, index) => {
          // Dimensions are already placed dimensions (rotation already applied)
          // Use them directly - same as NestingStudio
          const partLength = part.length;  // Horizontal dimension on sheet
          const partWidth = part.width;    // Vertical dimension on sheet
          const scaledPartWidth = partLength * scale;
          const scaledPartHeight = partWidth * scale;
          
          // Clamp position to ensure part stays within sheet bounds visually
          const clampedX = Math.max(0, Math.min(part.x * scale, scaledWidth - scaledPartWidth));
          const clampedY = Math.max(0, Math.min(part.y * scale, scaledHeight - scaledPartHeight));
          
          return (
            <View 
              key={`${part.partId}-${index}`}
              style={[
                styles.part,
                {
                  left: clampedX,
                  top: clampedY,
                  width: Math.max(scaledPartWidth, 20), // Minimum size for visibility
                  height: Math.max(scaledPartHeight, 15),
                }
              ]}
            >
              <Text style={styles.partLabel}>{part.partName}</Text>
              <Text style={styles.partDimensions}>
                {part.length}×{part.width}
              </Text>
              
              {showCutSequence && (
                <Text style={styles.cutSequence}>{index + 1}</Text>
              )}
              
              {showGrainDirection && part.grainAligned && (
                <Text style={styles.grainArrow}>→</Text>
              )}
              
              {/* Edge banding indicators - offset from part edge, black lines for B&W printing */}
              {showEdgeBanding && part.edgeBanding && (
                <>
                  {part.edgeBanding.top && <View style={styles.edgeBandTop} />}
                  {part.edgeBanding.bottom && <View style={styles.edgeBandBottom} />}
                  {part.edgeBanding.left && <View style={styles.edgeBandLeft} />}
                  {part.edgeBanding.right && <View style={styles.edgeBandRight} />}
                </>
              )}
            </View>
          );
        })}
        
        {/* Waste regions / Remnants */}
        {sheet.wasteRegions?.filter(r => r.reusable).map((remnant, index) => (
          <View 
            key={`remnant-${index}`}
            style={[styles.remnant, {
              left: remnant.x * scale,
              top: remnant.y * scale,
              width: remnant.length * scale,
              height: remnant.width * scale,
            }]}
          >
            <Text style={styles.remnantLabel}>REMNANT</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

interface SheetPartsListProps {
  parts: PartPlacement[];
}

const SheetPartsList: React.FC<SheetPartsListProps> = ({ parts }) => {
  // Helper to get edge banding code from part data
  const getPartEdgeCode = (part: PartPlacement): string => {
    if (!part.edgeBanding) return '-';
    const codes: string[] = [];
    if (part.edgeBanding.top) codes.push('T');
    if (part.edgeBanding.bottom) codes.push('B');
    if (part.edgeBanding.left) codes.push('L');
    if (part.edgeBanding.right) codes.push('R');
    return codes.length > 0 ? codes.join('') : '-';
  };

  return (
    <View style={styles.partsList}>
      <View style={styles.partsListHeader}>
        <Text style={[styles.partsListCell, styles.partsListCellLabel, { fontWeight: 'bold' }]}>#</Text>
        <Text style={[styles.partsListCell, styles.partsListCellName, { fontWeight: 'bold' }]}>Part Name</Text>
        <Text style={[styles.partsListCell, styles.partsListCellItem, { fontWeight: 'bold' }]}>Design Item</Text>
        <Text style={[styles.partsListCell, styles.partsListCellDim, { fontWeight: 'bold' }]}>L × W (mm)</Text>
        <Text style={[styles.partsListCell, styles.partsListCellEdge, { fontWeight: 'bold' }]}>Edge</Text>
      </View>
      {parts.map((part, index) => (
        <View key={part.partId} style={[styles.partsListRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
          <Text style={[styles.partsListCell, styles.partsListCellLabel]}>{index + 1}</Text>
          <Text style={[styles.partsListCell, styles.partsListCellName]}>{part.partName}</Text>
          <Text style={[styles.partsListCell, styles.partsListCellItem]}>{part.designItemName}</Text>
          <Text style={[styles.partsListCell, styles.partsListCellDim]}>{part.length} × {part.width}</Text>
          <Text style={[styles.partsListCell, styles.partsListCellEdge]}>{getPartEdgeCode(part)}</Text>
        </View>
      ))}
    </View>
  );
};

interface EdgeBandingTableProps {
  parts: PartWithBanding[];
}

const EdgeBandingTable: React.FC<EdgeBandingTableProps> = ({ parts }) => {
  const totalBandingLength = parts.reduce((sum, p) => sum + p.bandingLength, 0);

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Part</Text>
        <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Design Item</Text>
        <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Dimensions</Text>
        <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Edges</Text>
        <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Length (mm)</Text>
      </View>
      
      {parts.map((part, index) => (
        <View key={`${part.partId}-${index}`} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
          <Text style={[styles.tableCell, { width: '25%' }]}>{part.partName}</Text>
          <Text style={[styles.tableCell, { width: '25%' }]}>{part.designItemName}</Text>
          <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
            {part.length} × {part.width}
          </Text>
          <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
            {getEdgeBandingCode(part.edgeBanding)}
          </Text>
          <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
            {part.bandingLength}
          </Text>
        </View>
      ))}
      
      {/* Total */}
      <View style={[styles.tableRow, { backgroundColor: '#edf2f7', borderTopWidth: 2, borderTopColor: '#2d3748' }]}>
        <Text style={[styles.tableCell, { width: '70%', fontWeight: 'bold' }]}>
          Total Edge Banding Required
        </Text>
        <Text style={[styles.tableCell, { width: '30%', textAlign: 'right', fontWeight: 'bold' }]}>
          {totalBandingLength} mm ({(totalBandingLength / 1000).toFixed(2)} m)
        </Text>
      </View>
    </View>
  );
};

interface RemnantTableProps {
  remnants: WasteRegion[];
  minimumUsable: { width: number; height: number };
}

const RemnantTable: React.FC<RemnantTableProps> = ({ remnants, minimumUsable }) => {
  const usableRemnants = remnants.filter(r => r.reusable);
  const totalRemnantArea = usableRemnants.reduce((sum, r) => sum + r.area, 0);
  const totalRemnantAreaSqM = totalRemnantArea / 1000000;
  
  return (
    <View>
      {/* Explanation of what remnants are */}
      <View style={{ marginBottom: 15, padding: 10, backgroundColor: BRAND.cashmereLight, borderRadius: 4 }}>
        <Text style={{ fontSize: 9, fontWeight: 600, color: BRAND.boysenberry, marginBottom: 4 }}>
          What is the Remnant Register?
        </Text>
        <Text style={{ fontSize: 7, color: BRAND.text, lineHeight: 1.4 }}>
          Remnants are leftover pieces of sheet material after cutting that are large enough to be reused in future projects. 
          This register tracks usable offcuts (minimum {minimumUsable.width}×{minimumUsable.height}mm) for inventory and cost savings. 
          Store remnants with their reference code for easy retrieval.
        </Text>
      </View>

      {usableRemnants.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 4 }}>
          <Text style={{ color: '#718096', fontSize: 9 }}>No reusable remnants from this production run</Text>
          <Text style={{ color: '#a0aec0', fontSize: 7, marginTop: 5 }}>
            All offcuts are smaller than the minimum usable size ({minimumUsable.width}×{minimumUsable.height}mm)
          </Text>
        </View>
      ) : (
        <>
          {/* Summary stats */}
          <View style={{ flexDirection: 'row', gap: 15, marginBottom: 12 }}>
            <View style={{ padding: 8, backgroundColor: BRAND.cashmereLight, borderRadius: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: 700, color: BRAND.pesto }}>{usableRemnants.length}</Text>
              <Text style={{ fontSize: 6, color: BRAND.textLight }}>Usable Pieces</Text>
            </View>
            <View style={{ padding: 8, backgroundColor: BRAND.cashmereLight, borderRadius: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: 700, color: BRAND.pesto }}>{totalRemnantAreaSqM.toFixed(2)} m²</Text>
              <Text style={{ fontSize: 6, color: BRAND.textLight }}>Total Area</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Ref</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Dimensions (mm)</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Area (m²)</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Sheet #</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Storage Location</Text>
            </View>
            
            {usableRemnants.map((remnant, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '10%', fontWeight: 600 }]}>R{index + 1}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>
                  {remnant.length} × {remnant.width}
                </Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
                  {(remnant.area / 1000000).toFixed(3)}
                </Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  —
                </Text>
                <Text style={[styles.tableCell, { width: '25%', fontStyle: 'italic', color: BRAND.textLight }]}>
                  ____________
                </Text>
              </View>
            ))}
          </View>
          
          <Text style={{ fontSize: 6, color: BRAND.textLight, marginTop: 8, fontStyle: 'italic' }}>
            Write storage location when remnant is stored. Reference code format: [Project]-R[#]
          </Text>
        </>
      )}
    </View>
  );
};

interface LabelSheetProps {
  parts: PartPlacement[];
  labelsPerRow?: number;
}

const LabelSheet: React.FC<LabelSheetProps> = ({ parts }) => {
  // Helper to get edge banding code from part data
  const getPartEdgeCode = (part: PartPlacement): string => {
    if (!part.edgeBanding) return '-';
    const codes: string[] = [];
    if (part.edgeBanding.top) codes.push('T');
    if (part.edgeBanding.bottom) codes.push('B');
    if (part.edgeBanding.left) codes.push('L');
    if (part.edgeBanding.right) codes.push('R');
    return codes.length > 0 ? codes.join('') : '-';
  };

  return (
    <View style={styles.labelGrid}>
      {parts.map((part) => (
        <View key={part.partId} style={styles.label}>
          <Text style={styles.labelCode}>{part.partId}</Text>
          <Text style={styles.labelName}>{part.partName}</Text>
          <Text style={styles.labelDim}>
            {part.length} × {part.width} mm
          </Text>
          <Text style={styles.labelName}>{part.designItemName}</Text>
          <Text style={styles.labelEdge}>Edge: {getPartEdgeCode(part)}</Text>
        </View>
      ))}
    </View>
  );
};

// ============================================
// Drawings Section Component
// ============================================

interface DrawingsSectionProps {
  designItems?: DesignItem[];
}

const DrawingsSection: React.FC<DrawingsSectionProps> = ({ designItems }) => {
  // Collect all drawings from design items
  const allDrawings: { file: DesignFile; itemName: string }[] = [];
  
  if (designItems) {
    for (const item of designItems) {
      if (item.files) {
        const drawings = item.files.filter(f => f.category === 'drawing');
        for (const drawing of drawings) {
          allDrawings.push({ file: drawing, itemName: item.name });
        }
      }
    }
  }

  if (allDrawings.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center', backgroundColor: BRAND.cashmereLight, borderRadius: 4 }}>
        <Text style={{ color: BRAND.textLight, fontSize: 9 }}>No drawings uploaded for this project</Text>
        <Text style={{ color: BRAND.textLight, fontSize: 7, marginTop: 4 }}>
          Upload drawings to design items to include them in the shop traveler
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ marginBottom: 12, padding: 8, backgroundColor: BRAND.cashmereLight, borderRadius: 4 }}>
        <Text style={{ fontSize: 8, color: BRAND.text }}>
          {allDrawings.length} drawing{allDrawings.length !== 1 ? 's' : ''} from {designItems?.length || 0} design item{(designItems?.length || 0) !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <View style={styles.drawingsGrid}>
        {allDrawings.map(({ file, itemName }, index) => (
          <View key={file.id || index} style={styles.drawingItem}>
            {/* Show image if it's an image type, otherwise show placeholder */}
            {file.mimeType?.startsWith('image/') ? (
              <Image src={file.url} style={styles.drawingImage} />
            ) : (
              <View style={[styles.drawingImage, { backgroundColor: BRAND.cashmereLight, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 10, color: BRAND.textLight }}>PDF/DXF</Text>
                <Text style={{ fontSize: 6, color: BRAND.textLight, marginTop: 2 }}>{file.name}</Text>
              </View>
            )}
            <Text style={styles.drawingLabel}>{file.name}</Text>
            <Text style={styles.drawingMeta}>From: {itemName}</Text>
            <Text style={styles.drawingMeta}>
              {file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'} • {(file.size / 1024).toFixed(1)} KB
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ============================================
// Main Component
// ============================================

export const ShopTraveler: React.FC<ShopTravelerProps> = ({ project, production, designItems, logoUrl }) => {
  const allParts = production.nestingSheets.flatMap(sheet => sheet.placements);
  const partsWithBanding = getAllPartsWithBanding(production.nestingSheets);
  const allRemnants = production.nestingSheets.flatMap(sheet => sheet.wasteRegions || []);
  
  // Calculate base page number after cutting maps
  const basePageAfterMaps = production.nestingSheets.length + 2;
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <CoverPage 
          projectCode={project.code}
          customerName={project.customerName}
          totalSheets={production.nestingSheets.length}
          targetYield={production.optimizedYield}
          totalParts={allParts.length}
          generatedAt={formatDate()}
          logoUrl={logoUrl}
        />
        <View style={styles.footer}>
          <Text style={styles.footerLeft}>Dawin Finishes</Text>
          <Text style={styles.footerRight}>Cover</Text>
        </View>
      </Page>
      
      {/* Cutting Maps - One per sheet */}
      {production.nestingSheets.map((sheet, index) => (
        <Page key={sheet.id} size="A4" style={styles.page}>
          <SheetHeader 
            sheetNumber={index + 1}
            totalSheets={production.nestingSheets.length}
            material={sheet.materialName}
            dimensions={sheet.sheetSize}
            utilizationPercent={sheet.utilizationPercent}
          />
          <NestingDiagram 
            sheet={sheet}
            showEdgeBanding={true}
            showGrainDirection={true}
            showCutSequence={true}
          />
          <SheetPartsList parts={sheet.placements} />
          <View style={styles.footer}>
            <Text>{project.code} - Sheet {index + 1}</Text>
            <Text style={styles.footerRight}>Page {index + 2}</Text>
          </View>
        </Page>
      ))}
      
      {/* Edge Banding Schedule */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Edge Banding Schedule</Text>
        <EdgeBandingTable parts={partsWithBanding} />
        <View style={styles.footer}>
          <Text>{project.code} - Edge Banding</Text>
          <Text style={styles.footerRight}>Page {basePageAfterMaps}</Text>
        </View>
      </Page>
      
      {/* Remnant Register */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Remnant Register</Text>
        <RemnantTable 
          remnants={allRemnants}
          minimumUsable={{ width: 200, height: 200 }}
        />
        <View style={styles.footer}>
          <Text>{project.code} - Remnants</Text>
          <Text style={styles.footerRight}>Page {basePageAfterMaps + 1}</Text>
        </View>
      </Page>
      
      {/* Consolidated Drawings */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Project Drawings</Text>
        <DrawingsSection designItems={designItems} />
        <View style={styles.footer}>
          <Text>{project.code} - Drawings</Text>
          <Text style={styles.footerRight}>Page {basePageAfterMaps + 2}</Text>
        </View>
      </Page>
      
      {/* Part Labels */}
      <Page size="A4" style={styles.labelPage}>
        <Text style={styles.sectionTitle}>Part Labels</Text>
        <LabelSheet parts={allParts} labelsPerRow={3} />
        <View style={styles.footer}>
          <Text>{project.code} - Labels</Text>
          <Text style={styles.footerRight}>Page {basePageAfterMaps + 3}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ShopTraveler;
