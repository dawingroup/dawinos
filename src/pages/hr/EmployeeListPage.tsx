/**
 * EmployeeListPage.tsx
 * Employee directory with search, filters, and bulk actions
 * DawinOS v2.0 - Phase 8.6
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Mail,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Users,
} from 'lucide-react';

import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';

import { useEmployeeList } from '@/modules/hr-central/hooks/useEmployee';
import type { EmploymentStatus } from '@/modules/hr-central/types/employee.types';

const HR_COLOR = '#2196F3';

const statusColors: Record<EmploymentStatus, string> = {
  active: 'bg-green-100 text-green-800',
  probation: 'bg-amber-100 text-amber-800',
  on_leave: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
  terminated: 'bg-gray-100 text-gray-800',
  resigned: 'bg-gray-100 text-gray-800',
  notice_period: 'bg-orange-100 text-orange-800',
  retired: 'bg-gray-100 text-gray-800',
};

type SortField = 'name' | 'email' | 'department' | 'position' | 'hireDate' | 'status';
type SortOrder = 'asc' | 'desc';

export function EmployeeListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | 'all'>(
    (searchParams.get('status') as EmploymentStatus) || 'all'
  );
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || 'all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);

  const { employees, loading, error } = useEmployeeList(
    {
      searchQuery: search || undefined,
      employmentStatuses: statusFilter === 'all' ? undefined : [statusFilter],
      departmentIds: departmentFilter === 'all' ? undefined : [departmentFilter] as any,
    }
  );

  // Mock departments for now - should come from a department hook
  const departments: Array<{ id: string; name: string }> = [];

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (departmentFilter !== 'all') params.set('department', departmentFilter);
    setSearchParams(params, { replace: true });
  }, [search, statusFilter, departmentFilter, setSearchParams]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    
    return [...employees].sort((a, b) => {
      let aVal: string | number | Date = '';
      let bVal: string | number | Date = '';
      
      switch (sortField) {
        case 'name':
          aVal = a.fullName?.toLowerCase() || '';
          bVal = b.fullName?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'department':
          aVal = a.departmentName?.toLowerCase() || '';
          bVal = b.departmentName?.toLowerCase() || '';
          break;
        case 'position':
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
          break;
        case 'hireDate':
          aVal = a.joiningDate?.toDate?.() || new Date(0);
          bVal = b.joiningDate?.toDate?.() || new Date(0);
          break;
        case 'status':
          aVal = a.employmentStatus || '';
          bVal = b.employmentStatus || '';
          break;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [employees, sortField, sortOrder]);

  // Paginate
  const paginatedEmployees = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedEmployees.slice(start, start + rowsPerPage);
  }, [sortedEmployees, page, rowsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDepartmentFilter('all');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || departmentFilter !== 'all';

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      className="flex items-center gap-1 font-medium hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load employees: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" style={{ color: HR_COLOR }} />
            Employees
          </h1>
          <p className="text-muted-foreground">{sortedEmployees.length} total employees</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/hr/employees/new')} style={{ backgroundColor: HR_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSearch('')}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EmploymentStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm text-muted-foreground">
                  <SortHeader field="name">Employee</SortHeader>
                </th>
                <th className="text-left p-4 text-sm text-muted-foreground">
                  <SortHeader field="email">Email</SortHeader>
                </th>
                <th className="text-left p-4 text-sm text-muted-foreground">
                  <SortHeader field="department">Department</SortHeader>
                </th>
                <th className="text-left p-4 text-sm text-muted-foreground">
                  <SortHeader field="position">Position</SortHeader>
                </th>
                <th className="text-left p-4 text-sm text-muted-foreground">
                  <SortHeader field="hireDate">Hire Date</SortHeader>
                </th>
                <th className="text-left p-4 text-sm text-muted-foreground">
                  <SortHeader field="status">Status</SortHeader>
                </th>
                <th className="w-12 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20 mt-1" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-8 rounded" /></td>
                  </tr>
                ))
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {hasActiveFilters ? 'No employees match your filters' : 'No employees found'}
                    {hasActiveFilters && (
                      <Button variant="link" onClick={handleClearFilters} className="ml-2">
                        Clear filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map(employee => (
                  <tr
                    key={employee.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/hr/employees/${employee.id}`)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {employee.fullName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{employee.fullName}</p>
                          <p className="text-sm text-muted-foreground">{employee.employeeNumber || 'No ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employee.email}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{employee.departmentName || '-'}</td>
                    <td className="p-4 text-sm">{employee.title || '-'}</td>
                    <td className="p-4 text-sm">
                      {employee.joiningDate
                        ? new Date(
                            typeof employee.joiningDate === 'string' 
                              ? employee.joiningDate 
                              : employee.joiningDate.toDate?.() || employee.joiningDate
                          ).toLocaleDateString('en-UG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="p-4">
                      <Badge className={cn('capitalize', statusColors[employee.employmentStatus])}>
                        {employee.employmentStatus?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/hr/employees/${employee.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sortedEmployees.length > rowsPerPage && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, sortedEmployees.length)} of {sortedEmployees.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * rowsPerPage >= sortedEmployees.length}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default EmployeeListPage;
