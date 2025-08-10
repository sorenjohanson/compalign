// Re-export all types
export type {
	SalaryCalculation,
	CalculatorConfig,
	InputValues,
	NegotiationInsight,
	IndustryBenchmark,
	MarginComparison
} from './types';

export {
	defaultConfig,
	defaultInputValues,
	mockIndustryBenchmarks,
	generateMockMarginComparison
} from './config';

export {
	saveSettingsToStorage,
	loadSettingsFromStorage,
	clearSettingsFromStorage,
	saveInputValuesToStorage,
	loadInputValuesFromStorage,
	isProUnlocked,
	unlockPro,
	lockPro
} from './storage';

export {
	calculateSalaryBreakdown,
	analyseSalaryScenarios,
	findBreakEvenSalary,
	validateFuzzyHours
} from './calculations';

export {
	formatCurrency,
	formatPercentage
} from './formatting';

export {
	generateStrategicInsights,
	getIndustryMarginStats,
	getMarginStatus,
	getMarginPosition,
	generateMarginComparison
} from './analysis';
