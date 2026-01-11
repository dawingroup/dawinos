/**
 * CompetencyListPage.tsx
 * Competency framework management with category organization
 * DawinOS v2.0 - Phase 8.9
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Download,
  Brain,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Skeleton } from '@/core/components/ui/skeleton';

const PERFORMANCE_COLOR = '#FF5722';

// Proficiency levels
const PROFICIENCY_LEVELS = [
  { level: 1, label: 'Beginner', color: '#e0e0e0' },
  { level: 2, label: 'Developing', color: '#90caf9' },
  { level: 3, label: 'Proficient', color: '#66bb6a' },
  { level: 4, label: 'Advanced', color: '#ffa726' },
  { level: 5, label: 'Expert', color: '#ab47bc' },
];

// Competency categories
const COMPETENCY_CATEGORIES = [
  { value: 'technical', label: 'Technical Skills' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'communication', label: 'Communication' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'interpersonal', label: 'Interpersonal' },
  { value: 'organizational', label: 'Organizational' },
];

// Mock competency data
const mockCompetencies = [
  { id: '1', name: 'Project Management', description: 'Ability to plan, execute, and close projects effectively', category: 'organizational', employeeCount: 45, averageLevel: 2.8 },
  { id: '2', name: 'Data Analysis', description: 'Ability to collect, process, and derive insights from data', category: 'analytical', employeeCount: 32, averageLevel: 2.4 },
  { id: '3', name: 'Leadership', description: 'Ability to guide and inspire teams toward goals', category: 'leadership', employeeCount: 28, averageLevel: 3.1 },
  { id: '4', name: 'Technical Writing', description: 'Ability to create clear technical documentation', category: 'communication', employeeCount: 38, averageLevel: 2.2 },
  { id: '5', name: 'Client Relations', description: 'Ability to build and maintain client relationships', category: 'interpersonal', employeeCount: 25, averageLevel: 3.5 },
  { id: '6', name: 'Software Development', description: 'Ability to design and build software solutions', category: 'technical', employeeCount: 22, averageLevel: 3.2 },
  { id: '7', name: 'Strategic Thinking', description: 'Ability to analyze situations and plan for the future', category: 'analytical', employeeCount: 18, averageLevel: 2.6 },
  { id: '8', name: 'Presentation Skills', description: 'Ability to effectively communicate to groups', category: 'communication', employeeCount: 42, averageLevel: 2.9 },
];

function getLevelColor(level: number): string {
  return PROFICIENCY_LEVELS.find(l => l.level === level)?.color || '#e0e0e0';
}

export function CompetencyListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    COMPETENCY_CATEGORIES.map(c => c.value)
  );
  const [loading] = useState(false);

  // Filter competencies
  const filteredCompetencies = useMemo(() => {
    return mockCompetencies.filter(comp => {
      if (search && !comp.name.toLowerCase().includes(search.toLowerCase()) &&
          !comp.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'all' && comp.category !== categoryFilter) return false;
      return true;
    });
  }, [search, categoryFilter]);

  // Group by category
  const groupedCompetencies = useMemo(() => {
    return COMPETENCY_CATEGORIES.map(cat => ({
      category: cat,
      competencies: filteredCompetencies.filter(c => c.category === cat.value),
    })).filter(group => group.competencies.length > 0);
  }, [filteredCompetencies]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" style={{ color: PERFORMANCE_COLOR }} />
            Competency Framework
          </h1>
          <p className="text-muted-foreground">Define and manage organizational competencies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/performance/competencies/new')} style={{ backgroundColor: PERFORMANCE_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competency
          </Button>
        </div>
      </div>

      {/* Proficiency Level Legend */}
      <Card>
        <CardContent className="py-3">
          <p className="text-sm font-medium mb-2">Proficiency Levels</p>
          <div className="flex flex-wrap gap-2">
            {PROFICIENCY_LEVELS.map(level => (
              <Badge
                key={level.level}
                variant="outline"
                style={{ 
                  backgroundColor: `${level.color}20`,
                  borderColor: level.color,
                  color: level.level >= 4 ? level.color : undefined
                }}
              >
                {level.level}. {level.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search competencies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {COMPETENCY_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Competencies by Category */}
      {filteredCompetencies.length === 0 ? (
        <Card className="p-12 text-center">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Competencies Found</h3>
          <p className="text-muted-foreground mb-4">
            {search || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Define competencies to establish your framework'}
          </p>
          <Button onClick={() => navigate('/performance/competencies/new')} style={{ backgroundColor: PERFORMANCE_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competency
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedCompetencies.map(group => (
            <Card key={group.category.value}>
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(group.category.value)}
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.includes(group.category.value) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-semibold">{group.category.label}</span>
                  <Badge variant="outline">{group.competencies.length} competencies</Badge>
                </div>
              </div>
              {expandedCategories.includes(group.category.value) && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.competencies.map(competency => (
                      <Card
                        key={competency.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/performance/competencies/${competency.id}`)}
                      >
                        <CardContent className="p-4">
                          <p className="font-semibold">{competency.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {competency.description}
                          </p>

                          {/* Proficiency Level Visualization */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Average Level</span>
                              <span className="font-medium">{competency.averageLevel.toFixed(1)} / 5</span>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(level => (
                                <div
                                  key={level}
                                  className="flex-1 h-2 rounded"
                                  style={{
                                    backgroundColor: level <= Math.round(competency.averageLevel)
                                      ? getLevelColor(level)
                                      : '#e5e7eb'
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            {competency.employeeCount} employees assessed
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompetencyListPage;
