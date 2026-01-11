// ============================================================================
// FINANCIAL MODELS PAGE
// DawinOS v2.0 - Capital Hub Module
// DCF, LBO, and returns analysis models
// ============================================================================

import React, { useState } from 'react';
import { 
  Plus, 
  Calculator, 
  TrendingUp, 
  ArrowLeftRight,
  LineChart,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Badge } from '@/core/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/core/components/ui/table';

import { formatCurrency } from '../components/shared/CurrencyDisplay';
import { formatMultiple } from '../components/shared/MultiplesDisplay';
import { formatIRR } from '../components/shared/IRRDisplay';
import { MODULE_COLOR, MODEL_TYPES } from '../constants';

const FinancialModelsPage: React.FC = () => {
  const [entryAmount, setEntryAmount] = useState<number>(10000000);
  const [exitAmount, setExitAmount] = useState<number>(25000000);
  const [holdingPeriod, setHoldingPeriod] = useState<number>(5);
  const [modelType, setModelType] = useState<string>('returns');

  // Calculate returns
  const moic = entryAmount > 0 ? exitAmount / entryAmount : 0;
  const irr = entryAmount > 0 && holdingPeriod > 0
    ? Math.pow(exitAmount / entryAmount, 1 / holdingPeriod) - 1
    : 0;
  const absoluteReturn = exitAmount - entryAmount;

  // Scenario data
  const scenarioData = [
    { scenario: 'Bear', moic: moic * 0.6, irr: irr * 0.5, exitValue: exitAmount * 0.6 },
    { scenario: 'Base', moic: moic, irr: irr, exitValue: exitAmount },
    { scenario: 'Bull', moic: moic * 1.5, irr: irr * 1.4, exitValue: exitAmount * 1.5 },
  ];

  const getModelIcon = (id: string) => {
    switch (id) {
      case 'dcf': return <Calculator className="h-8 w-8" style={{ color: MODULE_COLOR }} />;
      case 'lbo': return <TrendingUp className="h-8 w-8" style={{ color: MODULE_COLOR }} />;
      case 'comparables': return <ArrowLeftRight className="h-8 w-8" style={{ color: MODULE_COLOR }} />;
      case 'merger': return <LineChart className="h-8 w-8" style={{ color: MODULE_COLOR }} />;
      default: return <TrendingUp className="h-8 w-8" style={{ color: MODULE_COLOR }} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Financial Models</h1>
          <p className="text-muted-foreground">Valuation and returns analysis tools</p>
        </div>
        <Button style={{ backgroundColor: MODULE_COLOR }}>
          <Plus className="h-4 w-4 mr-2" />
          New Model
        </Button>
      </div>

      {/* Model Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {MODEL_TYPES.map(type => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              modelType === type.id ? 'ring-2' : ''
            }`}
            style={{ 
              borderColor: modelType === type.id ? MODULE_COLOR : undefined,
            }}
            onClick={() => setModelType(type.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                {getModelIcon(type.id)}
              </div>
              <p className="text-sm font-medium">{type.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Returns Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="entry">Entry Investment ($)</Label>
                <Input
                  id="entry"
                  type="number"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="exit">Exit Value ($)</Label>
                <Input
                  id="exit"
                  type="number"
                  value={exitAmount}
                  onChange={(e) => setExitAmount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="period">Holding Period (years): {holdingPeriod}</Label>
                <input
                  id="period"
                  type="range"
                  min={1}
                  max={10}
                  value={holdingPeriod}
                  onChange={(e) => setHoldingPeriod(Number(e.target.value))}
                  className="w-full mt-2 accent-purple-600"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 yr</span>
                  <span>10 yrs</span>
                </div>
              </div>
            </div>

            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Returns Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>MOIC (Multiple on Invested Capital)</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold" style={{ color: MODULE_COLOR }}>
                          {formatMultiple(moic)}
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IRR (Internal Rate of Return)</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          {formatIRR(irr)}
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Absolute Return</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(absoluteReturn, 'USD', true)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cash-on-Cash Return</TableCell>
                      <TableCell className="text-right font-semibold">
                        {((moic - 1) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {scenarioData.map(scenario => {
                const maxMoic = Math.max(...scenarioData.map(s => s.moic));
                const percentage = maxMoic > 0 ? (scenario.moic / maxMoic) * 100 : 0;
                return (
                  <div key={scenario.scenario}>
                    <div className="flex justify-between text-sm mb-1">
                      <Badge
                        className={
                          scenario.scenario === 'Bear' ? 'bg-red-500' :
                          scenario.scenario === 'Bull' ? 'bg-green-500' : 'bg-gray-500'
                        }
                      >
                        {scenario.scenario}
                      </Badge>
                      <span className="font-medium">{formatMultiple(scenario.moic)}</span>
                    </div>
                    <div className="h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: MODULE_COLOR,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Table>
              <TableBody>
                {scenarioData.map(scenario => (
                  <TableRow key={scenario.scenario}>
                    <TableCell>
                      <Badge
                        className={
                          scenario.scenario === 'Bear' ? 'bg-red-500' :
                          scenario.scenario === 'Bull' ? 'bg-green-500' : 'bg-gray-500'
                        }
                      >
                        {scenario.scenario}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      Exit: {formatCurrency(scenario.exitValue, 'USD', true)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMultiple(scenario.moic)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatIRR(scenario.irr)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: holdingPeriod + 1 }, (_, i) => {
              const value = i === 0 
                ? -entryAmount 
                : i === holdingPeriod 
                  ? exitAmount 
                  : 0;
              const maxValue = Math.max(entryAmount, exitAmount);
              const height = Math.abs(value) / maxValue * 100;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className={`w-full max-w-12 rounded-t transition-all ${
                        value >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Y{i}</p>
                  {value !== 0 && (
                    <p className={`text-xs font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(value, 'USD', true)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialModelsPage;
