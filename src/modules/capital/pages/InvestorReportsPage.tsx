// ============================================================================
// INVESTOR REPORTS PAGE
// DawinOS v2.0 - Capital Hub Module
// LP reporting dashboard with performance metrics
// ============================================================================

import React, { useState } from 'react';
import { Download } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
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

import { useInvestorReports } from '../hooks/useInvestorReports';
import { formatCurrency } from '../components/shared/CurrencyDisplay';
import { formatMultiple } from '../components/shared/MultiplesDisplay';
import { formatIRR } from '../components/shared/IRRDisplay';
import { MODULE_COLOR, REPORT_PERIODS } from '../constants';

const COLORS = ['#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#F44336'];

const InvestorReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Q4');
  const [selectedYear, setSelectedYear] = useState<string>('2024');

  const {
    performanceData,
    sectorAllocation,
    cashFlowData,
    generateReport,
  } = useInvestorReports({
    period: selectedPeriod,
    year: parseInt(selectedYear),
  });

  const summaryMetrics = {
    totalCommitments: 150000000,
    totalContributed: 95000000,
    totalDistributed: 28000000,
    currentNAV: 125000000,
    tvpi: 1.61,
    dpi: 0.29,
    rvpi: 1.32,
    netIRR: 0.186,
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    await generateReport({
      format,
      period: selectedPeriod,
      year: parseInt(selectedYear),
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Investor Reports</h1>
          <p className="text-muted-foreground">LP reporting and performance analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_PERIODS.map(period => (
                <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2023, 2022, 2021].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => handleExportReport('excel')} style={{ backgroundColor: MODULE_COLOR }}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">TVPI</p>
            <p className="text-2xl font-semibold" style={{ color: MODULE_COLOR }}>
              {formatMultiple(summaryMetrics.tvpi)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">DPI</p>
            <p className="text-2xl font-semibold">{formatMultiple(summaryMetrics.dpi)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">RVPI</p>
            <p className="text-2xl font-semibold">{formatMultiple(summaryMetrics.rvpi)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Net IRR</p>
            <p className="text-2xl font-semibold text-green-600">{formatIRR(summaryMetrics.netIRR)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">NAV</p>
            <p className="text-2xl font-semibold">{formatCurrency(summaryMetrics.currentNAV, 'USD', true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Distributed</p>
            <p className="text-2xl font-semibold">{formatCurrency(summaryMetrics.totalDistributed, 'USD', true)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sectors">Sector Allocation</TabsTrigger>
          <TabsTrigger value="cashflows">Cash Flows</TabsTrigger>
          <TabsTrigger value="tax">Uganda Tax Summary</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fund Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData?.map((point) => (
                    <div key={point.period} className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-20">{point.period}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div
                          className="h-4 rounded"
                          style={{
                            width: `${(point.tvpi / 2) * 100}%`,
                            backgroundColor: MODULE_COLOR,
                          }}
                        />
                        <span className="text-sm font-medium">{formatMultiple(point.tvpi)}</span>
                      </div>
                      <span className="text-sm text-green-600">{formatIRR(point.irr)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contribution vs Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Committed</span>
                      <span className="font-medium">{formatCurrency(summaryMetrics.totalCommitments, 'USD', true)}</span>
                    </div>
                    <div className="h-6 bg-muted rounded overflow-hidden">
                      <div className="h-full rounded" style={{ width: '100%', backgroundColor: MODULE_COLOR }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Contributed</span>
                      <span className="font-medium">{formatCurrency(summaryMetrics.totalContributed, 'USD', true)}</span>
                    </div>
                    <div className="h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${(summaryMetrics.totalContributed / summaryMetrics.totalCommitments) * 100}%`,
                          backgroundColor: '#2196F3',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Distributed</span>
                      <span className="font-medium">{formatCurrency(summaryMetrics.totalDistributed, 'USD', true)}</span>
                    </div>
                    <div className="h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${(summaryMetrics.totalDistributed / summaryMetrics.totalCommitments) * 100}%`,
                          backgroundColor: '#4CAF50',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sector Allocation Tab */}
        <TabsContent value="sectors" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Portfolio by Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sectorAllocation?.map((sector, idx) => {
                    const total = sectorAllocation.reduce((sum, s) => sum + s.value, 0);
                    const percentage = total > 0 ? (sector.value / total) * 100 : 0;
                    return (
                      <div key={sector.name} className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm flex-1">{sector.name}</span>
                        <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sector Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-center">MOIC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectorAllocation?.map((sector, index) => (
                      <TableRow key={sector.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {sector.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sector.invested || 0, 'USD', true)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sector.value || 0, 'USD', true)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={sector.moic >= 1 ? 'text-green-600' : 'text-red-600'}>
                            {formatMultiple(sector.moic || 1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cash Flows Tab */}
        <TabsContent value="cashflows" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cash Flow Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Contributions</TableHead>
                    <TableHead className="text-right">Distributions</TableHead>
                    <TableHead className="text-right">Net Cash Flow</TableHead>
                    <TableHead className="text-right">Cumulative</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlowData?.map((row) => {
                    const netCashFlow = (row.distributions || 0) - (row.contributions || 0);
                    return (
                      <TableRow key={row.period}>
                        <TableCell>{row.period}</TableCell>
                        <TableCell className="text-right text-red-600">
                          ({formatCurrency(row.contributions || 0, 'USD', true)})
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(row.distributions || 0, 'USD', true)}
                        </TableCell>
                        <TableCell className={`text-right ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {netCashFlow >= 0 ? '' : '('}
                          {formatCurrency(Math.abs(netCashFlow), 'USD', true)}
                          {netCashFlow >= 0 ? '' : ')'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.cumulative || 0, 'USD', true)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Uganda Tax Summary Tab */}
        <TabsContent value="tax" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Withholding Tax Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>WHT on Dividends (Resident 10%)</TableCell>
                      <TableCell className="text-right">{formatCurrency(1500000, 'UGX', true)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>WHT on Dividends (Non-Resident 15%)</TableCell>
                      <TableCell className="text-right">{formatCurrency(2250000, 'UGX', true)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>WHT on Interest (15%)</TableCell>
                      <TableCell className="text-right">{formatCurrency(750000, 'UGX', true)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">Total WHT</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(4500000, 'UGX', true)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capital Gains Tax Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Realized Gains</TableCell>
                      <TableCell className="text-right">{formatCurrency(28000000, 'USD')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CGT Rate</TableCell>
                      <TableCell className="text-right">30%</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">CGT Liability</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(8400000, 'USD')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">URA Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { period: 'Q1 2024', status: 'Filed', due: 'Apr 15' },
                    { period: 'Q2 2024', status: 'Filed', due: 'Jul 15' },
                    { period: 'Q3 2024', status: 'Filed', due: 'Oct 15' },
                    { period: 'Q4 2024', status: 'Pending', due: 'Jan 15' },
                  ].map((item) => (
                    <Card key={item.period} className="border">
                      <CardContent className="p-4 text-center">
                        <Badge className={item.status === 'Filed' ? 'bg-green-500' : 'bg-amber-500'}>
                          {item.status}
                        </Badge>
                        <p className="font-medium mt-2">{item.period} WHT</p>
                        <p className="text-xs text-muted-foreground">Due: {item.due}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorReportsPage;
