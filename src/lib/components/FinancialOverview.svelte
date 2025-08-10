<script lang="ts">
	import { TrendingUp, Euro, Target } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { formatCurrency, formatPercentage } from '$lib/salary-calculator';
	import type { SalaryCalculation, CalculatorConfig } from '$lib/salary-calculator';

	let { calculation, config } = $props();
</script>

<!-- Financial Overview -->
<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center gap-2">
			<TrendingUp class="h-5 w-5 text-primary" />
			Financial Overview
		</Card.Title>
		<Card.Description>Complete breakdown of revenue, costs and profitability</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-1 gap-6 sm:gap-8 lg:h-80 lg:grid-cols-3">
			<!-- Revenue Column -->
			<div
				class="flex h-full flex-col rounded-lg border border-cyan-200/50 bg-cyan-50/50 p-4 dark:border-cyan-800/50 dark:bg-cyan-950/20"
			>
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded bg-cyan-100 p-1.5 dark:bg-cyan-900/50">
						<TrendingUp class="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
					</div>
					<h4
						class="text-sm font-semibold tracking-wide text-cyan-700 uppercase dark:text-cyan-300"
					>
						Revenue
					</h4>
				</div>
				<div class="flex flex-1 flex-col justify-between space-y-3">
					<div class="space-y-3">
						<div class="flex items-center justify-between py-1">
							<span class="text-sm text-gray-600 dark:text-gray-300">Billable Hours</span>
							<span class="font-semibold text-gray-900 dark:text-gray-100"
								>{calculation.realBillableHoursPerYear} h</span
							>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-sm text-gray-600 dark:text-gray-300">Hourly Rate</span>
							<span class="font-semibold text-gray-900 dark:text-gray-100"
								>{formatCurrency(calculation.customerHourlyRate)}</span
							>
						</div>
					</div>
					<div class="space-y-3">
						<div class="border-t border-cyan-200 pt-3 dark:border-cyan-700">
							<div class="flex items-center justify-between">
								<span class="font-medium text-gray-900 dark:text-gray-100"
									>Total Annual Revenue</span
								>
								<span class="text-lg font-bold text-cyan-700 dark:text-cyan-300"
									>{formatCurrency(calculation.annualRevenue)}</span
								>
							</div>
						</div>
						<div
							class="rounded border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50"
						>
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600 dark:text-gray-400">Non-billable Time Value</span>
								<span class="font-medium text-gray-700 dark:text-gray-300"
									>{formatCurrency(calculation.nonBillableTimeValue)}</span
								>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Costs Column -->
			<div
				class="flex h-full flex-col rounded-lg border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20"
			>
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded bg-amber-100 p-1.5 dark:bg-amber-900/50">
						<Euro class="h-4 w-4 text-amber-600 dark:text-amber-300" />
					</div>
					<h4
						class="text-sm font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300"
					>
						Costs
					</h4>
				</div>
				<div class="flex flex-1 flex-col justify-between space-y-3">
					<div class="space-y-3">
						<div class="flex items-center justify-between py-1">
							<span class="text-sm text-gray-600 dark:text-gray-300">Gross Salary</span>
							<span class="font-semibold text-gray-900 dark:text-gray-100"
								>{formatCurrency(calculation.grossSalaryAnnual)}</span
							>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-sm text-gray-600 dark:text-gray-300"
								>Employer Costs ({formatPercentage(
									config.employerSocialContributionRate * 100
								)})</span
							>
							<span class="font-semibold text-amber-700 dark:text-amber-300"
								>+{formatCurrency(calculation.employerSocialContributions)}</span
							>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-sm text-gray-600 dark:text-gray-300"
								>Overhead ({formatPercentage(config.overheadAsPercentOfRevenue * 100)})</span
							>
							<span class="font-semibold text-amber-700 dark:text-amber-300"
								>+{formatCurrency(calculation.overheadCosts)}</span
							>
						</div>
					</div>
					<div class="space-y-3">
						<div class="border-t border-amber-200 pt-3 dark:border-amber-700">
							<div class="flex items-center justify-between">
								<span class="font-medium text-gray-900 dark:text-gray-100">Total Costs</span>
								<span class="text-lg font-bold text-amber-700 dark:text-amber-300"
									>{formatCurrency(
										calculation.totalEmployerCosts + calculation.overheadCosts
									)}</span
								>
							</div>
						</div>
						<div
							class="rounded border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50"
						>
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600 dark:text-gray-400">Per Hour Cost</span>
								<span class="font-medium text-gray-700 dark:text-gray-300"
									>{formatCurrency(
										(calculation.totalEmployerCosts + calculation.overheadCosts) /
											calculation.totalHoursPerYear
									)}</span
								>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Profitability Column -->
			<div
				class="flex h-full flex-col rounded-lg border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-800/50 dark:bg-blue-950/20"
			>
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded bg-blue-100 p-1.5 dark:bg-blue-900/50">
						<Target class="h-4 w-4 text-blue-600 dark:text-blue-300" />
					</div>
					<h4
						class="text-sm font-semibold tracking-wide text-blue-700 uppercase dark:text-blue-300"
					>
						Profitability
					</h4>
				</div>
				<div class="flex flex-1 flex-col justify-between space-y-3">
					<div class="space-y-3">
						<div class="flex items-center justify-between py-1">
							<span class="text-sm text-gray-600 dark:text-gray-300">Gross Profit</span>
							<span class="font-semibold text-blue-700 dark:text-blue-300"
								>{formatCurrency(calculation.grossMargin)}</span
							>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-sm text-gray-600 dark:text-gray-300">Gross Margin %</span>
							<span class="font-semibold text-blue-700 dark:text-blue-300"
								>{formatPercentage(calculation.grossMarginPercentage)}</span
							>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-sm text-gray-600 dark:text-gray-300">Net Margin %</span>
							<span
								class="font-bold {calculation.netMargin >= 0
									? 'text-blue-700 dark:text-blue-300'
									: 'text-amber-700 dark:text-amber-300'}"
								>{formatPercentage(calculation.netMarginPercentage)}</span
							>
						</div>
					</div>
					<div class="space-y-3">
						<div class="border-t border-blue-200 pt-3 dark:border-blue-700">
							<div class="flex items-center justify-between">
								<span class="font-medium text-gray-900 dark:text-gray-100">Net Profit</span>
								<span
									class="text-lg font-bold {calculation.netMargin >= 0
										? 'text-blue-700 dark:text-blue-300'
										: 'text-amber-700 dark:text-amber-300'}"
									>{formatCurrency(calculation.netMargin)}</span
								>
							</div>
						</div>
						<div
							class="rounded border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50"
						>
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600 dark:text-gray-400">Target Margin</span>
								<span class="font-medium text-gray-700 dark:text-gray-300"
									>{formatPercentage(config.targetNetMargin)}</span
								>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>
