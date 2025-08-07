// German Salary Negotiation Calculator Logic
// For use in Svelte 5 component

export interface SalaryCalculation {
  // Input values
  grossSalaryAnnual: number;
  customerHourlyRate: number;
  
  // Time calculations
  workingDaysPerYear: number;
  billableHoursPerYear: number;
  totalHoursPerYear: number;
  
  // Cost breakdown
  employerSocialContributions: number;
  totalEmployerCosts: number;
  
  // Rate calculations
  employeeHourlyRate: number;
  employerCostHourlyRate: number;
  
  // Revenue and margins
  annualRevenue: number;
  grossMargin: number;
  grossMarginPercentage: number;
  netMargin: number;
  netMarginPercentage: number;
  
  // Utilisation and fuzzy costs
  utilisationRate: number;
  realBillableHoursPerYear: number;
  fuzzyCostBreakdown: {
    salesDemos: { hoursPerWeek: number; annualHours: number; costValue: number };
    internalMeetings: { hoursPerWeek: number; annualHours: number; costValue: number };
    adminTasks: { hoursPerWeek: number; annualHours: number; costValue: number };
    businessDevelopment: { hoursPerWeek: number; annualHours: number; costValue: number };
    totalFuzzyCostValue: number;
  };
  
  // Breakdowns
  nonBillableTimeValue: number;
  employerContributionValue: number;
}

export interface CalculatorConfig {
  // German employment defaults
  employerSocialContributionRate: number; // 20% employer social contributions
  vacationDays: number; // 30 days vacation
  sickDaysEstimate: number; // Estimated sick days per year
  trainingDays: number; // Internal training/development days
  publicHolidays: number; // German public holidays (varies by state, ~10-13)
  workingDaysPerWeek: number; // 5 days
  hoursPerWorkingDay: number; // 8 hours
  
  // Real-world utilisation and fuzzy costs
  utilisationRate: number; // % of working hours that are billable (0.6 = 60%)
  salesDemosHours: number; // Hours per week on sales demos
  internalMeetingsHours: number; // Hours per week on internal meetings
  adminTasksHours: number; // Hours per week on admin/paperwork
  businessDevelopmentHours: number; // Hours per week on BD activities
  
  // Target margin for negotiation positioning
  targetNetMargin: number; // Target company net margin percentage for negotiations
}

export const defaultConfig: CalculatorConfig = {
  employerSocialContributionRate: 0.20, // 20%
  vacationDays: 30,
  sickDaysEstimate: 8, // Conservative estimate
  trainingDays: 10, // Professional development
  publicHolidays: 11, // Average for Germany
  workingDaysPerWeek: 5,
  hoursPerWorkingDay: 8,
  
  // Real-world utilisation defaults (based on consulting industry averages)
  utilisationRate: 0.65, // 65% - realistic for consulting/professional services
  salesDemosHours: 2, // 2 hours per week on average
  internalMeetingsHours: 4, // 4 hours per week (team meetings, planning, etc.)
  adminTasksHours: 2, // 2 hours per week (timesheets, expenses, etc.)
  businessDevelopmentHours: 1, // 1 hour per week (networking, proposals)
  
  // Negotiation target (industry average for professional services)
  targetNetMargin: 25 // 25% target net margin for salary negotiations
};

// localStorage utilities for settings persistence
const SETTINGS_STORAGE_KEY = 'salary-calculator-settings';
const INPUT_VALUES_STORAGE_KEY = 'salary-calculator-inputs';

export function saveSettingsToStorage(config: CalculatorConfig): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
}

export function loadSettingsFromStorage(): CalculatorConfig {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CalculatorConfig;
        // Validate that all required properties exist, merge with defaults for missing ones
        return {
          ...defaultConfig,
          ...parsed
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  return defaultConfig;
}

export function clearSettingsFromStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear settings from localStorage:', error);
  }
}

// Input values persistence
export interface InputValues {
  grossSalary: number;
  customerRate: number;
}

export const defaultInputValues: InputValues = {
  grossSalary: 90000,
  customerRate: 110
};

export function saveInputValuesToStorage(inputs: InputValues): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(INPUT_VALUES_STORAGE_KEY, JSON.stringify(inputs));
    }
  } catch (error) {
    console.warn('Failed to save input values to localStorage:', error);
  }
}

