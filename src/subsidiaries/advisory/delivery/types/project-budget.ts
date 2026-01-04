/**
 * PROJECT BUDGET TYPES
 * 
 * Budget allocation, tracking, and variance analysis.
 */

import { Timestamp } from 'firebase/firestore';
import { WorkCategory } from './project-scope';

// ─────────────────────────────────────────────────────────────────
// VARIANCE STATUS
// ─────────────────────────────────────────────────────────────────

export type VarianceStatus =
  | 'on_budget'
  | 'minor_variance'
  | 'significant'
  | 'critical';

export const VARIANCE_STATUS_CONFIG: Record<VarianceStatus, {
  label: string;
  color: string;
  threshold: number;
}> = {
  on_budget: { label: 'On Budget', color: 'green', threshold: 5 },
  minor_variance: { label: 'Minor Variance', color: 'yellow', threshold: 10 },
  significant: { label: 'Significant Variance', color: 'orange', threshold: 20 },
  critical: { label: 'Critical Variance', color: 'red', threshold: 100 },
};

// ─────────────────────────────────────────────────────────────────
// BUDGET CATEGORY
// ─────────────────────────────────────────────────────────────────

export interface BudgetCategory {
  id: string;
  name: string;
  category: WorkCategory;
  budgeted: number;
  committed: number;
  spent: number;
  remaining: number;
  percentOfTotal: number;
}

// ─────────────────────────────────────────────────────────────────
// PROJECT BUDGET
// ─────────────────────────────────────────────────────────────────

export interface ProjectBudget {
  // Core amounts
  currency: string;
  totalBudget: number;
  contingency: number;
  workingBudget: number;
  
  // Breakdown by category
  categoryBreakdown: BudgetCategory[];
  
  // Tracking
  committed: number;
  spent: number;
  remaining: number;
  
  // Forecasting
  forecastFinalCost: number;
  varianceAmount: number;
  variancePercent: number;
  varianceStatus: VarianceStatus;
  
  // Audit trail
  lastUpdated: Timestamp;
  lastUpdatedBy: string;
}

// ─────────────────────────────────────────────────────────────────
// BUDGET SUMMARY
// ─────────────────────────────────────────────────────────────────

export interface BudgetSummary {
  currency: string;
  total: number;
  spent: number;
  remaining: number;
  percentSpent: number;
  varianceStatus: VarianceStatus;
}

// ─────────────────────────────────────────────────────────────────
// BUDGET ALLOCATION
// ─────────────────────────────────────────────────────────────────

export type BudgetAllocationType = 'initial' | 'additional' | 'reallocation';

export interface ProjectBudgetAllocation {
  id: string;
  projectId: string;
  programId: string;
  amount: number;
  currency: string;
  allocationType: BudgetAllocationType;
  fundingSourceId?: string;
  approvalId?: string;
  allocatedAt: Timestamp;
  allocatedBy: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Initialize project budget
 */
export function initializeProjectBudget(
  totalAmount: number,
  currency: string,
  userId: string
): ProjectBudget {
  const contingency = totalAmount * 0.05;
  const workingBudget = totalAmount - contingency;
  
  return {
    currency,
    totalBudget: totalAmount,
    contingency,
    workingBudget,
    categoryBreakdown: [],
    committed: 0,
    spent: 0,
    remaining: workingBudget,
    forecastFinalCost: totalAmount,
    varianceAmount: 0,
    variancePercent: 0,
    varianceStatus: 'on_budget',
    lastUpdated: Timestamp.now(),
    lastUpdatedBy: userId,
  };
}

/**
 * Calculate variance status from percentage
 */
export function calculateVarianceStatus(variancePercent: number): VarianceStatus {
  const absVariance = Math.abs(variancePercent);
  if (absVariance <= 5) return 'on_budget';
  if (absVariance <= 10) return 'minor_variance';
  if (absVariance <= 20) return 'significant';
  return 'critical';
}

/**
 * Calculate budget summary
 */
export function calculateBudgetSummary(budget: ProjectBudget): BudgetSummary {
  const percentSpent = budget.totalBudget > 0
    ? (budget.spent / budget.totalBudget) * 100
    : 0;
  
  return {
    currency: budget.currency,
    total: budget.totalBudget,
    spent: budget.spent,
    remaining: budget.remaining,
    percentSpent,
    varianceStatus: budget.varianceStatus,
  };
}

/**
 * Update budget after spending
 */
export function updateBudgetSpending(
  budget: ProjectBudget,
  spentAmount: number,
  userId: string
): ProjectBudget {
  const newSpent = budget.spent + spentAmount;
  const newRemaining = budget.workingBudget - newSpent;
  const varianceAmount = newSpent - budget.forecastFinalCost;
  const variancePercent = budget.forecastFinalCost > 0
    ? (varianceAmount / budget.forecastFinalCost) * 100
    : 0;
  
  return {
    ...budget,
    spent: newSpent,
    remaining: newRemaining,
    varianceAmount,
    variancePercent,
    varianceStatus: calculateVarianceStatus(variancePercent),
    lastUpdated: Timestamp.now(),
    lastUpdatedBy: userId,
  };
}

/**
 * Get category budget remaining
 */
export function getCategoryRemaining(category: BudgetCategory): number {
  return category.budgeted - category.committed;
}

/**
 * Check if budget is critical
 */
export function isBudgetCritical(budget: ProjectBudget): boolean {
  return budget.varianceStatus === 'critical' || budget.remaining < 0;
}

/**
 * Format currency amount
 */
export function formatBudgetAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get variance status color class
 */
export function getVarianceStatusColor(status: VarianceStatus): string {
  const colorMap: Record<VarianceStatus, string> = {
    on_budget: 'text-green-600 bg-green-100',
    minor_variance: 'text-yellow-600 bg-yellow-100',
    significant: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100',
  };
  return colorMap[status];
}
