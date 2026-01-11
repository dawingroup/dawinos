// ============================================================================
// TAX COMPLIANCE PAGE
// DawinOS v2.0 - Capital Hub Module
// Uganda tax compliance tracking for investments
// ============================================================================

import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { 
  Download, 
  Calendar, 
  Calculator,
  CheckCircle,
  Clock,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/core/components/ui/alert';

import { useTaxCompliance } from '../hooks/useTaxCompliance';
import { formatCurrency } from '../components/shared/CurrencyDisplay';
import { MODULE_COLOR, UGANDA_TAX_RATES } from '../constants';

const TaxCompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('deadlines');
  
  // WHT Calculator State
  const [whtAmount, setWhtAmount] = useState<number>(1000000);
  const [whtType, setWhtType] = useState<string>('dividend_resident');
  
  // CGT Calculator State
  const [acquisitionCost, setAcquisitionCost] = useState<number>(10000000);
  const [saleProceeds, setSaleProceeds] = useState<number>(25000000);
  
  const { filings } = useTaxCompliance();

  // WHT calculation
  const getWHTRate = () => {
    switch (whtType) {
      case 'dividend_resident':
        return UGANDA_TAX_RATES.WHT_DIVIDENDS_RESIDENT;
      case 'dividend_non_resident':
        return UGANDA_TAX_RATES.WHT_DIVIDENDS_NON_RESIDENT;
      case 'interest_resident':
      case 'interest_non_resident':
        return UGANDA_TAX_RATES.WHT_INTEREST_RESIDENT;
      default:
        return 0;
    }
  };

  const whtRate = getWHTRate();
  const whtTax = whtAmount * whtRate;
  const whtNetAmount = whtAmount - whtTax;

  // CGT calculation
  const capitalGain = saleProceeds - acquisitionCost;
  const cgtLiability = capitalGain > 0 ? capitalGain * UGANDA_TAX_RATES.CGT_RATE : 0;
  const netProceeds = saleProceeds - cgtLiability;

  // Mock deadlines
  const upcomingDeadlines = [
    {
      id: '1',
      type: 'WHT Return',
      period: 'Q4 2024',
      dueDate: new Date('2025-01-15'),
      status: 'pending',
    },
    {
      id: '2',
      type: 'CGT Declaration',
      period: 'FY 2024',
      dueDate: new Date('2025-06-30'),
      status: 'upcoming',
    },
    {
      id: '3',
      type: 'Annual Tax Return',
      period: 'FY 2024',
      dueDate: new Date('2025-06-30'),
      status: 'upcoming',
    },
  ];

  const urgentDeadlines = upcomingDeadlines.filter(d => differenceInDays(d.dueDate, new Date()) <= 30);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Uganda Tax Compliance</h1>
          <p className="text-muted-foreground">WHT, CGT, and URA compliance tracking</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Alerts */}
      {urgentDeadlines.length > 0 && (
        <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900">
          <Clock className="h-4 w-4" />
          <AlertTitle>Upcoming Tax Deadlines</AlertTitle>
          <AlertDescription>
            You have {urgentDeadlines.length} tax deadline(s) within the next 30 days. 
            Please ensure timely filing to avoid penalties.
          </AlertDescription>
        </Alert>
      )}

      {/* Tax Rate Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Uganda Tax Rates Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="border">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-semibold" style={{ color: MODULE_COLOR }}>
                  {(UGANDA_TAX_RATES.WHT_DIVIDENDS_RESIDENT * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">WHT Dividend (Res)</p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-semibold" style={{ color: MODULE_COLOR }}>
                  {(UGANDA_TAX_RATES.WHT_DIVIDENDS_NON_RESIDENT * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">WHT Dividend (Non-Res)</p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-semibold" style={{ color: MODULE_COLOR }}>
                  {(UGANDA_TAX_RATES.WHT_INTEREST_RESIDENT * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">WHT Interest</p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-semibold text-red-600">
                  {(UGANDA_TAX_RATES.CGT_RATE * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Capital Gains Tax</p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-semibold">
                  {(UGANDA_TAX_RATES.STAMP_DUTY * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Stamp Duty</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="deadlines" className="gap-2">
            <Calendar className="h-4 w-4" />
            Tax Deadlines
          </TabsTrigger>
          <TabsTrigger value="wht" className="gap-2">
            <Calculator className="h-4 w-4" />
            WHT Calculator
          </TabsTrigger>
          <TabsTrigger value="cgt" className="gap-2">
            <Calculator className="h-4 w-4" />
            CGT Calculator
          </TabsTrigger>
          <TabsTrigger value="history">Filing History</TabsTrigger>
        </TabsList>

        {/* Tax Deadlines Tab */}
        <TabsContent value="deadlines" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tax Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingDeadlines.map(deadline => {
                      const daysRemaining = differenceInDays(deadline.dueDate, new Date());
                      return (
                        <TableRow key={deadline.id}>
                          <TableCell className="font-medium">{deadline.type}</TableCell>
                          <TableCell>{deadline.period}</TableCell>
                          <TableCell>{format(deadline.dueDate, 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                daysRemaining <= 7 ? 'bg-red-500' :
                                daysRemaining <= 30 ? 'bg-amber-500' : 'bg-gray-500'
                              }
                            >
                              {daysRemaining} days
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {deadline.status === 'pending' ? 'Pending' : 'Upcoming'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">URA Filing Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Monthly WHT Returns', desc: '15th of following month' },
                    { title: 'Quarterly WHT Summary', desc: '15th after quarter end' },
                    { title: 'Annual Income Tax Return', desc: 'June 30th' },
                    { title: 'CGT Declaration', desc: 'Within 30 days of disposal' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WHT Calculator Tab */}
        <TabsContent value="wht" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Withholding Tax Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Type</Label>
                  <Select value={whtType} onValueChange={setWhtType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dividend_resident">Dividend - Resident</SelectItem>
                      <SelectItem value="dividend_non_resident">Dividend - Non-Resident</SelectItem>
                      <SelectItem value="interest_resident">Interest - Resident</SelectItem>
                      <SelectItem value="interest_non_resident">Interest - Non-Resident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gross Amount (UGX)</Label>
                  <Input
                    type="number"
                    value={whtAmount}
                    onChange={(e) => setWhtAmount(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calculation Result</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Gross Amount</TableCell>
                      <TableCell className="text-right">{formatCurrency(whtAmount, 'UGX')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>WHT Rate</TableCell>
                      <TableCell className="text-right">{(whtRate * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-red-600">WHT Deduction</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(whtTax, 'UGX')})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">Net Amount</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(whtNetAmount, 'UGX')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CGT Calculator Tab */}
        <TabsContent value="cgt" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capital Gains Tax Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Acquisition Cost (UGX)</Label>
                  <Input
                    type="number"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Original purchase price plus allowable costs
                  </p>
                </div>
                <div>
                  <Label>Sale Proceeds (UGX)</Label>
                  <Input
                    type="number"
                    value={saleProceeds}
                    onChange={(e) => setSaleProceeds(Number(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total amount received from sale
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">CGT Calculation</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Sale Proceeds</TableCell>
                      <TableCell className="text-right">{formatCurrency(saleProceeds, 'UGX')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Less: Acquisition Cost</TableCell>
                      <TableCell className="text-right">({formatCurrency(acquisitionCost, 'UGX')})</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className={capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                        Capital Gain/(Loss)
                      </TableCell>
                      <TableCell className={`text-right ${capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(capitalGain, 'UGX')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CGT Rate</TableCell>
                      <TableCell className="text-right">{(UGANDA_TAX_RATES.CGT_RATE * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-red-600">CGT Liability</TableCell>
                      <TableCell className="text-right text-red-600">
                        ({formatCurrency(cgtLiability, 'UGX')})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">Net Proceeds After CGT</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(netProceeds, 'UGX')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                {capitalGain > 0 && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      CGT must be declared to URA within 30 days of the disposal date.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Filing History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filing History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Filed Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filings.map((filing) => (
                    <TableRow key={filing.id}>
                      <TableCell className="font-medium">{filing.type}</TableCell>
                      <TableCell>{filing.period}</TableCell>
                      <TableCell>{filing.filedDate}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(filing.amount, 'UGX', true)}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {filing.reference}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Filed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxCompliancePage;
