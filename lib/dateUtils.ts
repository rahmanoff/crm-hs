// Utility functions for date range and HubSpot filter construction

export interface DateRange {
  start: number;
  end: number;
}

/**
 * Returns a date range (start, end) in ms for the last N days, or for all time if days=0.
 * If days=0, returns {start: 0, end: now}.
 */
export function getDateRange(days: number): DateRange {
  // Clamp 'now' to the real current date to avoid future periods
  const now = new Date();
  const realNow = new Date(Date.now());
  if (now.getTime() > realNow.getTime()) {
    now.setTime(realNow.getTime());
  }
  if (days === 0) {
    return { start: 0, end: now.getTime() };
  }
  const end = new Date(now.setHours(23, 59, 59, 999)).getTime();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  const start = new Date(startDate.setHours(0, 0, 0, 0)).getTime();
  return { start, end };
}

/**
 * Returns a date range for the previous period of the same length.
 */
export function getPreviousDateRange(days: number): DateRange {
  if (days === 0) {
    return { start: 0, end: 0 };
  }
  const { start } = getDateRange(days);
  const prevEnd = start - 1;
  const prevStartDate = new Date(prevEnd);
  prevStartDate.setDate(prevStartDate.getDate() - days + 1);
  const prevStart = new Date(
    prevStartDate.setHours(0, 0, 0, 0)
  ).getTime();
  const prevEndFinal = new Date(prevEnd).setHours(23, 59, 59, 999);
  return { start: prevStart, end: prevEndFinal };
}

/**
 * Helper to build a HubSpot filter group for a property between two timestamps.
 */
export function buildBetweenFilter(
  propertyName: string,
  start: number,
  end: number
) {
  return [
    {
      filters: [
        {
          propertyName,
          operator: 'BETWEEN',
          value: start,
          highValue: end,
        },
      ],
    },
  ];
}

/**
 * Helper to build a HubSpot filter group for a property equals a value.
 */
export function buildEqualsFilter(propertyName: string, value: string) {
  return [
    {
      filters: [
        {
          propertyName,
          operator: 'EQ',
          value,
        },
      ],
    },
  ];
}

/**
 * Helper to build a filter group for multiple filters (AND logic).
 */
export function buildAndFilter(filters: any[]) {
  return [
    {
      filters,
    },
  ];
}

export function getMetricDateRanges(
  days: number,
  now: number = Date.now()
) {
  const PERIOD = days * 24 * 60 * 60 * 1000;
  const start = now - PERIOD;
  const prevStart = start - PERIOD;
  const prevEnd = start;
  return { PERIOD, start, prevStart, prevEnd };
}
