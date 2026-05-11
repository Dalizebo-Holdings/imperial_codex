/**
 * Capital Allocation types for Imperial Codex v16
 *
 * Mandate: 40% growth, 40% operational, 20% reserve.
 * Tolerance: ±0.005 percentage points per category.
 */

export interface CapitalAllocation {
  /** Percentage allocated to growth investments (target: 40) */
  growthPercent: number;
  /** Percentage allocated to operational infrastructure (target: 40) */
  operationalPercent: number;
  /** Percentage allocated to reserve/contingency (target: 20) */
  reservePercent: number;
  /** The OS_Module slug this allocation is associated with */
  osModuleSlug: string;
}

export interface AllocationValidationError {
  category: 'growth' | 'operational' | 'reserve';
  submittedValue: number;
  /** Deviation in percentage points from the mandate target */
  deviationPoints: number;
  targetValue: number;
}

export interface AllocationRecord {
  allocation: CapitalAllocation;
  /** UTC ISO 8601 */
  approvedAt: string;
  approvingUserId: string;
  osModuleSlug: string;
}
