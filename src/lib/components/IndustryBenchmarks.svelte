<script lang="ts">
	import { ChartBar } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import ProBadge from '$lib/components/ProBadge.svelte';
	import MarginComparisonChart from '$lib/components/MarginComparisonChart.svelte';
	import type { IndustryBenchmark, MarginComparison } from '$lib/salary-calculator';

	let {
		isProEnabled,
		industryBenchmarks,
		marginComparison,
		industryDataLoading = false,
		industryDataError = null
	}: {
		isProEnabled: boolean;
		industryBenchmarks: IndustryBenchmark[];
		marginComparison: MarginComparison | undefined;
		industryDataLoading?: boolean;
		industryDataError?: string | null;
	} = $props();
</script>

<!-- Industry Benchmark Comparison -->
<div class="mt-8">
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<ChartBar class="h-6 w-6 text-primary" />
				Industry Margin Benchmarks
			</Card.Title>
			<Card.Description>
				Compare margins against 2024 industry data to ensure competitive yet sustainable salary
				levels
			</Card.Description>
		</Card.Header>
		<Card.Content class="relative">
			<!-- Always show chart content -->
			<div class={!isProEnabled ? 'pointer-events-none blur-sm' : ''}>
				{#if industryDataLoading && isProEnabled}
					<div class="flex items-center justify-center p-8">
						<div class="text-center">
							<div
								class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
							></div>
							<p class="mt-2 text-sm text-muted-foreground">Loading industry data...</p>
						</div>
					</div>
				{:else if industryDataError && isProEnabled}
					<div class="flex items-center justify-center p-8">
						<div class="text-center">
							<p class="text-sm text-destructive">Failed to load industry data</p>
							<p class="mt-1 text-xs text-muted-foreground">{industryDataError}</p>
						</div>
					</div>
				{:else if marginComparison}
					<MarginComparisonChart benchmarks={industryBenchmarks} comparison={marginComparison} />
				{/if}
			</div>

			{#if !isProEnabled}
				<!-- Pro Overlay -->
				<div
					class="absolute inset-0 flex items-center justify-center rounded-lg bg-background/10 backdrop-blur-[2px]"
				>
					<div class="p-6 text-center">
						<ProBadge showText={true} showUnlockText={true} />
						<p class="mt-3 max-w-xs text-sm text-muted-foreground">
							Access detailed industry benchmarks
						</p>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
