<script lang="ts">
	import {
		Target,
		ArrowUpRight,
		ArrowRight,
		ArrowDownRight,
		Calendar,
		Clock
	} from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';

	let { calculation, strategicInsights } = $props();
</script>

<!-- Strategic Analysis -->
<div class="mt-8">
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Target class="h-6 w-6 text-primary" />
				Strategic Analysis & Working Time
			</Card.Title>
			<Card.Description
				>Performance indicators, efficiency metrics, and working time breakdown</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
				{#each strategicInsights as insight (insight.category)}
					<div
						class="rounded-lg border p-3 text-center sm:p-4 {insight.impact === 'positive'
							? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
							: insight.impact === 'negative'
								? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
								: 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/30'}"
					>
						<div class="mb-2 flex items-center justify-center sm:mb-3">
							{#if insight.impact === 'positive'}
								<ArrowUpRight class="h-5 w-5 text-blue-600 sm:h-6 sm:w-6 dark:text-blue-300" />
							{:else if insight.impact === 'negative'}
								<ArrowDownRight class="h-5 w-5 text-amber-700 sm:h-6 sm:w-6 dark:text-amber-300" />
							{:else}
								<ArrowRight class="h-5 w-5 text-gray-600 sm:h-6 sm:w-6 dark:text-gray-400" />
							{/if}
						</div>
						<div
							class="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl {insight.impact === 'positive'
								? 'text-blue-700 dark:text-blue-300'
								: insight.impact === 'negative'
									? 'text-amber-700 dark:text-amber-300'
									: 'text-gray-700 dark:text-gray-300'}"
						>
							{insight.value}
						</div>
						<div class="mb-1 text-xs font-medium sm:text-sm">{insight.category}</div>
						<div class="text-xs text-muted-foreground">{insight.description}</div>
					</div>
				{/each}

				<!-- Working Time Analysis Cards -->
				<div
					class="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-center sm:p-4 dark:border-cyan-800 dark:bg-cyan-950/30"
				>
					<div class="mb-2 flex items-center justify-center sm:mb-3">
						<Calendar class="h-5 w-5 text-cyan-600 sm:h-6 sm:w-6 dark:text-cyan-300" />
					</div>
					<div class="mb-1 text-xl font-bold text-cyan-700 sm:mb-2 sm:text-2xl dark:text-cyan-300">
						{calculation.workingDaysPerYear}
					</div>
					<div class="mb-1 text-xs font-medium sm:text-sm">Working Days</div>
					<div class="text-xs text-muted-foreground">Per year</div>
				</div>

				<div
					class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center sm:p-4 dark:border-amber-800 dark:bg-amber-950/30"
				>
					<div class="mb-2 flex items-center justify-center sm:mb-3">
						<Clock class="h-5 w-5 text-amber-600 sm:h-6 sm:w-6 dark:text-amber-300" />
					</div>
					<div
						class="mb-1 text-xl font-bold text-amber-700 sm:mb-2 sm:text-2xl dark:text-amber-300"
					>
						{calculation.totalHoursPerYear - calculation.realBillableHoursPerYear} h
					</div>
					<div class="mb-1 text-xs font-medium sm:text-sm">Non-billable Hours</div>
					<div class="text-xs text-muted-foreground">Admin, meetings, training</div>
				</div>

				<div
					class="rounded-lg border border-violet-200 bg-violet-50 p-3 text-center sm:p-4 dark:border-violet-800 dark:bg-violet-950/30"
				>
					<div class="mb-2 flex items-center justify-center sm:mb-3">
						<Clock class="h-5 w-5 text-violet-600 sm:h-6 sm:w-6 dark:text-violet-300" />
					</div>
					<div
						class="mb-1 text-xl font-bold text-violet-700 sm:mb-2 sm:text-2xl dark:text-violet-300"
					>
						{calculation.realBillableHoursPerYear} h
					</div>
					<div class="mb-1 text-xs font-medium sm:text-sm">Realistic Billable</div>
					<div class="text-xs text-muted-foreground">
						{calculation.billableHoursPerYear}h theoretical
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
