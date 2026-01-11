/**
 * PayrollPage.tsx
 * Payroll management with Uganda-specific tax calculations (PAYE, NSSF, LST)
 * DawinOS v2.0 - Professional Layout
 */

import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Play,
  Users,
  Download,
  FileText,
  TrendingDown,
  Wallet,
  Building2,
  MoreVertical,
  Eye,
  Printer,
  ChevronRight,
  CheckCircle,
  Clock,
  Banknote,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Progress } from '@/core/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { cn } from '@/shared/lib/utils';

import { useEmployee, useEmployeeList } from '@/modules/hr-central/hooks/useEmployee';
import AttendanceTab from '@/modules/hr-central/payroll/components/AttendanceTab';
import AdvancesTab from '@/modules/hr-central/payroll/components/AdvancesTab';
import OvertimeTab from '@/modules/hr-central/payroll/components/OvertimeTab';
import { useAdvances, useOvertime } from '@/modules/hr-central/payroll/hooks/usePayrollRecords';
import { 
  calculatePAYE, 
  calculateNSSF, 
  calculateLST 
} from '@/modules/hr-central/payroll/utils/tax-calculator';
import { 
  payrollPdfService, 
  type PayslipData, 
  type PayrollReportData,
  DEFAULT_COMPANY_INFO 
} from '@/modules/hr-central/payroll/services/payroll-pdf-generator';

const HR_COLOR = '#2196F3';

interface RunPayrollDialogState {
  open: boolean;
  month: string;
  processing: boolean;
}


// Format currency in UGX
function formatCurrency(amount: number): string {
  return `UGX ${amount.toLocaleString()}`;
}

