import type { SalaryCalculation, CalculatorConfig } from './types';
import { defaultConfig } from './config';

export function calculateSalaryBreakdown(
	grossSalaryAnnual: number,
	customerHourlyRate: number,
	config: CalculatorConfig = defaultConfig
): SalaryCalculation {
	const totalCalendarDays = 365;
	const weekends = 52 * 2;
	const potentialWorkingDays = totalCalendarDays - weekends;

	const nonWorkingDays =
		config.vacationDays + config.sickDaysEstimate + config.trainingDays + config.publicHolidays;

	const workingDaysPerYear = potentialWorkingDays - nonWorkingDays;
	const totalHoursPerYear = workingDaysPerYear * config.hoursPerWorkingDay;

	const workingWeeksPerYear = Math.floor(workingDaysPerYear / 5);
	const maxWeeklyHours = config.workingDaysPerWeek * config.hoursPerWorkingDay;
	const totalFuzzyHoursPerWeek =
		config.salesDemosHours +
		config.internalMeetingsHours +
		config.adminTasksHours +
		config.businessDevelopmentHours;

	const validatedFuzzyHours = Math.min(totalFuzzyHoursPerWeek, maxWeeklyHours);
	const fuzzyHoursRatio =
		validatedFuzzyHours > 0 ? validatedFuzzyHours / totalFuzzyHoursPerWeek : 1;

	const adjustedSalesDemosHours = config.salesDemosHours * fuzzyHoursRatio;
	const adjustedInternalMeetingsHours = config.internalMeetingsHours * fuzzyHoursRatio;
	const adjustedAdminTasksHours = config.adminTasksHours * fuzzyHoursRatio;
	const adjustedBusinessDevelopmentHours = config.businessDevelopmentHours * fuzzyHoursRatio;

	const totalNonBillableHoursPerDay = validatedFuzzyHours / config.workingDaysPerWeek;
	const billableHoursPerDay = config.hoursPerWorkingDay - totalNonBillableHoursPerDay;
	const realBillableHoursPerYear = Math.floor(billableHoursPerDay * workingDaysPerYear);

	const utilisationRate = totalHoursPerYear > 0 ? realBillableHoursPerYear / totalHoursPerYear : 0;

	const billableHoursPerYear = totalHoursPerYear;

	const salesDemosAnnual = adjustedSalesDemosHours * workingWeeksPerYear;
	const internalMeetingsAnnual = adjustedInternalMeetingsHours * workingWeeksPerYear;
	const adminTasksAnnual = adjustedAdminTasksHours * workingWeeksPerYear;
	const businessDevelopmentAnnual = adjustedBusinessDevelopmentHours * workingWeeksPerYear;

	const fuzzyCostBreakdown = {
		salesDemos: {
			hoursPerWeek: adjustedSalesDemosHours,
			annualHours: salesDemosAnnual,
			costValue: salesDemosAnnual * customerHourlyRate
		},
		internalMeetings: {
			hoursPerWeek: adjustedInternalMeetingsHours,
			annualHours: internalMeetingsAnnual,
			costValue: internalMeetingsAnnual * customerHourlyRate
		},
		adminTasks: {
			hoursPerWeek: adjustedAdminTasksHours,
			annualHours: adminTasksAnnual,
			costValue: adminTasksAnnual * customerHourlyRate
		},
		businessDevelopment: {
			hoursPerWeek: adjustedBusinessDevelopmentHours,
			annualHours: businessDevelopmentAnnual,
			costValue: businessDevelopmentAnnual * customerHourlyRate
		},
		totalFuzzyCostValue:
			(salesDemosAnnual + internalMeetingsAnnual + adminTasksAnnual + businessDevelopmentAnnual) *
			customerHourlyRate
	};

	const employerSocialContributions = grossSalaryAnnual * config.employerSocialContributionRate;
	const totalEmployerCosts = grossSalaryAnnual + employerSocialContributions;

	const employeeHourlyRate = grossSalaryAnnual / totalHoursPerYear;
	const employerCostHourlyRate = totalEmployerCosts / totalHoursPerYear;

	const annualRevenue = realBillableHoursPerYear * customerHourlyRate;

	const overheadCosts = annualRevenue * config.overheadAsPercentOfRevenue;

	const grossMargin = annualRevenue - grossSalaryAnnual;
	const grossMarginPercentage = annualRevenue > 0 ? (grossMargin / annualRevenue) * 100 : 0;

	const netMargin = annualRevenue - totalEmployerCosts - overheadCosts;
	const netMarginPercentage = annualRevenue > 0 ? (netMargin / annualRevenue) * 100 : 0;

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
		utilisationRate,
		realBillableHoursPerYear,
		fuzzyCostBreakdown,
		nonBillableTimeValue,
		employerContributionValue,
		overheadCosts
	};
}

export function analyseSalaryScenarios(
	salaryOptions: number[],
	customerHourlyRate: number,
	config: CalculatorConfig = defaultConfig
): SalaryCalculation[] {
	return salaryOptions.map((salary) =>
		calculateSalaryBreakdown(salary, customerHourlyRate, config)
	);
}

export function findBreakEvenSalary(
	customerHourlyRate: number,
	config: CalculatorConfig = defaultConfig
): number {
	let low = 30000;
	let high = 200000;
	const tolerance = 100;

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

export function validateFuzzyHours(config: CalculatorConfig): {
	isValid: boolean;
	totalFuzzyHours: number;
	maxWeeklyHours: number;
	exceededBy: number;
} {
	const totalFuzzyHours =
		config.salesDemosHours +
		config.internalMeetingsHours +
		config.adminTasksHours +
		config.businessDevelopmentHours;
	const maxWeeklyHours = config.workingDaysPerWeek * config.hoursPerWorkingDay;
	const exceededBy = Math.max(0, totalFuzzyHours - maxWeeklyHours);

	return {
		isValid: totalFuzzyHours <= maxWeeklyHours,
		totalFuzzyHours,
		maxWeeklyHours,
		exceededBy
	};
}
