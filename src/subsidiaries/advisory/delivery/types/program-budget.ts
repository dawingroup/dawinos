/**
 * PROGRAM BUDGET TYPES
 * 
 * Budget categories, allocations, and financial tracking for programs.
 */

import { Money } from '../../core/types/money';

// ─────────────────────────────────────────────────────────────────
// BUDGET CATEGORIES
// ─────────────────────────────────────────────────────────────────

/**
 * Budget category for cost classification
 */
export type BudgetCategory =
  | 'works'         // Construction works
  | 'goods'         // Materials, equipment, supplies
  | 'services'      // Professional services, consultancy
  | 'supervision'   // Supervision and monitoring
  | 'contingency'   // Contingency reserve
  | 'overhead'      // Administrative overhead
  | 'other';        // Miscellaneous

/**
 * Budget category configuration
 */
export interface BudgetCategoryConfig {
  category: BudgetCategory;
  label: string;
  description: string;
  typicalPercent: number;
}

export const BUDGET_CATEGORIES: Record<BudgetCategory, BudgetCategoryConfig> = {
  works: {
    category: 'works',
    label: 'Works',
    description: 'Construction and civil works',
    typicalPercent: 70,
  },
  goods: {
    category: 'goods',
    label: 'Goods',
    description: 'Materials, equipment, and supplies',
    typicalPercent: 10,
  },
  services: {
    category: 'services',
    label: 'Services',
    description: 'Professional and consultancy services',
    typicalPercent: 5,
  },
  supervision: {
    category: 'supervision',
    label: 'Supervision',
    description: 'Supervision and monitoring costs',
    typicalPercent: 5,
  },
  contingency: {
    category: 'contingency',
    label: 'Contingency',
    description: 'Contingency reserve for unforeseen costs',
    typicalPercent: 5,
  },
  overhead: {
    category: 'overhead',
    label: 'Overhead',
    description: 'Administrative and operational overhead',
    typicalPercent: 3,
  },
  other: {
    category: 'other',
    label: 'Other',
    description: 'Miscellaneous costs',
    typicalPercent: 2,
  },
};

// ─────────────────────────────────────────────────────────────────
// FUNDING ALLOCATION
// ─────────────────────────────────────────────────────────────────

/**
 * Allocation of funding source to program budget
 * Links program budget to engagement-level funding sources
 */
export interface BudgetAllocation {
  fundingSourceId: string;
  funderName: string;
  allocatedAmount: Money;
  disbursedAmount: Money;
  spentAmount: Money;
  percentOfBudget: number;
  conditions?: string[];
  eligibleCategories?: BudgetCategory[];
  isActive: boolean;
}

// ─────────────────────────────────────────────────────────────────
// BUDGET BY CATEGORY
// ─────────────────────────────────────────────────────────────────

/**
 * Budget breakdown by category
 */
export interface CategoryBudget {
  category: BudgetCategory;
  allocated: Money;
  committed: Money;
  spent: Money;
  available: Money;
  percentOfTotal: number;
}

// ─────────────────────────────────────────────────────────────────
// PROGRAM BUDGET
// ─────────────────────────────────────────────────────────────────

/**
 * PROGRAM BUDGET
 * Complete budget structure for a program
 */
export interface ProgramBudget {
  currency: string;
  
  // Totals
  allocated: Money;
  committed: Money;
  spent: Money;
  available: Money;
  
  // By Category
  byCategory: CategoryBudget[];
  
  // Funding Allocation
  fundingAllocations: BudgetAllocation[];
  
  // Tracking
  lastCalculatedAt: Date;
  
  variance: {
    commitmentVariance: Money;
    commitmentVariancePercent: number;
    spendingVariance: Money;
    spendingVariancePercent: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Initialize empty program budget
 */
export function initializeProgramBudget(currency: string = 'USD'): ProgramBudget {
  return {
    currency,
    allocated: { amount: 0, currency },
    committed: { amount: 0, currency },
    spent: { amount: 0, currency },
    available: { amount: 0, currency },
    byCategory: Object.values(BUDGET_CATEGORIES).map(config => ({
      category: config.category,
      allocated: { amount: 0, currency },
      committed: { amount: 0, currency },
      spent: { amount: 0, currency },
      available: { amount: 0, currency },
      percentOfTotal: 0,
    })),
    fundingAllocations: [],
    lastCalculatedAt: new Date(),
    variance: {
      commitmentVariance: { amount: 0, currency },
      commitmentVariancePercent: 0,
      spendingVariance: { amount: 0, currency },
      spendingVariancePercent: 0,
    },
  };
}

/**
 * Calculate budget totals from allocations
 */
export function calculateBudgetTotals(
  allocations: BudgetAllocation[]
): { allocated: number; disbursed: number; spent: number } {
  return allocations.reduce(
    (totals, allocation) => ({
      allocated: totals.allocated + allocation.allocatedAmount.amount,
      disbursed: totals.disbursed + allocation.disbursedAmount.amount,
      spent: totals.spent + allocation.spentAmount.amount,
    }),
    { allocated: 0, disbursed: 0, spent: 0 }
  );
}

/**
 * Calculate budget variance
 */
export function calculateBudgetVariance(
  allocated: number,
  committed: number,
  spent: number,
  currency: string
): ProgramBudget['variance'] {
  const commitmentVariance = allocated - committed;
  const spendingVariance = committed - spent;
  
  return {
    commitmentVariance: { amount: commitmentVariance, currency },
    commitmentVariancePercent: allocated > 0 ? (commitmentVariance / allocated) * 100 : 0,
    spendingVariance: { amount: spendingVariance, currency },
    spendingVariancePercent: committed > 0 ? (spendingVariance / committed) * 100 : 0,
  };
}

/**
 * Get budget utilization percentage
 */
export function getBudgetUtilization(budget: ProgramBudget): {
  commitmentRate: number;
  spendingRate: number;
  overallUtilization: number;
} {
  const allocated = budget.allocated.amount;
  if (allocated === 0) {
    return { commitmentRate: 0, spendingRate: 0, overallUtilization: 0 };
  }
  
  const commitmentRate = (budget.committed.amount / allocated) * 100;
  const spendingRate = budget.committed.amount > 0
    ? (budget.spent.amount / budget.committed.amount) * 100
    : 0;
  const overallUtilization = (budget.spent.amount / allocated) * 100;
  
  return { commitmentRate, spendingRate, overallUtilization };
}

/**
 * Check if category budget is exceeded
 */
export function isCategoryOverBudget(categoryBudget: CategoryBudget): boolean {
  return categoryBudget.committed.amount > categoryBudget.allocated.amount;
}

/**
 * Get funding source utilization
 */
export function getFundingSourceUtilization(allocation: BudgetAllocation): {
  disbursementRate: number;
  spendingRate: number;
} {
  const allocated = allocation.allocatedAmount.amount;
  if (allocated === 0) {
    return { disbursementRate: 0, spendingRate: 0 };
  }
  
  return {
    disbursementRate: (allocation.disbursedAmount.amount / allocated) * 100,
    spendingRate: (allocation.spentAmount.amount / allocated) * 100,
  };
}

/**
 * Get category budget by type
 */
export function getCategoryBudget(
  budget: ProgramBudget,
  category: BudgetCategory
): CategoryBudget | undefined {
  return budget.byCategory.find(c => c.category === category);
}

/**
 * Calculate available budget for category
 */
export function getAvailableBudget(categoryBudget: CategoryBudget): number {
  return categoryBudget.allocated.amount - categoryBudget.committed.amount;
}