export function PayrollPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const employeeIdFilter = searchParams.get('employee');
  
  // Get selected employee details if filtering by employee
  const { employee: selectedEmployee } = useEmployee(employeeIdFilter);
  
  // Fetch all employees
  const { employees, loading: employeesLoading } = useEmployeeList();
  
  const [runDialog, setRunDialog] = useState<RunPayrollDialogState>({
    open: false,
    month: format(new Date(), 'yyyy-MM'),
    processing: false,
  });

  const [activeTab, setActiveTab] = useState('payroll');
  const currentPeriod = format(new Date(), 'yyyy-MM');

  // Fetch advances and overtime data for payroll integration
  const { advances } = useAdvances();
  const { entries: overtimeEntries } = useOvertime({
    startDate: `${currentPeriod}-01`,
    endDate: `${currentPeriod}-31`,
    status: 'approved',
  });

  // Build maps for quick lookup
  const advancesByEmployee = useMemo(() => {
    const map: Record<string, number> = {};
    advances
      .filter(a => a.status === 'disbursed' || a.status === 'partially_recovered')
      .forEach(a => {
        map[a.employeeId] = (map[a.employeeId] || 0) + a.monthlyDeduction;
      });
    return map;
  }, [advances]);

  const overtimeByEmployee = useMemo(() => {
    const map: Record<string, number> = {};
    overtimeEntries
      .filter(o => o.status === 'approved')
      .forEach(o => {
        map[o.employeeId] = (map[o.employeeId] || 0) + o.amount;
      });
    return map;
  }, [overtimeEntries]);

  // Calculate payroll for each employee
  const calculatedPayrollItems = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    
    return employees
      .filter(emp => emp.employmentStatus === 'active' || emp.employmentStatus === 'probation')
      .map(emp => {
        // Get salary from customFields or use defaults
        const customFields = emp.customFields || {};
        const basicSalary = customFields.basicSalary || 0;
        const housingAllowance = customFields.housingAllowance || 0;
        const transportAllowance = customFields.transportAllowance || 0;
        const lunchAllowance = customFields.lunchAllowance || 0;
        const otherAllowances = customFields.otherAllowances || 0;
        
        // Get overtime and advances for this employee
        const overtimePay = overtimeByEmployee[emp.id] || 0;
        const advanceDeduction = advancesByEmployee[emp.id] || 0;
        
        const totalAllowances = housingAllowance + transportAllowance + lunchAllowance + otherAllowances;
        const grossPay = basicSalary + totalAllowances + overtimePay;
        
        // Calculate tax deductions
        const payeBreakdown = calculatePAYE(grossPay);
        const nssfBreakdown = calculateNSSF(grossPay);
        const lstBreakdown = calculateLST(grossPay);
        
        const paye = payeBreakdown.netPAYE;
        const nssf = nssfBreakdown.employeeContribution;
        const lst = lstBreakdown.monthlyLST;
        
        // Net pay includes overtime but deducts advances
        const netPay = grossPay - paye - nssf - lst - advanceDeduction;
        
        return {
          employeeId: emp.id,
          employeeName: emp.fullName,
          basicSalary,
          allowances: totalAllowances,
          overtime: overtimePay,
          grossPay,
          paye,
          nssf,
          lst,
          advanceDeduction,
          netPay,
        };
      })
      .filter(item => item.grossPay > 0); // Only include employees with salary data
  }, [employees, overtimeByEmployee, advancesByEmployee]);

  // Filter payroll items by employee if specified
  const filteredPayrollItems = useMemo(() => {
    if (!employeeIdFilter) return calculatedPayrollItems;
    return calculatedPayrollItems.filter(item => item.employeeId === employeeIdFilter);
  }, [employeeIdFilter, calculatedPayrollItems]);

  // Current month totals from real data
  const currentMonthTotals = useMemo(() => {
    const items = filteredPayrollItems;
    return {
      employeeCount: items.length,
      totalGross: items.reduce((sum, item) => sum + item.grossPay, 0),
      totalPAYE: items.reduce((sum, item) => sum + item.paye, 0),
      totalNSSF: items.reduce((sum, item) => sum + item.nssf, 0),
      totalLST: items.reduce((sum, item) => sum + item.lst, 0),
      totalNet: items.reduce((sum, item) => sum + item.netPay, 0),
    };
  }, [filteredPayrollItems]);

  // Handle run payroll
  const handleRunPayroll = async () => {
    setRunDialog(prev => ({ ...prev, processing: true }));
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRunDialog({ open: false, month: format(new Date(), 'yyyy-MM'), processing: false });
  };

  // PDF generation state
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Build payslip data for an employee
  const buildPayslipData = (item: typeof calculatedPayrollItems[0]): PayslipData => {
    const emp = employees?.find(e => e.id === item.employeeId);
    const customFields = emp?.customFields || {};
    
    return {
      employee: {
        id: item.employeeId,
        name: item.employeeName,
        employeeNumber: emp?.employeeNumber,
        department: emp?.departmentName || emp?.departmentId,
        position: emp?.title,
        bankName: customFields.bankName,
        bankAccountNumber: customFields.bankAccountNumber,
        tinNumber: customFields.tinNumber,
        nssfNumber: customFields.nssfNumber,
      },
      period: format(new Date(), 'yyyy-MM'),
      earnings: {
        basicSalary: item.basicSalary,
        housingAllowance: customFields.housingAllowance || 0,
        transportAllowance: customFields.transportAllowance || 0,
        lunchAllowance: customFields.lunchAllowance || 0,
        otherAllowances: customFields.otherAllowances || 0,
      },
      deductions: {
        paye: item.paye,
        nssf: item.nssf,
        lst: item.lst,
      },
      grossPay: item.grossPay,
      totalDeductions: item.paye + item.nssf + item.lst,
      netPay: item.netPay,
      employerNssf: item.nssf * 2, // Employer contributes 10% vs employee 5%
    };
  };

  // Download individual payslip
  const handleDownloadPayslip = async (item: typeof calculatedPayrollItems[0]) => {
    setGeneratingPdf(true);
    try {
      const payslipData = buildPayslipData(item);
      await payrollPdfService.downloadPayslip(payslipData);
    } catch (error) {
      console.error('Failed to generate payslip:', error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Download full payroll report
  const handleDownloadReport = async () => {
    setGeneratingPdf(true);
    try {
      const reportData: PayrollReportData = {
        period: format(new Date(), 'yyyy-MM'),
        generatedAt: new Date(),
        employees: filteredPayrollItems.map(buildPayslipData),
        totals: {
          grossPay: currentMonthTotals.totalGross,
          totalPaye: currentMonthTotals.totalPAYE,
          totalNssf: currentMonthTotals.totalNSSF,
          totalLst: currentMonthTotals.totalLST,
          totalDeductions: currentMonthTotals.totalPAYE + currentMonthTotals.totalNSSF + currentMonthTotals.totalLST,
          netPay: currentMonthTotals.totalNet,
          employerNssf: currentMonthTotals.totalNSSF * 2,
        },
        companyInfo: DEFAULT_COMPANY_INFO,
      };
      await payrollPdfService.downloadReport(reportData);
    } catch (error) {
      console.error('Failed to generate payroll report:', error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Download all payslips (batch)
  const handleDownloadAllPayslips = async () => {
    setGeneratingPdf(true);
    try {
      for (const item of filteredPayrollItems) {
        const payslipData = buildPayslipData(item);
        await payrollPdfService.downloadPayslip(payslipData);
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Failed to generate payslips:', error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Generate month options
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
      });
    }
    return options;
  }, []);

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${HR_COLOR}15` }}>
              <Wallet className="h-6 w-6" style={{ color: HR_COLOR }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Payroll Management</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'MMMM yyyy')} • Uganda Tax Compliance
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={generatingPdf || filteredPayrollItems.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                {generatingPdf ? 'Generating...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadReport}>
                <FileText className="h-4 w-4 mr-2" />
                Export Payroll Report (PDF)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadAllPayslips}>
                <Printer className="h-4 w-4 mr-2" />
                Download All Payslips
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setRunDialog({ ...runDialog, open: true })} style={{ backgroundColor: HR_COLOR }}>
            <Play className="h-4 w-4 mr-2" />
            Run Payroll
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Payroll</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="overtime" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Overtime</span>
          </TabsTrigger>
          <TabsTrigger value="advances" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Advances</span>
          </TabsTrigger>
        </TabsList>

        {/* Payroll Tab Content */}
        <TabsContent value="payroll" className="space-y-6 mt-6">
          {/* Summary Stats - Professional Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Payroll */}
            <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gross Payroll</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(currentMonthTotals.totalGross)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentMonthTotals.employeeCount} employees
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
          </CardContent>
        </Card>

        {/* Total Deductions */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deductions</p>
                <p className="text-2xl font-bold mt-2 text-red-600">
                  -{formatCurrency(currentMonthTotals.totalPAYE + currentMonthTotals.totalNSSF + currentMonthTotals.totalLST)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PAYE + NSSF + LST
                </p>
              </div>
              <div className="p-2 rounded-full bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
          </CardContent>
        </Card>

        {/* Net Payroll */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Payroll</p>
                <p className="text-2xl font-bold mt-2 text-green-600">
                  {formatCurrency(currentMonthTotals.totalNet)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Take-home amount
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500" />
          </CardContent>
        </Card>

        {/* Employer Contributions */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employer NSSF (10%)</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(currentMonthTotals.totalNSSF * 2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Statutory contribution
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
          </CardContent>
        </Card>
      </div>

      {/* Tax Breakdown Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">PAYE</p>
              <p className="text-lg font-bold">{formatCurrency(currentMonthTotals.totalPAYE)}</p>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
              0-40%
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">NSSF (Employee)</p>
              <p className="text-lg font-bold">{formatCurrency(currentMonthTotals.totalNSSF)}</p>
            </div>
            <Badge variant="outline" className="text-cyan-600 border-cyan-200 bg-cyan-50">
              5%
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">LST</p>
              <p className="text-lg font-bold">{formatCurrency(currentMonthTotals.totalLST)}</p>
            </div>
            <Badge variant="outline" className="text-violet-600 border-violet-200 bg-violet-50">
              Annual
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Employee Payroll Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Employee Payroll Breakdown</CardTitle>
              <CardDescription>
                Detailed salary and deduction information for {format(new Date(), 'MMMM yyyy')}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Draft
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {employeesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">Loading payroll data...</p>
              </div>
            </div>
          ) : filteredPayrollItems.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <Users className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium">No Salary Data Found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Add salary information to employees in their profile to see payroll calculations.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/hr/employees')}
              >
                Go to Employees
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="text-right font-semibold">Basic</TableHead>
                  <TableHead className="text-right font-semibold">Allowances</TableHead>
                  <TableHead className="text-right font-semibold text-blue-600">Overtime</TableHead>
                  <TableHead className="text-right font-semibold">Gross</TableHead>
                  <TableHead className="text-right font-semibold text-orange-600">PAYE</TableHead>
                  <TableHead className="text-right font-semibold text-cyan-600">NSSF</TableHead>
                  <TableHead className="text-right font-semibold text-violet-600">LST</TableHead>
                  <TableHead className="text-right font-semibold text-amber-600">Advances</TableHead>
                  <TableHead className="text-right font-semibold text-green-600">Net Pay</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrollItems.map(item => (
                  <TableRow key={item.employeeId} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {item.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium">{item.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(item.basicSalary)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(item.allowances)}</TableCell>
                    <TableCell className="text-right tabular-nums text-blue-600">
                      {item.overtime > 0 ? `+${formatCurrency(item.overtime)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(item.grossPay)}</TableCell>
                    <TableCell className="text-right tabular-nums text-orange-600">-{formatCurrency(item.paye)}</TableCell>
                    <TableCell className="text-right tabular-nums text-cyan-600">-{formatCurrency(item.nssf)}</TableCell>
                    <TableCell className="text-right tabular-nums text-violet-600">-{formatCurrency(item.lst)}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-600">
                      {item.advanceDeduction > 0 ? `-${formatCurrency(item.advanceDeduction)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-green-600">{formatCurrency(item.netPay)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/hr/employees/${item.employeeId}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPayslip(item)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Download Payslip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {/* Footer Totals */}
              <tfoot>
                <TableRow className="bg-muted/70 font-semibold border-t-2">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Total ({filteredPayrollItems.length} employees)
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(filteredPayrollItems.reduce((s, i) => s + i.basicSalary, 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(filteredPayrollItems.reduce((s, i) => s + i.allowances, 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-blue-600">
                    +{formatCurrency(filteredPayrollItems.reduce((s, i) => s + i.overtime, 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(currentMonthTotals.totalGross)}</TableCell>
                  <TableCell className="text-right tabular-nums text-orange-600">-{formatCurrency(currentMonthTotals.totalPAYE)}</TableCell>
                  <TableCell className="text-right tabular-nums text-cyan-600">-{formatCurrency(currentMonthTotals.totalNSSF)}</TableCell>
                  <TableCell className="text-right tabular-nums text-violet-600">-{formatCurrency(currentMonthTotals.totalLST)}</TableCell>
                  <TableCell className="text-right tabular-nums text-amber-600">
                    -{formatCurrency(filteredPayrollItems.reduce((s, i) => s + i.advanceDeduction, 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-green-600 font-bold">{formatCurrency(currentMonthTotals.totalNet)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </tfoot>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Attendance Tab Content */}
        <TabsContent value="attendance" className="mt-6">
          <AttendanceTab 
            period={currentPeriod} 
            employees={(employees || []).filter(e => e.employmentStatus === 'active' || e.employmentStatus === 'probation')} 
          />
        </TabsContent>

        {/* Overtime Tab Content */}
        <TabsContent value="overtime" className="mt-6">
          <OvertimeTab 
            period={currentPeriod} 
            employees={(employees || []).filter(e => e.employmentStatus === 'active' || e.employmentStatus === 'probation')} 
          />
        </TabsContent>

        {/* Advances Tab Content */}
        <TabsContent value="advances" className="mt-6">
          <AdvancesTab 
            employees={(employees || []).filter(e => e.employmentStatus === 'active' || e.employmentStatus === 'probation')} 
          />
        </TabsContent>
      </Tabs>

      {/* Run Payroll Dialog */}
      <Dialog open={runDialog.open} onOpenChange={(open: boolean) => !runDialog.processing && setRunDialog({ ...runDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Payroll</DialogTitle>
            <DialogDescription>
              Calculate payroll for all active employees for the selected period.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Payroll Period</label>
              <Select
                value={runDialog.month}
                onValueChange={(value) => setRunDialog(prev => ({ ...prev, month: value }))}
                disabled={runDialog.processing}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">Deductions Applied:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• PAYE (Pay As You Earn) - Progressive rate 0-40%</li>
                  <li>• NSSF - 5% employee contribution</li>
                  <li>• LST (Local Service Tax) - Annual amount pro-rated monthly</li>
                </ul>
              </CardContent>
            </Card>

            {runDialog.processing && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Processing payroll...</p>
                <Progress value={66} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRunDialog({ ...runDialog, open: false })}
              disabled={runDialog.processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRunPayroll}
              disabled={runDialog.processing}
              style={{ backgroundColor: HR_COLOR }}
            >
              {runDialog.processing ? 'Processing...' : 'Run Payroll'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default PayrollPage;
