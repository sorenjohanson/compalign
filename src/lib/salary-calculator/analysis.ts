import type {
	SalaryCalculation,
	CalculatorConfig,
	NegotiationInsight,
	IndustryBenchmark,
	MarginComparison
} from './types';
import { defaultConfig } from './config';
import { formatCurrency, formatPercentage } from './formatting';

export function generateStrategicInsights(
	calculation: SalaryCalculation,
	config: CalculatorConfig
): NegotiationInsight[] {
	const insights: NegotiationInsight[] = [];

	const utilisationGap = (1 - calculation.utilisationRate) * calculation.totalHoursPerYear;
	insights.push({
		category: 'Utilisation Efficiency',
		description: `${utilisationGap.toFixed(0)} hours of non-billable time annually`,
		value: formatPercentage(calculation.utilisationRate * 100),
		impact:
			calculation.utilisationRate >= 0.7
				? 'positive'
				: calculation.utilisationRate >= 0.6
					? 'neutral'
					: 'negative'
	});

	const revenueMultiplier = calculation.annualRevenue / calculation.grossSalaryAnnual;
	insights.push({
		category: 'Revenue Multiplier',
		description: 'How many times salary is generated in revenue',
		value: `${revenueMultiplier.toFixed(1)}x`,
		impact: revenueMultiplier >= 3 ? 'positive' : revenueMultiplier >= 2 ? 'neutral' : 'negative'
	});

	const marginGap = calculation.netMarginPercentage - config.targetNetMargin;
	const marginStatus = getMarginStatus(calculation.netMarginPercentage, config.targetNetMargin);

	let description: string;
	let impact: 'positive' | 'negative' | 'neutral';

	if (marginStatus === 'above') {
		description = 'Exceeding target margin';
		impact = 'positive';
	} else if (marginStatus === 'exact') {
		description = 'Meeting target margin';
		impact = 'neutral';
	} else {
		description = 'Below target margin';
		impact = 'negative';
	}

	insights.push({
		category: 'Target Performance',
		description,
		value: `${marginGap >= 0 ? '+' : ''}${marginGap.toFixed(1)}%`,
		impact
	});

	const breakEvenRevenue = calculation.totalEmployerCosts;
	const breakEvenHours = Math.ceil(breakEvenRevenue / calculation.customerHourlyRate);
	insights.push({
		category: 'Break-Even Point',
		description: 'Billable hours needed to cover all costs',
		value: `${breakEvenHours} h`,
		impact: breakEvenHours <= calculation.realBillableHoursPerYear ? 'positive' : 'negative'
	});

	const profitPerHour = calculation.netMargin / calculation.totalHoursPerYear;
	insights.push({
		category: 'Profit Per Hour',
		description: 'Net profit generated per actual working hour',
		value: formatCurrency(profitPerHour),
		impact: profitPerHour >= 20 ? 'positive' : profitPerHour >= 10 ? 'neutral' : 'negative'
	});

	return insights;
}

export function getIndustryMarginStats(benchmarks: IndustryBenchmark[] = []) {
	if (benchmarks.length === 0) {
		return {
			industryLow: 0,
			industryHigh: 0,
			industryAverage: 0
		};
	}

	const allMins = benchmarks.map((b) => b.netMarginRange.min);
	const allMaxs = benchmarks.map((b) => b.netMarginRange.max);
	const allAvgs = benchmarks.map((b) => (b.netMarginRange.min + b.netMarginRange.max) / 2);

	return {
		industryLow: Math.min(...allMins),
		industryHigh: Math.max(...allMaxs),
		industryAverage: allAvgs.reduce((sum, avg) => sum + avg, 0) / allAvgs.length
	};
}

export function getMarginStatus(
	actualMargin: number,
	targetMargin: number,
	tolerance: number = 0.5
): 'above' | 'exact' | 'below' {
	const diff = actualMargin - targetMargin;

	if (Math.abs(diff) <= tolerance) {
		return 'exact';
	} else if (diff > tolerance) {
		return 'above';
	} else {
		return 'below';
	}
}

export function getMarginPosition(
	netMarginPercentage: number
): 'below_low' | 'average' | 'above_high' {
	const { industryLow, industryHigh } = getIndustryMarginStats();

	if (netMarginPercentage < industryLow) {
		return 'below_low';
	} else if (netMarginPercentage > industryHigh) {
		return 'above_high';
	} else {
		return 'average';
	}
}

export function generateMarginComparison(
	calculation: SalaryCalculation,
	benchmarks: IndustryBenchmark[] = []
): MarginComparison {
	const yourNetMargin = calculation.netMarginPercentage;
	const yourGrossMargin = calculation.grossMarginPercentage;

	// Handle case where no benchmarks are provided
	if (benchmarks.length === 0) {
		return {
			yourNetMargin,
			yourGrossMargin,
			industryPosition: 'within' as const,
			closestBenchmark: {
				category: 'No data available',
				netMarginRange: { min: 0, max: 0 },
				grossMarginRange: { min: 0, max: 0 },
				description: 'No industry benchmark data available',
				source: 'N/A'
			},
			recommendations: ['Industry benchmark data not available']
		};
	}

	let closestBenchmark = benchmarks[0];
	let minDistance = Math.abs(
		yourNetMargin - (closestBenchmark.netMarginRange.min + closestBenchmark.netMarginRange.max) / 2
	);

	for (const benchmark of benchmarks) {
		const avgNetMargin = (benchmark.netMarginRange.min + benchmark.netMarginRange.max) / 2;
		const distance = Math.abs(yourNetMargin - avgNetMargin);
		if (distance < minDistance) {
			minDistance = distance;
			closestBenchmark = benchmark;
		}
	}

	const { industryLow, industryHigh } = getIndustryMarginStats(benchmarks);
	let industryPosition: 'below' | 'within' | 'above';
	if (yourNetMargin < industryLow) {
		industryPosition = 'below';
	} else if (yourNetMargin > industryHigh) {
		industryPosition = 'above';
	} else {
		industryPosition = 'within';
	}

	const recommendations: string[] = [];

	if (industryPosition === 'above') {
		recommendations.push(
			'Current margin significantly exceeds industry standards, indicating healthy profitability'
		);
		recommendations.push(
			'Strong margins allow flexibility for salary adjustments whilst maintaining business sustainability'
		);
		recommendations.push(
			'Consider investing in employee retention and growth with competitive compensation'
		);
	} else if (industryPosition === 'within') {
		recommendations.push('Margin aligns with industry standards, providing a balanced foundation');
		recommendations.push(
			'Current compensation structure appears market-competitive based on industry benchmarks'
		);
		recommendations.push(
			'Focus on value-added services and efficiency improvements to optimise margins'
		);
	} else {
		recommendations.push(
			'Current margins are below industry standards, suggesting room for optimisation'
		);
		recommendations.push('Consider reviewing operational efficiency and pricing strategies');
		recommendations.push(
			'Salary adjustments should be balanced with margin improvement initiatives'
		);
	}

	return {
		yourNetMargin,
		yourGrossMargin,
		industryPosition,
		closestBenchmark,
		recommendations
	};
}
