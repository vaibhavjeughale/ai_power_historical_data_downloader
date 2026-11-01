import { TimeframeId } from '../types/market';

export function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatHumanDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2].padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${monthNames[monthIdx] || parts[1]}-${year}`;
  }
  return dateStr;
}

export interface QuickRangeOption {
  id: string;
  label: string;
  getRange: () => { startDate: string; endDate: string };
}

export const QUICK_RANGES: QuickRangeOption[] = [
  {
    id: 'today',
    label: 'Today',
    getRange: () => {
      const now = new Date();
      const str = formatDateForInput(now);
      return { startDate: str, endDate: str };
    },
  },
  {
    id: '7d',
    label: 'Last 7 Days',
    getRange: () => {
      const now = new Date();
      const end = formatDateForInput(now);
      const startObj = new Date();
      startObj.setDate(now.getDate() - 7);
      return { startDate: formatDateForInput(startObj), endDate: end };
    },
  },
  {
    id: '30d',
    label: 'Last 30 Days',
    getRange: () => {
      const now = new Date();
      const end = formatDateForInput(now);
      const startObj = new Date();
      startObj.setDate(now.getDate() - 30);
      return { startDate: formatDateForInput(startObj), endDate: end };
    },
  },
  {
    id: '3m',
    label: 'Last 3 Months',
    getRange: () => {
      const now = new Date();
      const end = formatDateForInput(now);
      const startObj = new Date();
      startObj.setMonth(now.getMonth() - 3);
      return { startDate: formatDateForInput(startObj), endDate: end };
    },
  },
  {
    id: '6m',
    label: 'Last 6 Months',
    getRange: () => {
      const now = new Date();
      const end = formatDateForInput(now);
      const startObj = new Date();
      startObj.setMonth(now.getMonth() - 6);
      return { startDate: formatDateForInput(startObj), endDate: end };
    },
  },
  {
    id: '1y',
    label: 'Last 1 Year',
    getRange: () => {
      const now = new Date();
      const end = formatDateForInput(now);
      const startObj = new Date();
      startObj.setFullYear(now.getFullYear() - 1);
      return { startDate: formatDateForInput(startObj), endDate: end };
    },
  },
  {
    id: 'ytd',
    label: 'Year to Date',
    getRange: () => {
      const now = new Date();
      const end = formatDateForInput(now);
      const startObj = new Date(now.getFullYear(), 0, 1);
      return { startDate: formatDateForInput(startObj), endDate: end };
    },
  },
  {
    id: 'all',
    label: 'All Available Data',
    getRange: () => {
      const now = new Date();
      const end = formatDateForInput(now);
      const startObj = new Date(now.getFullYear() - 5, 0, 1); // 5 years back
      return { startDate: formatDateForInput(startObj), endDate: end };
    },
  },
];

export const MONTHS = [
  { value: 1, name: 'January' },
  { value: 2, name: 'February' },
  { value: 3, name: 'March' },
  { value: 4, name: 'April' },
  { value: 5, name: 'May' },
  { value: 6, name: 'June' },
  { value: 7, name: 'July' },
  { value: 8, name: 'August' },
  { value: 9, name: 'September' },
  { value: 10, name: 'October' },
  { value: 11, name: 'November' },
  { value: 12, name: 'December' },
];

export function getYearsList(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 10; y--) {
    years.push(y);
  }
  return years;
}

export function getDateRangeForYearAndMonth(year: number, month: number): { startDate: string; endDate: string } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // last day of month
  const now = new Date();

  // Clamp end date to now if in current month
  let effectiveEnd = end;
  if (end.getTime() > now.getTime()) {
    effectiveEnd = now;
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: effectiveEnd.toISOString().split('T')[0],
  };
}

export function validateDateRange(
  startDate: string,
  endDate: string,
  timeframe: TimeframeId
): { isValid: boolean; error?: string; warning?: string } {
  if (!startDate || !endDate) {
    return { isValid: false, error: 'Please specify both start date and end date.' };
  }

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();

  if (isNaN(start) || isNaN(end)) {
    return { isValid: false, error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }

  if (start > end) {
    return { isValid: false, error: 'Start date cannot be after end date.' };
  }

  if (start > now) {
    return { isValid: false, error: 'Future dates are not allowed.' };
  }

  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (timeframe === '1m') {
    if (diffDays > 7) {
      return {
        isValid: false,
        error: `No 1-minute data is available for the selected date range (${diffDays} days). Maximum 7 days supported for 1-minute data on public feed. Please choose another timeframe or a shorter date range.`,
      };
    }
  } else if (['3m', '5m', '10m', '15m', '30m'].includes(timeframe)) {
    if (diffDays > 60) {
      return {
        isValid: true,
        warning: `Selected range is ${diffDays} days. Exchange public API limits intraday minute bars to the most recent ~60 days. Older bars will not be returned.`,
      };
    }
  }

  return { isValid: true };
}
