<script lang="ts">
  import type { IndustryBenchmark, MarginComparison } from '$lib/salary-calculator';
  import { formatPercentage } from '$lib/salary-calculator';
  import Target from '@lucide/svelte/icons/target';
  import TrendingUp from '@lucide/svelte/icons/trending-up';
  import TrendingDown from '@lucide/svelte/icons/trending-down';

  interface Props {
    benchmarks: IndustryBenchmark[];
    comparison: MarginComparison;
  }

  let { benchmarks, comparison }: Props = $props();

  // Create a clean data structure with your position clearly marked
  const chartData = $derived(() => {
    const allMargins = [
      ...benchmarks.map(b => ({ name: b.category, description: b.description, min: b.netMarginRange.min, max: b.netMarginRange.max, type: 'industry' as const })),
      { name: 'Company Net Profit Margin', description: '', min: comparison.yourNetMargin, max: comparison.yourNetMargin, type: 'yours' as const }
    ].sort((a, b) => a.min - b.min);
    
    return allMargins;
  });

  const getStatusIcon = () => {
    if (comparison.industryPosition === 'above') return TrendingUp;
    if (comparison.industryPosition === 'below') return TrendingDown;
    return Target;
  };

  const getStatusColor = () => {
    if (comparison.industryPosition === 'above') return 'text-sky-700 dark:text-sky-400';
    if (comparison.industryPosition === 'below') return 'text-orange-700 dark:text-orange-400';
    return 'text-teal-700 dark:text-teal-400';
  };
</script>

<div class="space-y-6">
  <!-- Position Summary -->
  <div class="flex items-center justify-between p-4 rounded-lg border-2 {comparison.industryPosition === 'above' ? 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/50' : comparison.industryPosition === 'below' ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50' : 'border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/50'}">
    <div class="flex items-center gap-3">
      <svelte:component this={getStatusIcon()} class="w-6 h-6 {getStatusColor()}" />
      <div>
        <div class="font-semibold text-lg">
          Company Net Profit Margin: <span class="text-destructive">{formatPercentage(comparison.yourNetMargin)}</span>
        </div>
        <div class="text-sm text-muted-foreground">
          {comparison.industryPosition === 'above' ? 'Above' : comparison.industryPosition === 'below' ? 'Below' : 'Within'} industry standards
        </div>
      </div>
    </div>
    <div class="text-right text-sm">
      <div class="font-medium">Closest Match:</div>
      <div class="text-muted-foreground">{comparison.closestBenchmark.category}</div>
      <div class="font-mono text-xs">
        {formatPercentage(comparison.closestBenchmark.netMarginRange.min)}-{formatPercentage(comparison.closestBenchmark.netMarginRange.max)}
      </div>
    </div>
  </div>

  <!-- Simplified Comparison Table -->
  <div class="bg-card rounded-lg border">
    <div class="p-4 border-b">
      <h4 class="font-semibold">Industry Margin Comparison</h4>
      <p class="text-sm text-muted-foreground">Net profit margins across different sectors</p>
    </div>
    
    <div class="divide-y">
      {#each chartData() as item}
        <div class="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div class="flex items-center gap-3">
            {#if item.type === 'yours'}
              <div class="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
              <div>
                <span class="font-semibold text-destructive">{item.name}</span>
              </div>
            {:else}
              <div class="w-3 h-3 {item.name === comparison.closestBenchmark.category ? 'bg-primary' : 'bg-muted-foreground'} rounded-full"></div>
              <div>
                <div class="font-medium {item.name === comparison.closestBenchmark.category ? 'text-primary' : 'text-foreground'}">{item.name}</div>
                <div class="text-xs text-muted-foreground">{item.description}</div>
              </div>
            {/if}
          </div>
          
          <div class="text-right">
            {#if item.type === 'yours'}
              <div class="font-bold text-destructive text-lg">{formatPercentage(item.min)}</div>
            {:else}
              <div class="font-semibold text-lg">{formatPercentage(item.min)} - {formatPercentage(item.max)}</div>
              <div class="text-xs text-muted-foreground">Avg: {formatPercentage((item.min + item.max) / 2)}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-3 gap-4">
    <div class="text-center p-3 bg-muted/30 rounded-lg">
      <div class="text-2xl font-bold text-sky-700 dark:text-sky-400">{formatPercentage(Math.max(...benchmarks.map(b => b.netMarginRange.max)))}</div>
      <div class="text-xs text-muted-foreground">Industry High</div>
    </div>
    <div class="text-center p-3 bg-muted/30 rounded-lg">
      <div class="text-2xl font-bold text-teal-700 dark:text-teal-400">
        {formatPercentage(benchmarks.reduce((sum, b) => sum + (b.netMarginRange.min + b.netMarginRange.max) / 2, 0) / benchmarks.length)}
      </div>
      <div class="text-xs text-muted-foreground">Industry Average</div>
    </div>
    <div class="text-center p-3 bg-muted/30 rounded-lg">
      <div class="text-2xl font-bold text-purple-700 dark:text-purple-400">{formatPercentage(Math.min(...benchmarks.map(b => b.netMarginRange.min)))}</div>
      <div class="text-xs text-muted-foreground">Industry Low</div>
    </div>
  </div>

  <!-- Data Sources Reference -->
  <div class="mt-6 pt-4 border-t">
    <p class="text-xs text-muted-foreground italic text-center">
      Data sources: Staffing Industry Analysts, American Staffing Association, 2024 Industry Reports
    </p>
  </div>
</div>