import type {
	CalculatorConfig,
	InputValues,
	IndustryBenchmark,
	MarginComparison,
	SalaryCalculation
} from './types';

export const defaultConfig: CalculatorConfig = {
	employerSocialContributionRate: 0.2, // 20%
	vacationDays: 30,
	sickDaysEstimate: 9.5, // Average in 2025 for Germany
	trainingDays: 10, // Professional development
	publicHolidays: 11, // Average for Germany
	workingDaysPerWeek: 5,
	hoursPerWorkingDay: 8,

	// Non-billable work defaults (based on consulting industry averages)
	salesDemosHours: 2, // 2 hours per week on average
	internalMeetingsHours: 4, // 4 hours per week (team meetings, planning, etc.)
	adminTasksHours: 2, // 2 hours per week (timesheets, expenses, etc.)
	businessDevelopmentHours: 1, // 1 hour per week (networking, proposals)

	// Negotiation target (industry average for professional services)
	targetNetMargin: 25, // 25% target net margin for salary negotiations

	// Overhead costs (office, admin, tools, marketing, etc.)
	overheadAsPercentOfRevenue: 0.15 // 15% of revenue goes to overhead costs
};

export const defaultInputValues: InputValues = {
	grossSalary: 90000,
	customerRate: 110
};

// Mock data for display when Pro is not enabled
export const mockIndustryBenchmarks: IndustryBenchmark[] = [
	{
		category: 'Sample Industry Data',
		netMarginRange: { min: 10, max: 25 },
		grossMarginRange: { min: 20, max: 40 },
		description: 'Example industry benchmark data',
		source: 'Sample Data'
	}
];

export function generateMockMarginComparison(calculation: SalaryCalculation): MarginComparison {
	return {
		yourNetMargin: calculation.netMarginPercentage,
		yourGrossMargin: calculation.grossMarginPercentage,
		industryPosition: 'within' as const,
		closestBenchmark: mockIndustryBenchmarks[0],
		recommendations: [
			'Upgrade to Pro to see real industry benchmark data',
			'Compare against actual market standards',
			'Get personalized recommendations'
		]
	};
}