export function loadInputValuesFromStorage(): InputValues {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(INPUT_VALUES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as InputValues;
        return {
          ...defaultInputValues,
          ...parsed
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load input values from localStorage:', error);
  }
  return defaultInputValues;
}

export function calculateSalaryBreakdown(
  grossSalaryAnnual: number,
  customerHourlyRate: number,
  config: CalculatorConfig = defaultConfig
): SalaryCalculation {
  
  // Calculate working days and hours
  const totalCalendarDays = 365;
  const weekends = 52 * 2; // 104 weekend days
  const potentialWorkingDays = totalCalendarDays - weekends;
  
  const nonWorkingDays = 
    config.vacationDays + 
    config.sickDaysEstimate + 
    config.trainingDays + 
    config.publicHolidays;
  
  const workingDaysPerYear = potentialWorkingDays - nonWorkingDays;
  const totalHoursPerYear = workingDaysPerYear * config.hoursPerWorkingDay;
  
  // Traditional billable hours (excluding training days as they're typically non-billable)
  const billableDays = workingDaysPerYear - config.trainingDays;
  const billableHoursPerYear = billableDays * config.hoursPerWorkingDay;
  
  // Real-world billable hours using utilisation rate
  const realBillableHoursPerYear = Math.floor(billableHoursPerYear * config.utilisationRate);
  
  // Calculate fuzzy cost breakdown
  const workingWeeksPerYear = Math.floor(workingDaysPerYear / 5); // Convert days to weeks
  const salesDemosAnnual = config.salesDemosHours * workingWeeksPerYear;
  const internalMeetingsAnnual = config.internalMeetingsHours * workingWeeksPerYear;
  const adminTasksAnnual = config.adminTasksHours * workingWeeksPerYear;
  const businessDevelopmentAnnual = config.businessDevelopmentHours * workingWeeksPerYear;
  
  const fuzzyCostBreakdown = {
    salesDemos: {
      hoursPerWeek: config.salesDemosHours,
      annualHours: salesDemosAnnual,
      costValue: salesDemosAnnual * customerHourlyRate
    },
    internalMeetings: {
      hoursPerWeek: config.internalMeetingsHours,
      annualHours: internalMeetingsAnnual,
      costValue: internalMeetingsAnnual * customerHourlyRate
    },
    adminTasks: {
      hoursPerWeek: config.adminTasksHours,
      annualHours: adminTasksAnnual,
      costValue: adminTasksAnnual * customerHourlyRate
    },
    businessDevelopment: {
      hoursPerWeek: config.businessDevelopmentHours,
      annualHours: businessDevelopmentAnnual,
      costValue: businessDevelopmentAnnual * customerHourlyRate
    },
    totalFuzzyCostValue: (salesDemosAnnual + internalMeetingsAnnual + adminTasksAnnual + businessDevelopmentAnnual) * customerHourlyRate
  };
  
  // Employer costs
  const employerSocialContributions = grossSalaryAnnual * config.employerSocialContributionRate;
  const totalEmployerCosts = grossSalaryAnnual + employerSocialContributions;
  
  // Hourly rates
  const employeeHourlyRate = grossSalaryAnnual / totalHoursPerYear;
  const employerCostHourlyRate = totalEmployerCosts / totalHoursPerYear;
  
  // Revenue calculations using real billable hours
  const annualRevenue = realBillableHoursPerYear * customerHourlyRate;
  
  // Margin calculations
  const grossMargin = annualRevenue - grossSalaryAnnual;
  const grossMarginPercentage = annualRevenue > 0 ? (grossMargin / annualRevenue) * 100 : 0;
  
  const netMargin = annualRevenue - totalEmployerCosts;
  const netMarginPercentage = annualRevenue > 0 ? (netMargin / annualRevenue) * 100 : 0;
  
  // Value of non-billable time and employer contributions
  const nonBillableHours = totalHoursPerYear - realBillableHoursPerYear;
  const nonBillableTimeValue = nonBillableHours * customerHourlyRate;
  const employerContributionValue = employerSocialContributions;
  
  return {
    grossSalaryAnnual,
    customerHourlyRate,
    workingDaysPerYear,
    billableHoursPerYear,
    totalHoursPerYear,
    employerSocialContributions,
    totalEmployerCosts,
    employeeHourlyRate,
    employerCostHourlyRate,
    annualRevenue,
    grossMargin,
    grossMarginPercentage,
    netMargin,
    netMarginPercentage,
    utilisationRate: config.utilisationRate,
    realBillableHoursPerYear,
    fuzzyCostBreakdown,
    nonBillableTimeValue,
    employerContributionValue
  };
}

// Utility function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Utility function to format percentage
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

// Function to analyse different salary scenarios
export function analyseSalaryScenarios(
  salaryOptions: number[],
  customerHourlyRate: number,
  config: CalculatorConfig = defaultConfig
): SalaryCalculation[] {
  return salaryOptions.map(salary => 
    calculateSalaryBreakdown(salary, customerHourlyRate, config)
  );
}

// Function to find break-even salary (where net margin = 0)
export function findBreakEvenSalary(
  customerHourlyRate: number,
  config: CalculatorConfig = defaultConfig
): number {
  // Binary search for break-even point
  let low = 30000;
  let high = 200000;
  let tolerance = 100;
  
  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const calculation = calculateSalaryBreakdown(mid, customerHourlyRate, config);
    
    if (calculation.netMargin > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return (low + high) / 2;
}

// Analysis helper for negotiation insights
export interface NegotiationInsight {
  category: string;
  description: string;
  value: string;
  impact: 'positive' | 'negative' | 'neutral';
}

// Industry benchmark data for margin comparisons
export interface IndustryBenchmark {
  category: string;
  netMarginRange: { min: number; max: number };
  grossMarginRange: { min: number; max: number };
  description: string;
  source: string;
}

export const industryBenchmarks: IndustryBenchmark[] = [
  {
    category: 'Staffing Agencies (Full-time)',
    netMarginRange: { min: 5, max: 10 },
    grossMarginRange: { min: 15.3, max: 32.6 },
    description: 'Traditional staffing agencies placing full-time employees',
    source: '2024 Industry Data'
  },
  {
    category: 'IT Consulting Firms',
    netMarginRange: { min: 8, max: 15 },
    grossMarginRange: { min: 25, max: 45 },
    description: 'Specialised IT consulting and professional services',
    source: '2024 Industry Data'
  },
  {
    category: 'Recruitment Agencies (Permanent)',
    netMarginRange: { min: 15, max: 25 },
    grossMarginRange: { min: 15, max: 30 },
    description: 'Agencies placing permanent employees with placement fees',
    source: '2024 Industry Data'
  },
  {
    category: 'Recruitment Agencies (Freelancers)',
    netMarginRange: { min: 10, max: 35 },
    grossMarginRange: { min: 20, max: 50 },
    description: 'Platforms and agencies managing freelance contractors',
    source: '2024 Industry Data'
  }
];

export interface MarginComparison {
  yourNetMargin: number;
  yourGrossMargin: number;
  industryPosition: 'below' | 'within' | 'above';
  closestBenchmark: IndustryBenchmark;
  recommendations: string[];
}

// Strategic insights for financial analysis (non-duplicative)
export function generateStrategicInsights(
  calculation: SalaryCalculation,
  config: CalculatorConfig
): NegotiationInsight[] {
  const insights: NegotiationInsight[] = [];
  
  // Utilisation efficiency analysis
  const utilisationGap = (1 - calculation.utilisationRate) * calculation.totalHoursPerYear;
  insights.push({
    category: 'Utilisation Efficiency',
    description: `${utilisationGap.toFixed(0)} hours of non-billable time annually`,
    value: formatPercentage(calculation.utilisationRate * 100),
    impact: calculation.utilisationRate >= 0.7 ? 'positive' : calculation.utilisationRate >= 0.6 ? 'neutral' : 'negative'
  });
  
  // Revenue multiplier analysis
  const revenueMultiplier = calculation.annualRevenue / calculation.grossSalaryAnnual;
  insights.push({
    category: 'Revenue Multiplier',
    description: 'How many times salary is generated in revenue',
    value: `${revenueMultiplier.toFixed(1)}x`,
    impact: revenueMultiplier >= 3 ? 'positive' : revenueMultiplier >= 2 ? 'neutral' : 'negative'
  });
  
  // Target margin performance
  const marginGap = calculation.netMarginPercentage - config.targetNetMargin;
  insights.push({
    category: 'Target Performance',
    description: marginGap >= 0 ? 'Exceeding target margin' : 'Below target margin',
    value: `${marginGap >= 0 ? '+' : ''}${marginGap.toFixed(1)}%`,
    impact: marginGap >= 0 ? 'positive' : 'negative'
  });
  
  // Break-even analysis
  const breakEvenRevenue = calculation.totalEmployerCosts;
  const breakEvenHours = Math.ceil(breakEvenRevenue / calculation.customerHourlyRate);
  insights.push({
    category: 'Break-Even Point',
    description: 'Billable hours needed to cover all costs',
    value: `${breakEvenHours}h`,
    impact: breakEvenHours <= calculation.realBillableHoursPerYear ? 'positive' : 'negative'
  });
  
  // Profit per hour analysis
  const profitPerHour = calculation.netMargin / calculation.totalHoursPerYear;
  insights.push({
    category: 'Profit Per Hour',
    description: 'Net profit generated per actual working hour',
    value: formatCurrency(profitPerHour),
    impact: profitPerHour >= 20 ? 'positive' : profitPerHour >= 10 ? 'neutral' : 'negative'
  });
  
  return insights;
}

// Helper function to get industry low, average, and high values
export function getIndustryMarginStats() {
  const allMins = industryBenchmarks.map(b => b.netMarginRange.min);
  const allMaxs = industryBenchmarks.map(b => b.netMarginRange.max);
  const allAvgs = industryBenchmarks.map(b => (b.netMarginRange.min + b.netMarginRange.max) / 2);
  
  return {
    industryLow: Math.min(...allMins),
    industryHigh: Math.max(...allMaxs),
    industryAverage: allAvgs.reduce((sum, avg) => sum + avg, 0) / allAvgs.length
  };
}

// Function to determine margin position relative to industry standards
export function getMarginPosition(netMarginPercentage: number): 'below_low' | 'average' | 'above_high' {
  const { industryLow, industryHigh } = getIndustryMarginStats();
  
  if (netMarginPercentage < industryLow) {
    return 'below_low';
  } else if (netMarginPercentage > industryHigh) {
    return 'above_high';
  } else {
    return 'average';
  }
}

// Function to compare margins with industry benchmarks
export function generateMarginComparison(
  calculation: SalaryCalculation
): MarginComparison {
  const yourNetMargin = calculation.netMarginPercentage;
  const yourGrossMargin = calculation.grossMarginPercentage;
  
  // Find the closest industry benchmark
  let closestBenchmark = industryBenchmarks[0];
  let minDistance = Math.abs(yourNetMargin - (closestBenchmark.netMarginRange.min + closestBenchmark.netMarginRange.max) / 2);
  
  for (const benchmark of industryBenchmarks) {
    const avgNetMargin = (benchmark.netMarginRange.min + benchmark.netMarginRange.max) / 2;
    const distance = Math.abs(yourNetMargin - avgNetMargin);
    if (distance < minDistance) {
      minDistance = distance;
      closestBenchmark = benchmark;
    }
  }
  
  // Determine position relative to industry standards (updated to use overall industry range)
  const { industryLow, industryHigh } = getIndustryMarginStats();
  let industryPosition: 'below' | 'within' | 'above';
  if (yourNetMargin < industryLow) {
    industryPosition = 'below';
  } else if (yourNetMargin > industryHigh) {
    industryPosition = 'above';
  } else {
    industryPosition = 'within';
  }
  
  // Generate recommendations based on position
  const recommendations: string[] = [];
  
  if (industryPosition === 'above') {
    recommendations.push('Current margin significantly exceeds industry standards, indicating healthy profitability');
    recommendations.push('Strong margins allow flexibility for salary adjustments whilst maintaining business sustainability');
    recommendations.push('Consider investing in employee retention and growth with competitive compensation');
  } else if (industryPosition === 'within') {
    recommendations.push('Margin aligns with industry standards, providing a balanced foundation');
    recommendations.push('Current compensation structure appears market-competitive based on industry benchmarks');
    recommendations.push('Focus on value-added services and efficiency improvements to optimise margins');
  } else {
    recommendations.push('Current margins are below industry standards, suggesting room for optimisation');
    recommendations.push('Consider reviewing operational efficiency and pricing strategies');
    recommendations.push('Salary adjustments should be balanced with margin improvement initiatives');
  }
  
  return {
    yourNetMargin,
    yourGrossMargin,
    industryPosition,
    closestBenchmark,
    recommendations
  };
}