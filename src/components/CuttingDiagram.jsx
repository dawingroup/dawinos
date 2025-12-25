import React from 'react';

/**
 * SVG-based cutting diagram component
 * Renders a visual layout of panels on a stock sheet
 * Enhanced with edge banding indicators, grain direction, and waste visualization
 */
const CuttingDiagram = ({ 
  sheetLayout, 
  scale = 0.25, 
  showLabels = true,
  showDimensions = true,
  showEdgeBanding = true,
  showGrainPattern = true
}) => {
  if (!sheetLayout) return null;

  const { width, height, placements, freeRects } = sheetLayout;
  
  // Calculate SVG dimensions
  const svgWidth = width * scale;
  const svgHeight = height * scale;
  const padding = 40;

  // Dawin Finishes Brand Color scheme
  const colors = {
    horizontalGrain: '#e0f7fa', // Teal tint for horizontal grain
    verticalGrain: '#fdf2f7',   // Boysenberry tint for vertical grain
    noGrain: '#efe3d4',         // Cashmere light for no grain
    waste: '#F5F5F5',           // Light gray
    wasteUsable: '#fef7ed',     // Golden Bell tint for usable offcuts
    border: '#424242',          // Dark gray
    cutLine: '#872E5C',         // Boysenberry for cut lines
    text: '#212121',            // Near black
    dimension: '#757575',       // Gray
    edgeThick: '#E18425',       // Golden Bell for 2mm edge banding
    edgeThin: '#e89d4d',        // Golden Bell light for 0.4mm edge banding
    grainLine: 'rgba(135, 46, 92, 0.4)' // Boysenberry 40% for grain lines
  };

  // Edge banding style based on type
  const getEdgeStyle = (edgeType) => {
    if (!edgeType) return null;
    const type = String(edgeType).toLowerCase();
    if (type === '2mm' || type === '2' || type === 'thick') {
      return { stroke: colors.edgeThick, strokeWidth: 3 * scale * 4, strokeDasharray: 'none' };
    }
    if (type === '0.4mm' || type === '0.4' || type === 'thin') {
      return { stroke: colors.edgeThin, strokeWidth: 2 * scale * 4, strokeDasharray: `${5 * scale * 4},${3 * scale * 4}` };
    }
    // Default edge
    return { stroke: colors.edgeThin, strokeWidth: 2 * scale * 4, strokeDasharray: 'none' };
  };

  // Get panel color based on grain direction
  const getPanelColor = (panel) => {
    if (panel.grain === 0) return colors.horizontalGrain;
    if (panel.grain === 1) return colors.verticalGrain;
    return colors.noGrain;
  };

  // Generate letter label (A, B, C, ... AA, AB, etc.)
  const getLetterLabel = (index) => {
    if (index < 26) {
      return String.fromCharCode(65 + index);
    }
    const first = Math.floor(index / 26) - 1;
    const second = index % 26;
    return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
  };

  return (
    <div className="cutting-diagram">
      <svg 
        width={svgWidth + padding * 2} 
        height={svgHeight + padding * 2}
        className="border border-gray-300 bg-white rounded"
      >
        <defs>
          {/* Hatching pattern for waste areas */}
          <pattern 
            id={`waste-pattern-${sheetLayout.id}`}
            patternUnits="userSpaceOnUse" 
            width="8" 
            height="8"
          >
            <path 
              d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" 
              stroke="#E0E0E0" 
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <g transform={`translate(${padding}, ${padding})`}>
          {/* Stock sheet background */}
          <rect
            x={0}
            y={0}
            width={width * scale}
            height={height * scale}
            fill={colors.waste}
            stroke={colors.border}
            strokeWidth={2}
          />

          {/* Waste areas with hatching and dimensions */}
          {freeRects && freeRects.map((rect, i) => {
            const isUsable = rect.width >= 300 && rect.height >= 300;
            const minDim = Math.min(rect.width * scale, rect.height * scale);
            return (
              <g key={`waste-${i}`}>
                {/* Waste rectangle */}
                <rect
                  x={rect.x * scale}
                  y={rect.y * scale}
                  width={rect.width * scale}
                  height={rect.height * scale}
                  fill={isUsable ? colors.wasteUsable : colors.waste}
                  stroke="#BDBDBD"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
                {/* Hatching pattern overlay */}
                <rect
                  x={rect.x * scale}
                  y={rect.y * scale}
                  width={rect.width * scale}
                  height={rect.height * scale}
                  fill={`url(#waste-pattern-${sheetLayout.id})`}
                  opacity={0.5}
                />
                {/* Waste label and dimensions */}
                {minDim > 40 && (
                  <>
                    <text
                      x={(rect.x + rect.width / 2) * scale}
                      y={(rect.y + rect.height / 2 - 5) * scale}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.min(12, minDim * 0.15)}
                      fill="#757575"
                      fontWeight="bold"
                    >
                      {isUsable ? 'OFFCUT' : 'WASTE'}
                    </text>
                    <text
                      x={(rect.x + rect.width / 2) * scale}
                      y={(rect.y + rect.height / 2 + 8) * scale}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.min(10, minDim * 0.12)}
                      fill="#9E9E9E"
                    >
                      {Math.round(rect.width)}×{Math.round(rect.height)}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Placed panels */}
          {placements.map((placement, index) => {
            const { x, y, width: pWidth, height: pHeight, panel, rotated } = placement;
            const labelRef = getLetterLabel(index);
            const edges = panel.edges || panel.edgeBanding || {};
            const grainArrow = panel.grain === 1 ? '↕' : panel.grain === 0 ? '↔' : '';
            
            return (
              <g key={`panel-${index}`}>
                {/* Panel rectangle */}
                <rect
                  x={x * scale}
                  y={y * scale}
                  width={pWidth * scale}
                  height={pHeight * scale}
                  fill={getPanelColor(panel)}
                  stroke={colors.border}
                  strokeWidth={1.5}
                />

                {/* Grain direction pattern (multiple lines) */}
                {showGrainPattern && panel.grain !== undefined && (
                  <g opacity={0.15}>
                    {panel.grain === 0 ? (
                      // Horizontal grain lines
                      Array.from({ length: Math.floor(pHeight / 25) }).map((_, j) => (
                        <line
                          key={`h-grain-${j}`}
                          x1={(x + 8) * scale}
                          y1={(y + 12 + j * 25) * scale}
                          x2={(x + pWidth - 8) * scale}
                          y2={(y + 12 + j * 25) * scale}
                          stroke={colors.grainLine}
                          strokeWidth={1}
                        />
                      ))
                    ) : panel.grain === 1 ? (
                      // Vertical grain lines
                      Array.from({ length: Math.floor(pWidth / 25) }).map((_, j) => (
                        <line
                          key={`v-grain-${j}`}
                          x1={(x + 12 + j * 25) * scale}
                          y1={(y + 8) * scale}
                          x2={(x + 12 + j * 25) * scale}
                          y2={(y + pHeight - 8) * scale}
                          stroke={colors.grainLine}
                          strokeWidth={1}
                        />
                      ))
                    ) : null}
                  </g>
                )}

                {/* Edge banding indicators */}
                {showEdgeBanding && (
                  <g>
                    {/* Top edge */}
                    {edges.top && (() => {
                      const style = getEdgeStyle(edges.top);
                      return style && (
                        <line
                          x1={(x + 5) * scale}
                          y1={(y + 3) * scale}
                          x2={(x + pWidth - 5) * scale}
                          y2={(y + 3) * scale}
                          stroke={style.stroke}
                          strokeWidth={style.strokeWidth}
                          strokeDasharray={style.strokeDasharray}
                          strokeLinecap="round"
                        />
                      );
                    })()}
                    {/* Bottom edge */}
                    {edges.bottom && (() => {
                      const style = getEdgeStyle(edges.bottom);
                      return style && (
                        <line
                          x1={(x + 5) * scale}
                          y1={(y + pHeight - 3) * scale}
                          x2={(x + pWidth - 5) * scale}
                          y2={(y + pHeight - 3) * scale}
                          stroke={style.stroke}
                          strokeWidth={style.strokeWidth}
                          strokeDasharray={style.strokeDasharray}
                          strokeLinecap="round"
                        />
                      );
                    })()}
                    {/* Left edge */}
                    {edges.left && (() => {
                      const style = getEdgeStyle(edges.left);
                      return style && (
                        <line
                          x1={(x + 3) * scale}
                          y1={(y + 5) * scale}
                          x2={(x + 3) * scale}
                          y2={(y + pHeight - 5) * scale}
                          stroke={style.stroke}
                          strokeWidth={style.strokeWidth}
                          strokeDasharray={style.strokeDasharray}
                          strokeLinecap="round"
                        />
                      );
                    })()}
                    {/* Right edge */}
                    {edges.right && (() => {
                      const style = getEdgeStyle(edges.right);
                      return style && (
                        <line
                          x1={(x + pWidth - 3) * scale}
                          y1={(y + 5) * scale}
                          x2={(x + pWidth - 3) * scale}
                          y2={(y + pHeight - 5) * scale}
                          stroke={style.stroke}
                          strokeWidth={style.strokeWidth}
                          strokeDasharray={style.strokeDasharray}
                          strokeLinecap="round"
                        />
                      );
                    })()}
                  </g>
                )}

                {/* Panel label */}
                {showLabels && pWidth * scale > 30 && pHeight * scale > 20 && (
                  <g>
                    {/* Label background */}
                    <rect
                      x={(x + pWidth / 2 - 18) * scale}
                      y={(y + pHeight / 2 - 14) * scale}
                      width={36 * scale}
                      height={28 * scale}
                      fill="rgba(255,255,255,0.92)"
                      rx={3}
                    />
                    {/* Reference letter and label */}
                    <text
                      x={(x + pWidth / 2) * scale}
                      y={(y + pHeight / 2 - 4) * scale}
                      textAnchor="middle"
                      fontSize={Math.min(12, pWidth * scale * 0.12)}
                      fontWeight="bold"
                      fill={colors.text}
                    >
                      {labelRef}: {panel.label || panel.cabinet || ''}
                    </text>
                    {/* Dimensions */}
                    {showDimensions && pWidth * scale > 50 && (
                      <text
                        x={(x + pWidth / 2) * scale}
                        y={(y + pHeight / 2 + 8) * scale}
                        textAnchor="middle"
                        fontSize={Math.min(9, pWidth * scale * 0.08)}
                        fill={colors.dimension}
                      >
                        {panel.length || pWidth}×{panel.width || pHeight}
                      </text>
                    )}
                    {/* Grain direction arrow */}
                    {grainArrow && pWidth * scale > 40 && (
                      <text
                        x={(x + pWidth / 2) * scale}
                        y={(y + pHeight / 2 + 18) * scale}
                        textAnchor="middle"
                        fontSize={Math.min(14, pWidth * scale * 0.12)}
                        fill={colors.dimension}
                      >
                        {grainArrow}
                      </text>
                    )}
                  </g>
                )}

                {/* Rotation indicator */}
                {rotated && pWidth * scale > 40 && (
                  <text
                    x={(x + 5) * scale}
                    y={(y + 12) * scale}
                    fontSize={10}
                    fill="#FF9800"
                    fontWeight="bold"
                  >
                    ↻
                  </text>
                )}
              </g>
            );
          })}

          {/* Dimension annotations */}
          {showDimensions && (
            <>
              {/* Width dimension (bottom) */}
              <g transform={`translate(0, ${height * scale + 15})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={width * scale}
                  y2={0}
                  stroke={colors.dimension}
                  strokeWidth={1}
                  markerStart="url(#arrow)"
                  markerEnd="url(#arrow)"
                />
                <text
                  x={width * scale / 2}
                  y={15}
                  textAnchor="middle"
                  fontSize={11}
                  fill={colors.dimension}
                >
                  {width} mm
                </text>
              </g>

              {/* Height dimension (right) */}
              <g transform={`translate(${width * scale + 15}, 0)`}>
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={height * scale}
                  stroke={colors.dimension}
                  strokeWidth={1}
                />
                <text
                  x={15}
                  y={height * scale / 2}
                  textAnchor="middle"
                  fontSize={11}
                  fill={colors.dimension}
                  transform={`rotate(90, 15, ${height * scale / 2})`}
                >
                  {height} mm
                </text>
              </g>
            </>
          )}
        </g>
      </svg>
    </div>
  );
};

export default CuttingDiagram;
