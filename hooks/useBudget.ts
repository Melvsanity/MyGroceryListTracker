import { useMemo } from 'react';
import { GroceryItem } from '../database/items';

export interface BudgetResult {
  total: number;       // sum of price × quantity for all items
  overBudget: boolean; // true if budget is set and total exceeds it
  budgetPct: number;   // 0–1 fill ratio for the progress bar (capped at 1)
}

export function useBudget(items: GroceryItem[], budget: number): BudgetResult {
  return useMemo(() => {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const overBudget = budget > 0 && total > budget;
    const budgetPct = budget > 0 ? Math.min(total / budget, 1) : 0;
    return { total, overBudget, budgetPct };
  }, [items, budget]);
}