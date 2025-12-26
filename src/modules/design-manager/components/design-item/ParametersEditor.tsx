/**
 * Parameters Editor Component
 * Comprehensive form for editing design item parameters
 */

import { useState, useEffect, useMemo } from 'react';
import { Save, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, Database, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { 
  DesignParameters, 
  MaterialSpec, 
  HardwareSpec, 
  FinishSpec, 
  EdgeBandingSpec,
  ConstructionMethod,
  JoineryType 
} from '../../types';

export interface ParametersEditorProps {
  parameters: DesignParameters;
  onSave: (parameters: DesignParameters) => Promise<void>;
  isReadOnly?: boolean;
  className?: string;
}

// Default empty parameters
const DEFAULT_PARAMETERS: DesignParameters = {
  dimensions: { width: null, height: null, depth: null, unit: 'mm' },
  primaryMaterial: null,
  secondaryMaterials: [],
  edgeBanding: null,
  hardware: [],
  finish: null,
  constructionMethod: 'frameless',
  joineryTypes: [],
  awiGrade: 'custom',
  specialRequirements: [],
};

// Options for dropdowns
const CONSTRUCTION_METHODS: { value: ConstructionMethod; label: string }[] = [
  { value: 'frameless', label: 'Frameless (European/32mm)' },
  { value: 'face-frame', label: 'Face Frame (Traditional)' },
  { value: 'post-and-rail', label: 'Post and Rail' },
  { value: 'solid-wood', label: 'Solid Wood' },
  { value: 'mixed', label: 'Mixed Construction' },
];

const JOINERY_TYPES: { value: JoineryType; label: string }[] = [
  { value: 'dowel', label: 'Dowel' },
  { value: 'biscuit', label: 'Biscuit' },
  { value: 'pocket-screw', label: 'Pocket Screw' },
  { value: 'mortise-tenon', label: 'Mortise & Tenon' },
  { value: 'dovetail', label: 'Dovetail' },
  { value: 'rabbet-dado', label: 'Rabbet & Dado' },
  { value: 'cam-lock', label: 'Cam Lock' },
  { value: 'confirmat', label: 'Confirmat Screw' },
  { value: 'glue-only', label: 'Glue Only' },
];

const MATERIAL_TYPES = ['sheet', 'solid', 'veneer', 'laminate', 'other'] as const;
const HARDWARE_CATEGORIES = ['hinges', 'slides', 'handles', 'locks', 'connectors', 'other'] as const;
const FINISH_TYPES = ['paint', 'stain', 'lacquer', 'oil', 'veneer', 'laminate', 'none'] as const;
const SHEEN_OPTIONS = ['flat', 'matte', 'satin', 'semi-gloss', 'gloss'] as const;
const AWI_GRADES = [
  { value: 'economy', label: 'Economy' },
  { value: 'custom', label: 'Custom' },
  { value: 'premium', label: 'Premium' },
] as const;

// Katana material from API
interface KatanaMaterial {
  id: string;
  name: string;
  sku: string;
  type: string;
  thickness: number;
}

export function ParametersEditor({
  parameters: initialParameters,
  onSave,
  isReadOnly = false,
  className,
}: ParametersEditorProps) {
  const [params, setParams] = useState<DesignParameters>({
    ...DEFAULT_PARAMETERS,
    ...initialParameters,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['dimensions', 'materials', 'hardware', 'finish', 'construction', 'katana'])
  );
  const [newRequirement, setNewRequirement] = useState('');
  
  // Katana materials state
  const [katanaMaterials, setKatanaMaterials] = useState<KatanaMaterial[]>([]);
  const [loadingKatana, setLoadingKatana] = useState(false);
  const [katanaError, setKatanaError] = useState<string | null>(null);
  const [katanaSearch, setKatanaSearch] = useState('');
  const [katanaPage, setKatanaPage] = useState(1);
  const KATANA_PAGE_SIZE = 10;

  // Filter Katana materials based on search
  const filteredKatanaMaterials = useMemo(() => {
    if (!katanaSearch.trim()) return katanaMaterials;
    const search = katanaSearch.toLowerCase();
    return katanaMaterials.filter(m => 
      m.name.toLowerCase().includes(search) ||
      m.sku.toLowerCase().includes(search) ||
      m.type.toLowerCase().includes(search)
    );
  }, [katanaMaterials, katanaSearch]);

  // Paginated Katana materials
  const paginatedKatanaMaterials = useMemo(() => {
    const startIndex = (katanaPage - 1) * KATANA_PAGE_SIZE;
    return filteredKatanaMaterials.slice(startIndex, startIndex + KATANA_PAGE_SIZE);
  }, [filteredKatanaMaterials, katanaPage]);

  const totalKatanaPages = Math.ceil(filteredKatanaMaterials.length / KATANA_PAGE_SIZE);

  // Reset page when search changes
  useEffect(() => {
    setKatanaPage(1);
  }, [katanaSearch]);

  // Fetch Katana materials on mount
  useEffect(() => {
    fetchKatanaMaterials();
  }, []);

  const fetchKatanaMaterials = async () => {
    setLoadingKatana(true);
    setKatanaError(null);
    try {
      const response = await fetch('https://api-okekivpl2a-uc.a.run.app/api/katana/get-materials');
      const data = await response.json();
      if (data.success) {
        setKatanaMaterials(data.materials);
      } else {
        setKatanaError('Failed to fetch materials');
      }
    } catch (error) {
      setKatanaError('Connection error');
      console.error('Failed to fetch Katana materials:', error);
    } finally {
      setLoadingKatana(false);
    }
  };

  const selectKatanaMaterial = (material: KatanaMaterial) => {
    setParams(prev => ({
      ...prev,
      primaryMaterial: {
        id: material.id,
        name: material.name,
        type: material.type as any,
        thickness: material.thickness,
        supplier: 'Katana MRP',
        sku: material.sku,
        katanaMaterialId: material.id,
        grainDirection: false,
        estimatedCostPerUnit: null,
      },
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(params);
    } finally {
      setIsSaving(false);
    }
  };

  const updateDimensions = (field: 'width' | 'height' | 'depth', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setParams(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [field]: numValue },
    }));
  };

  const updatePrimaryMaterial = (field: keyof MaterialSpec, value: any) => {
    setParams(prev => ({
      ...prev,
      primaryMaterial: prev.primaryMaterial 
        ? { ...prev.primaryMaterial, [field]: value }
        : { id: crypto.randomUUID(), name: '', type: 'sheet', thickness: 18, supplier: null, sku: null, katanaMaterialId: null, grainDirection: false, estimatedCostPerUnit: null, [field]: value },
    }));
  };

  const addHardware = () => {
    const newHardware: HardwareSpec = {
      id: crypto.randomUUID(),
      name: '',
      category: 'hinges',
      quantity: 1,
      supplier: null,
      sku: null,
      katanaMaterialId: null,
      estimatedCostPerUnit: null,
    };
    setParams(prev => ({
      ...prev,
      hardware: [...prev.hardware, newHardware],
    }));
  };

  const updateHardware = (index: number, field: keyof HardwareSpec, value: any) => {
    setParams(prev => ({
      ...prev,
      hardware: prev.hardware.map((h, i) => i === index ? { ...h, [field]: value } : h),
    }));
  };

  const removeHardware = (index: number) => {
    setParams(prev => ({
      ...prev,
      hardware: prev.hardware.filter((_, i) => i !== index),
    }));
  };

  const updateFinish = (field: keyof FinishSpec, value: any) => {
    setParams(prev => ({
      ...prev,
      finish: prev.finish
        ? { ...prev.finish, [field]: value }
        : { type: 'paint', color: null, sheen: 'satin', coats: 2, brand: null, productCode: null, [field]: value },
    }));
  };

  const toggleJoinery = (joinery: JoineryType) => {
    setParams(prev => ({
      ...prev,
      joineryTypes: prev.joineryTypes.includes(joinery)
        ? prev.joineryTypes.filter(j => j !== joinery)
        : [...prev.joineryTypes, joinery],
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setParams(prev => ({
        ...prev,
        specialRequirements: [...prev.specialRequirements, newRequirement.trim()],
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setParams(prev => ({
      ...prev,
      specialRequirements: prev.specialRequirements.filter((_, i) => i !== index),
    }));
  };

  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <h3 className="font-medium text-gray-900">{title}</h3>
      {expandedSections.has(section) ? (
        <ChevronUp className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dimensions Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader title="📐 Dimensions" section="dimensions" />
        {expandedSections.has('dimensions') && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                <div className="flex">
                  <input
                    type="number"
                    value={params.dimensions.width ?? ''}
                    onChange={e => updateDimensions('width', e.target.value)}
                    disabled={isReadOnly}
                    className="flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                    placeholder="0"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-gray-600">
                    {params.dimensions.unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                <div className="flex">
                  <input
                    type="number"
                    value={params.dimensions.height ?? ''}
                    onChange={e => updateDimensions('height', e.target.value)}
                    disabled={isReadOnly}
                    className="flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                    placeholder="0"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-gray-600">
                    {params.dimensions.unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Depth</label>
                <div className="flex">
                  <input
                    type="number"
                    value={params.dimensions.depth ?? ''}
                    onChange={e => updateDimensions('depth', e.target.value)}
                    disabled={isReadOnly}
                    className="flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                    placeholder="0"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-gray-600">
                    {params.dimensions.unit}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={params.dimensions.unit}
                onChange={e => setParams(prev => ({ ...prev, dimensions: { ...prev.dimensions, unit: e.target.value as 'mm' | 'inches' } }))}
                disabled={isReadOnly}
                className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
              >
                <option value="mm">mm</option>
                <option value="inches">inches</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Primary Material Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader title="🪵 Materials" section="materials" />
        {expandedSections.has('materials') && (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-gray-700">Primary Material</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={params.primaryMaterial?.name ?? ''}
                  onChange={e => updatePrimaryMaterial('name', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                  placeholder="e.g., 3/4 Baltic Birch Plywood"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={params.primaryMaterial?.type ?? 'sheet'}
                  onChange={e => updatePrimaryMaterial('type', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                >
                  {MATERIAL_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
                <input
                  type="number"
                  value={params.primaryMaterial?.thickness ?? ''}
                  onChange={e => updatePrimaryMaterial('thickness', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                  placeholder="18"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={params.primaryMaterial?.supplier ?? ''}
                  onChange={e => updatePrimaryMaterial('supplier', e.target.value || null)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Supplier name"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="grainDirection"
                checked={params.primaryMaterial?.grainDirection ?? false}
                onChange={e => updatePrimaryMaterial('grainDirection', e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4 text-[#1d1d1f] rounded focus:ring-[#1d1d1f]"
              />
              <label htmlFor="grainDirection" className="text-sm text-gray-700">Grain direction matters</label>
            </div>
          </div>
        )}
      </div>

      {/* Hardware Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader title="🔧 Hardware" section="hardware" />
        {expandedSections.has('hardware') && (
          <div className="p-4 space-y-4">
            {params.hardware.map((hw, index) => (
              <div key={hw.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Hardware #{index + 1}</span>
                  {!isReadOnly && (
                    <button
                      onClick={() => removeHardware(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={hw.name}
                    onChange={e => updateHardware(index, 'name', e.target.value)}
                    disabled={isReadOnly}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Hardware name"
                  />
                  <select
                    value={hw.category}
                    onChange={e => updateHardware(index, 'category', e.target.value)}
                    disabled={isReadOnly}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                  >
                    {HARDWARE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={hw.quantity}
                    onChange={e => updateHardware(index, 'quantity', parseInt(e.target.value) || 1)}
                    disabled={isReadOnly}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Qty"
                    min="1"
                  />
                  <input
                    type="text"
                    value={hw.sku ?? ''}
                    onChange={e => updateHardware(index, 'sku', e.target.value || null)}
                    disabled={isReadOnly}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                    placeholder="SKU"
                  />
                </div>
              </div>
            ))}
            {!isReadOnly && (
              <button
                onClick={addHardware}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1d1d1f] border border-[#1d1d1f] rounded-lg hover:bg-[#1d1d1f]/10"
              >
                <Plus className="w-4 h-4" />
                Add Hardware
              </button>
            )}
          </div>
        )}
      </div>

      {/* Finish Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader title="🎨 Finish" section="finish" />
        {expandedSections.has('finish') && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={params.finish?.type ?? 'none'}
                  onChange={e => updateFinish('type', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                >
                  {FINISH_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={params.finish?.color ?? ''}
                  onChange={e => updateFinish('color', e.target.value || null)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                  placeholder="e.g., Benjamin Moore OC-17"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sheen</label>
                <select
                  value={params.finish?.sheen ?? 'satin'}
                  onChange={e => updateFinish('sheen', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                >
                  {SHEEN_OPTIONS.map(sheen => (
                    <option key={sheen} value={sheen}>{sheen.charAt(0).toUpperCase() + sheen.slice(1).replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Coats</label>
                <input
                  type="number"
                  value={params.finish?.coats ?? ''}
                  onChange={e => updateFinish('coats', parseInt(e.target.value) || null)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
                  placeholder="2"
                  min="1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Construction Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader title="🔨 Construction" section="construction" />
        {expandedSections.has('construction') && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Construction Method</label>
              <select
                value={params.constructionMethod}
                onChange={e => setParams(prev => ({ ...prev, constructionMethod: e.target.value as ConstructionMethod }))}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent disabled:bg-gray-100"
              >
                {CONSTRUCTION_METHODS.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Joinery Types</label>
              <div className="flex flex-wrap gap-2">
                {JOINERY_TYPES.map(joinery => (
                  <button
                    key={joinery.value}
                    onClick={() => !isReadOnly && toggleJoinery(joinery.value)}
                    disabled={isReadOnly}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-colors',
                      params.joineryTypes.includes(joinery.value)
                        ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#1d1d1f]',
                      isReadOnly && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {joinery.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AWI Grade</label>
              <div className="flex gap-3">
                {AWI_GRADES.map(grade => (
                  <label key={grade.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="awiGrade"
                      value={grade.value}
                      checked={params.awiGrade === grade.value}
                      onChange={e => setParams(prev => ({ ...prev, awiGrade: e.target.value as 'economy' | 'custom' | 'premium' }))}
                      disabled={isReadOnly}
                      className="w-4 h-4 text-[#1d1d1f] focus:ring-[#1d1d1f]"
                    />
                    <span className="text-sm text-gray-700">{grade.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Special Requirements Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader title="⚡ Special Requirements" section="requirements" />
        {expandedSections.has('requirements') && (
          <div className="p-4 space-y-3">
            {params.specialRequirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm">{req}</span>
                {!isReadOnly && (
                  <button
                    onClick={() => removeRequirement(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={e => setNewRequirement(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRequirement()}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent"
                  placeholder="Add a special requirement..."
                />
                <button
                  onClick={addRequirement}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Katana Materials Section */}
      <div className="border rounded-lg overflow-hidden border-blue-200">
        <SectionHeader title="🏭 Katana MRP Materials" section="katana" />
        {expandedSections.has('katana') && (
          <div className="p-4 space-y-4 bg-blue-50/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Select materials from your Katana MRP inventory
              </p>
              <button
                onClick={fetchKatanaMaterials}
                disabled={loadingKatana}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', loadingKatana && 'animate-spin')} />
                Refresh
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={katanaSearch}
                onChange={(e) => setKatanaSearch(e.target.value)}
                placeholder="Search materials by name, SKU, or type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            {katanaError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {katanaError}
              </div>
            )}
            
            {loadingKatana ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Materials List */}
                <div className="grid gap-2">
                  {paginatedKatanaMaterials.map(material => (
                    <button
                      key={material.id}
                      onClick={() => !isReadOnly && selectKatanaMaterial(material)}
                      disabled={isReadOnly}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                        params.primaryMaterial?.katanaMaterialId === material.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300',
                        isReadOnly && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{material.name}</p>
                          <p className="text-xs text-gray-500">
                            SKU: {material.sku} • {material.thickness}mm • {material.type}
                          </p>
                        </div>
                      </div>
                      {params.primaryMaterial?.katanaMaterialId === material.id && (
                        <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded">Selected</span>
                      )}
                    </button>
                  ))}
                  
                  {filteredKatanaMaterials.length === 0 && !katanaError && (
                    <p className="text-center py-4 text-gray-500 text-sm">
                      {katanaSearch ? `No materials matching "${katanaSearch}"` : 'No materials found. Click Refresh to load from Katana.'}
                    </p>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalKatanaPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Showing {((katanaPage - 1) * KATANA_PAGE_SIZE) + 1}-{Math.min(katanaPage * KATANA_PAGE_SIZE, filteredKatanaMaterials.length)} of {filteredKatanaMaterials.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setKatanaPage(p => Math.max(1, p - 1))}
                        disabled={katanaPage === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {katanaPage} of {totalKatanaPages}
                      </span>
                      <button
                        onClick={() => setKatanaPage(p => Math.min(totalKatanaPages, p + 1))}
                        disabled={katanaPage === totalKatanaPages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {!isReadOnly && (
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1d1d1f] text-white font-medium rounded-lg hover:bg-[#1d1d1f]/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Parameters'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ParametersEditor;
