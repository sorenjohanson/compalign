export interface SalaryCalculation {
	grossSalaryAnnual: number;
	customerHourlyRate: number;

	workingDaysPerYear: number;
	billableHoursPerYear: number;
	totalHoursPerYear: number;

	employerSocialContributions: number;
	totalEmployerCosts: number;

	employeeHourlyRate: number;
	employerCostHourlyRate: number;

	annualRevenue: number;
	grossMargin: number;
	grossMarginPercentage: number;
	netMargin: number;
	netMarginPercentage: number;

	utilisationRate: number;
	realBillableHoursPerYear: number;
	fuzzyCostBreakdown: {
		salesDemos: { hoursPerWeek: number; annualHours: number; costValue: number };
		internalMeetings: { hoursPerWeek: number; annualHours: number; costValue: number };
		adminTasks: { hoursPerWeek: number; annualHours: number; costValue: number };
		businessDevelopment: { hoursPerWeek: number; annualHours: number; costValue: number };
		totalFuzzyCostValue: number;
	};

	nonBillableTimeValue: number;
	employerContributionValue: number;
	overheadCosts: number;
}

export interface CalculatorConfig {
	employerSocialContributionRate: number;
	vacationDays: number;
	sickDaysEstimate: number;
	trainingDays: number;
	publicHolidays: number;
	workingDaysPerWeek: number;
	hoursPerWorkingDay: number;

	salesDemosHours: number;
	internalMeetingsHours: number;
	adminTasksHours: number;
	businessDevelopmentHours: number;

	targetNetMargin: number;

	overheadAsPercentOfRevenue: number;
}

export interface InputValues {
	grossSalary: number;
	customerRate: number;
}

export interface NegotiationInsight {
	category: string;
	description: string;
	value: string;
	impact: 'positive' | 'negative' | 'neutral';
}

export interface IndustryBenchmark {
	category: string;
	netMarginRange: { min: number; max: number };
	grossMarginRange: { min: number; max: number };
	description: string;
	source: string;
}

export interface MarginComparison {
	yourNetMargin: number;
	yourGrossMargin: number;
	industryPosition: 'below' | 'within' | 'above';
	closestBenchmark: IndustryBenchmark;
	recommendations: string[];
}