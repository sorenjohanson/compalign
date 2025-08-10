<script lang="ts">
	import {
		TrendingUp,
		ArrowUpRight,
		ArrowRight,
		ArrowDownRight,
		Users,
		Clock
	} from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { formatCurrency, formatPercentage, getMarginStatus } from '$lib/salary-calculator';

	let { calculation, config } = $props();

	const marginStatus = $derived(
		getMarginStatus(calculation.netMarginPercentage, config.targetNetMargin)
	);
</script>

<!-- Key Metrics Cards -->
<div class="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
	<Card.Root>
		<Card.Content class="p-4 sm:p-6">
			<div class="flex items-center space-x-3 sm:space-x-4">
				<div class="flex-shrink-0 rounded-lg bg-cyan-100 p-2 dark:bg-cyan-900/50">
					<TrendingUp class="h-5 w-5 text-cyan-700 sm:h-6 sm:w-6 dark:text-cyan-300" />
				</div>
				<div class="min-w-0">
					<div class="truncate text-lg font-bold text-cyan-700 sm:text-2xl dark:text-cyan-300">
						{formatCurrency(calculation.annualRevenue)}
					</div>
					<div class="text-xs font-medium sm:text-sm">Annual Revenue</div>
					<div class="mt-1 text-xs text-muted-foreground">Generated for company</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Content class="p-4 sm:p-6">
			<div class="flex items-center space-x-3 sm:space-x-4">
				<div
					class="p-2 {marginStatus === 'above'
						? 'bg-blue-100 dark:bg-blue-900/50'
						: marginStatus === 'exact'
							? 'bg-gray-100 dark:bg-gray-900/50'
							: 'bg-amber-100 dark:bg-amber-900/50'} flex-shrink-0 rounded-lg"
				>
					{#if marginStatus === 'above'}
						<ArrowUpRight class="h-5 w-5 text-blue-700 sm:h-6 sm:w-6 dark:text-blue-300" />
					{:else if marginStatus === 'exact'}
						<ArrowRight class="h-5 w-5 text-gray-700 sm:h-6 sm:w-6 dark:text-gray-400" />
					{:else}
						<ArrowDownRight class="h-5 w-5 text-amber-700 sm:h-6 sm:w-6 dark:text-amber-300" />
					{/if}
				</div>
				<div class="min-w-0">
					<div
						class="text-lg font-bold sm:text-2xl {marginStatus === 'above'
							? 'text-blue-700 dark:text-blue-300'
							: marginStatus === 'exact'
								? 'text-gray-700 dark:text-gray-300'
								: 'text-amber-700 dark:text-amber-300'} truncate"
					>
						{formatCurrency(calculation.netMargin)}
					</div>
					<div class="text-xs font-medium sm:text-sm">Company Net Profit</div>
					<div class="mt-1 text-xs text-muted-foreground">
						{formatPercentage(calculation.netMarginPercentage)} vs {formatPercentage(
							config.targetNetMargin
						)} target
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Content class="p-4 sm:p-6">
			<div class="flex items-center space-x-3 sm:space-x-4">
				<div class="flex-shrink-0 rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
					<Users class="h-5 w-5 text-blue-700 sm:h-6 sm:w-6 dark:text-blue-300" />
				</div>
				<div class="min-w-0">
					<div class="truncate text-lg font-bold text-blue-700 sm:text-2xl dark:text-blue-300">
						{formatCurrency(calculation.employeeHourlyRate)}
					</div>
					<div class="text-xs font-medium sm:text-sm">Employee Hourly Rate</div>
					<div class="mt-1 text-xs text-muted-foreground">Based on total hours</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Content class="p-4 sm:p-6">
			<div class="flex items-center space-x-3 sm:space-x-4">
				<div class="flex-shrink-0 rounded-lg bg-violet-100 p-2 dark:bg-violet-900/50">
					<Clock class="h-5 w-5 text-violet-700 sm:h-6 sm:w-6 dark:text-violet-300" />
				</div>
				<div class="min-w-0">
					<div class="text-lg font-bold text-violet-700 sm:text-2xl dark:text-violet-300">
						{calculation.realBillableHoursPerYear} h
					</div>
					<div class="text-xs font-medium sm:text-sm">Billable Hours</div>
					<div class="mt-1 text-xs text-muted-foreground">
						{formatPercentage(calculation.utilisationRate * 100)} utilisation
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
