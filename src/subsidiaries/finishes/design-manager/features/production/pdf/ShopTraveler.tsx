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

// Standard part entry (hinges, screws, edging from Katana)
export interface StandardPartEntry {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  designItemId: string;
  designItemName: string;
}

// Special part entry (luxury/approved items)
export interface SpecialPartEntry {
  id: string;
  name: string;
  category: string;
  quantity: number;
  supplier: string;
  costing?: {
    currency: string;
    unitCost: number;
    totalLandedCost: number;
  };
  designItemId: string;
  designItemName: string;
}

interface ShopTravelerProps {
  project: Project;
  production: ProductionResult;
  options?: ShopTravelerOptions;
  standardParts?: StandardPartEntry[];
  specialParts?: SpecialPartEntry[];
  designItems?: DesignItem[];  // For accessing drawings
  logoUrl?: string;  // Dawin Finishes logo URL from subsidiary branding
}

export interface ShopTravelerOptions {
  includeCoverPage?: boolean;
  includeCuttingMaps?: boolean;
  includeEdgeBanding?: boolean;
  includeRemnants?: boolean;
  includeLabels?: boolean;
  includeStandardParts?: boolean;
  includeSpecialParts?: boolean;
  includeQCCheckboxes?: boolean;
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
  // Edge banding indicators - offset from edge, using dashed pattern via segments
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

function calculateScale(sheetSize: { length: number; width: number }, maxWidth = 480, maxHeight = 320): number {
  // Ensure we have valid sheet dimensions
  const sheetLength = Math.max(sheetSize.length || 2440, 100);
  const sheetWidth = Math.max(sheetSize.width || 1220, 100);
  
  const scaleX = maxWidth / sheetLength;
  const scaleY = maxHeight / sheetWidth;
  
  // Use the smaller scale to ensure the diagram fits within bounds
  // No arbitrary cap - let it scale naturally based on available space
  return Math.min(scaleX, scaleY);
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
  // Ensure valid sheet dimensions
  const sheetLength = Math.max(sheet.sheetSize?.length || 2440, 100);
  const sheetWidth = Math.max(sheet.sheetSize?.width || 1220, 100);
  
  const scale = calculateScale({ length: sheetLength, width: sheetWidth });
  const scaledSheetWidth = sheetLength * scale;
  const scaledSheetHeight = sheetWidth * scale;
  
  return (
    <View style={styles.diagram}>
      <View style={[styles.sheetOutline, { width: scaledSheetWidth, height: scaledSheetHeight }]}>
        {/* Parts */}
        {sheet.placements.map((part, index) => {
          // Dimensions are already placed dimensions (rotation already applied)
          // Use them directly - same as NestingStudio
          const partLength = part.length;  // Horizontal dimension on sheet
          const partWidth = part.width;    // Vertical dimension on sheet
          
          // Clamp part position and size to stay within sheet bounds
          const partX = Math.max(0, Math.min(part.x || 0, sheetLength - partLength));
          const partY = Math.max(0, Math.min(part.y || 0, sheetWidth - partWidth));
          const clampedLength = Math.min(partLength, sheetLength - partX);
          const clampedWidth = Math.min(partWidth, sheetWidth - partY);
          
          // Scale for rendering
          const scaledPartWidth = clampedLength * scale;
          const scaledPartHeight = clampedWidth * scale;
          const scaledX = partX * scale;
          const scaledY = partY * scale;
          
          // Skip parts that are too small to render
          if (scaledPartWidth < 2 || scaledPartHeight < 2) return null;
          
          // Use unique key: partId + index + position to ensure no duplicates
          const uniqueKey = `${part.partId}-${index}-${partX}-${partY}`;
          
          return (
            <View 
              key={uniqueKey}
              style={[
                styles.part,
                {
                  left: scaledX,
                  top: scaledY,
                  width: scaledPartWidth,
                  height: scaledPartHeight,
                }
              ]}
            >
              {scaledPartWidth > 20 && scaledPartHeight > 15 && (
                <Text style={styles.partLabel}>{part.partName}</Text>
              )}
              {scaledPartWidth > 30 && scaledPartHeight > 20 && (
                <Text style={styles.partDimensions}>
                  {part.length}×{part.width}
                </Text>
              )}
              
              {showCutSequence && (
                <Text style={styles.cutSequence}>{index + 1}</Text>
              )}
              
              {showGrainDirection && part.grainAligned && scaledPartWidth > 15 && (
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
        
        {/* Waste regions / Offcuts */}
        {sheet.wasteRegions?.filter(r => r.reusable).map((offcut, index) => {
          const offcutX = Math.max(0, offcut.x || 0) * scale;
          const offcutY = Math.max(0, offcut.y || 0) * scale;
          const offcutW = Math.min(offcut.length, sheetLength) * scale;
          const offcutH = Math.min(offcut.width, sheetWidth) * scale;
          
          if (offcutW < 5 || offcutH < 5) return null;
          
          return (
            <View 
              key={`offcut-${index}`}
              style={[styles.remnant, {
                left: offcutX,
                top: offcutY,
                width: offcutW,
                height: offcutH,
              }]}
            >
              {offcutW > 30 && offcutH > 15 && (
                <Text style={styles.remnantLabel}>OFFCUT</Text>
              )}
            </View>
          );
        })}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: BRAND.seaform }]} />
          <Text style={styles.legendText}>Edge Banding</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: BRAND.cashmereLight, borderWidth: 1, borderColor: BRAND.pesto, borderStyle: 'dashed' }]} />
          <Text style={styles.legendText}>Reusable Offcut</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.legendText, { color: BRAND.grainArrow }]}>→</Text>
          <Text style={styles.legendText}>Grain Direction</Text>
        </View>
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
        <View key={`${part.partId}-${index}`} style={[styles.partsListRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
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

interface OffcutTableProps {
  offcuts: WasteRegion[];
  minimumUsable: { width: number; height: number };
}

const OffcutTable: React.FC<OffcutTableProps> = ({ offcuts, minimumUsable }) => {
  const usableOffcuts = offcuts.filter(r => r.reusable);
  
  if (usableOffcuts.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: '#718096' }}>No reusable offcuts above minimum size</Text>
        <Text style={{ color: '#a0aec0', fontSize: 8, marginTop: 5 }}>
          (Minimum: {minimumUsable.width} × {minimumUsable.height} mm)
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '15%' }]}>#</Text>
        <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Dimensions (mm)</Text>
        <Text style={[styles.tableHeaderCell, { width: '35%', textAlign: 'right' }]}>Area (m²)</Text>
      </View>
      
      {usableOffcuts.map((offcut, index) => (
        <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
          <Text style={[styles.tableCell, { width: '15%' }]}>O{index + 1}</Text>
          <Text style={[styles.tableCell, { width: '50%' }]}>
            {offcut.length} × {offcut.width}
          </Text>
          <Text style={[styles.tableCell, { width: '35%', textAlign: 'right' }]}>
            {(offcut.area / 1000000).toFixed(3)} m²
          </Text>
        </View>
      ))}
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
      {parts.map((part, index) => (
        <View key={`${part.partId}-${index}`} style={styles.label}>
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

export const ShopTraveler: React.FC<ShopTravelerProps> = ({ 
  project, 
  production, 
  options = {},
  standardParts = [],
  specialParts = [],
  designItems = [],
  logoUrl,
}) => {
  // Default all sections to true if not specified
  const {
    includeCoverPage = true,
    includeCuttingMaps = true,
    includeEdgeBanding = true,
    includeRemnants = true,
    includeLabels = true,
    includeStandardParts = true,
    includeSpecialParts = true,
    includeQCCheckboxes = false,
  } = options;

  const allParts = production.nestingSheets.flatMap(sheet => sheet.placements);
  const partsWithBanding = getAllPartsWithBanding(production.nestingSheets);
  const allRemnants = production.nestingSheets.flatMap(sheet => sheet.wasteRegions || []);
  
  // Calculate page numbers dynamically based on included sections
  let pageNumber = 0;
  const getNextPage = () => ++pageNumber;
  
  return (
    <Document>
      {/* Cover Page */}
      {includeCoverPage && (
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
          {(project as any).notes && (
            <View style={{ marginTop: 20, padding: 12, backgroundColor: BRAND.cashmereLight, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: 600, color: BRAND.boysenberry, marginBottom: 4 }}>Project Notes:</Text>
              <Text style={{ fontSize: 8, color: BRAND.text }}>{(project as any).notes}</Text>
            </View>
          )}
          <View style={styles.footer}>
            <Text style={styles.footerLeft}>DAWIN FINISHES</Text>
            <Text style={styles.footerCenter}>Generated: {formatDate()}</Text>
            <Text style={styles.footerRight}>Cover</Text>
          </View>
        </Page>
      )}
      
      {/* Cutting Maps - One per sheet */}
      {includeCuttingMaps && production.nestingSheets.map((sheet, index) => {
        const currentPage = getNextPage();
        return (
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
            
            {/* QC Checkboxes */}
            {includeQCCheckboxes && (
              <View style={{ marginTop: 12, padding: 10, backgroundColor: BRAND.cashmereLight, borderRadius: 4 }}>
                <Text style={{ fontSize: 8, fontWeight: 600, color: BRAND.boysenberry, marginBottom: 6 }}>QC Sign-off:</Text>
                <View style={{ flexDirection: 'row', gap: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 12, height: 12, borderWidth: 1, borderColor: BRAND.text }} />
                    <Text style={{ fontSize: 7, color: BRAND.text }}>Cut Complete</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 12, height: 12, borderWidth: 1, borderColor: BRAND.text }} />
                    <Text style={{ fontSize: 7, color: BRAND.text }}>Edges Applied</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 12, height: 12, borderWidth: 1, borderColor: BRAND.text }} />
                    <Text style={{ fontSize: 7, color: BRAND.text }}>QC Passed</Text>
                  </View>
                  <Text style={{ fontSize: 7, color: BRAND.textLight, marginLeft: 'auto' }}>Initials: ________</Text>
                </View>
              </View>
            )}
            
            <View style={styles.footer}>
              <Text style={styles.footerLeft}>{project.code}</Text>
              <Text style={styles.footerCenter}>Sheet {index + 1} of {production.nestingSheets.length}</Text>
              <Text style={styles.footerRight}>Page {currentPage}</Text>
            </View>
          </Page>
        );
      })}
      
      {/* Edge Banding Schedule */}
      {includeEdgeBanding && (
        <Page size="A4" style={styles.page}>
          <View style={styles.sectionTitleBar}>
            <Text style={styles.sectionTitleText}>Edge Banding Schedule</Text>
          </View>
          <EdgeBandingTable parts={partsWithBanding} />
          <View style={styles.footer}>
            <Text style={styles.footerLeft}>{project.code}</Text>
            <Text style={styles.footerCenter}>Edge Banding</Text>
            <Text style={styles.footerRight}>Page {getNextPage()}</Text>
          </View>
        </Page>
      )}
      
      {/* Offcut Register */}
      {includeRemnants && (
        <Page size="A4" style={styles.page}>
          <View style={styles.sectionTitleBar}>
            <Text style={styles.sectionTitleText}>Offcut Register</Text>
          </View>
          <OffcutTable 
            offcuts={allRemnants}
            minimumUsable={{ width: 200, height: 200 }}
          />
          <View style={styles.footer}>
            <Text style={styles.footerLeft}>{project.code}</Text>
            <Text style={styles.footerCenter}>Offcuts</Text>
            <Text style={styles.footerRight}>Page {getNextPage()}</Text>
          </View>
        </Page>
      )}
      
      {/* Standard Parts (Hinges, Screws, Edging) */}
      {includeStandardParts && standardParts.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.sectionTitleBar}>
            <Text style={styles.sectionTitleText}>Standard Parts (Consumables)</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '8%' }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Category</Text>
              <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Name</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Design Item</Text>
              <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'right' }]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'right' }]}>Cost</Text>
            </View>
            {standardParts.map((part, index) => (
              <View key={part.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '8%' }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { width: '12%', textTransform: 'capitalize' }]}>{part.category}</Text>
                <Text style={[styles.tableCell, { width: '35%' }]}>{part.name}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{part.designItemName}</Text>
                <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{part.quantity}</Text>
                <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>
                  {(part.quantity * part.unitCost).toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={[styles.tableRow, { backgroundColor: BRAND.cashmereLight }]}>
              <Text style={[styles.tableCell, { width: '80%', fontWeight: 'bold' }]}>
                Total Standard Parts
              </Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right', fontWeight: 'bold' }]}>
                {standardParts.reduce((sum, p) => sum + p.quantity, 0)}
              </Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right', fontWeight: 'bold' }]}>
                {standardParts.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerLeft}>{project.code}</Text>
            <Text style={styles.footerCenter}>Standard Parts</Text>
            <Text style={styles.footerRight}>Page {getNextPage()}</Text>
          </View>
        </Page>
      )}

      {/* Special Parts (Luxury/Approved Items) */}
      {includeSpecialParts && specialParts.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.sectionTitleBar}>
            <Text style={styles.sectionTitleText}>Special Parts (Approved Items)</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '8%' }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Category</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Name</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Supplier</Text>
              <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'right' }]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Landed Cost</Text>
            </View>
            {specialParts.map((part, index) => (
              <View key={part.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '8%' }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { width: '12%', textTransform: 'capitalize' }]}>{part.category}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{part.name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{part.supplier || '-'}</Text>
                <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{part.quantity}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
                  {part.costing?.totalLandedCost 
                    ? `${part.costing.totalLandedCost.toLocaleString()}`
                    : 'TBD'}
                </Text>
              </View>
            ))}
            <View style={[styles.tableRow, { backgroundColor: BRAND.cashmereLight }]}>
              <Text style={[styles.tableCell, { width: '70%', fontWeight: 'bold' }]}>
                Total Special Parts
              </Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right', fontWeight: 'bold' }]}>
                {specialParts.reduce((sum, p) => sum + p.quantity, 0)}
              </Text>
              <Text style={[styles.tableCell, { width: '20%', textAlign: 'right', fontWeight: 'bold' }]}>
                {specialParts.reduce((sum, p) => sum + (p.costing?.totalLandedCost || 0), 0).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerLeft}>{project.code}</Text>
            <Text style={styles.footerCenter}>Special Parts</Text>
            <Text style={styles.footerRight}>Page {getNextPage()}</Text>
          </View>
        </Page>
      )}

      {/* Project Drawings */}
      <Page size="A4" style={styles.page}>
        <View style={styles.sectionTitleBar}>
          <Text style={styles.sectionTitleText}>Project Drawings</Text>
        </View>
        <DrawingsSection designItems={designItems} />
        <View style={styles.footer}>
          <Text style={styles.footerLeft}>{project.code}</Text>
          <Text style={styles.footerCenter}>Drawings</Text>
          <Text style={styles.footerRight}>Page {getNextPage()}</Text>
        </View>
      </Page>

      {/* Part Labels */}
      {includeLabels && (
        <Page size="A4" style={styles.labelPage}>
          <View style={styles.sectionTitleBar}>
            <Text style={styles.sectionTitleText}>Part Labels</Text>
          </View>
          <LabelSheet parts={allParts} labelsPerRow={3} />
          <View style={styles.footer}>
            <Text style={styles.footerLeft}>{project.code}</Text>
            <Text style={styles.footerCenter}>Labels</Text>
            <Text style={styles.footerRight}>Page {getNextPage()}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export default ShopTraveler;
