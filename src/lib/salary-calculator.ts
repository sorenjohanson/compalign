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
  
  // Utilization and fuzzy costs
  utilizationRate: number;
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
  
  // Real-world utilization and fuzzy costs
  utilizationRate: number; // % of working hours that are billable (0.6 = 60%)
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
  
  // Real-world utilization defaults (based on consulting industry averages)
  utilizationRate: 0.65, // 65% - realistic for consulting/professional services
  salesDemosHours: 2, // 2 hours per week on average
  internalMeetingsHours: 4, // 4 hours per week (team meetings, planning, etc.)
  adminTasksHours: 2, // 2 hours per week (timesheets, expenses, etc.)
  businessDevelopmentHours: 1, // 1 hour per week (networking, proposals)
  
  // Negotiation target (industry average for professional services)
  targetNetMargin: 25 // 25% target net margin for salary negotiations
};

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
  
  // Real-world billable hours using utilization rate
  const realBillableHoursPerYear = Math.floor(billableHoursPerYear * config.utilizationRate);
  
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
    utilizationRate: config.utilizationRate,
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

// Function to analyze different salary scenarios
export function analyzeSalaryScenarios(
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
    description: 'Specialized IT consulting and professional services',
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
    category: 'Freelancer Platforms',
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

export function generateNegotiationInsights(
  calculation: SalaryCalculation
): NegotiationInsight[] {
  const insights: NegotiationInsight[] = [];
  
  // Revenue analysis with utilization context
  insights.push({
    category: 'Revenue Generation',
    description: `Annual revenue at ${formatPercentage(calculation.utilizationRate * 100)} utilisation rate`,
    value: formatCurrency(calculation.annualRevenue),
    impact: 'positive'
  });
  
  // Utilisation efficiency
  insights.push({
    category: 'Utilisation Rate',
    description: 'Percentage of working hours that generate revenue',
    value: formatPercentage(calculation.utilizationRate * 100),
    impact: calculation.utilizationRate >= 0.7 ? 'positive' : calculation.utilizationRate >= 0.6 ? 'neutral' : 'negative'
  });
  
  // Fuzzy costs impact
  insights.push({
    category: 'Non-Billable Activities',
    description: 'Value of sales demos, meetings, and admin work performed',
    value: formatCurrency(calculation.fuzzyCostBreakdown.totalFuzzyCostValue),
    impact: 'negative'
  });
  
  // Employee hourly value
  insights.push({
    category: 'Employee Hourly Rate',
    description: 'Effective hourly rate based on total working hours',
    value: formatCurrency(calculation.employeeHourlyRate),
    impact: 'neutral'
  });
  
  // Company's effective rate
  insights.push({
    category: 'Total Employment Cost',
    description: 'Company\'s total hourly cost including social contributions',
    value: formatCurrency(calculation.employerCostHourlyRate),
    impact: 'neutral'
  });
  
  // Net margin with fuzzy costs considered
  insights.push({
    category: 'Company Net Margin',
    description: 'Company margin after all employment costs',
    value: `${formatCurrency(calculation.netMargin)} (${formatPercentage(calculation.netMarginPercentage)})`,
    impact: calculation.netMarginPercentage > 30 ? 'positive' : 'negative'
  });
  
  return insights;
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
  
  // Determine position relative to closest benchmark
  // @TODO: Rework this to not go to closest benchmark (because that's weird and illogical) but instead overall industry average
  let industryPosition: 'below' | 'within' | 'above';
  if (yourNetMargin < closestBenchmark.netMarginRange.min) {
    industryPosition = 'below';
  } else if (yourNetMargin > closestBenchmark.netMarginRange.max) {
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