<script lang="ts">
  import type { IndustryBenchmark, MarginComparison } from '$lib/salary-calculator';
  import { formatPercentage, getMarginPosition, getIndustryMarginStats } from '$lib/salary-calculator';
  import Target from '@lucide/svelte/icons/target';
  import TrendingUp from '@lucide/svelte/icons/trending-up';
  import TrendingDown from '@lucide/svelte/icons/trending-down';

  interface Props {
    benchmarks: IndustryBenchmark[];
    comparison: MarginComparison;
  }

  let { benchmarks, comparison }: Props = $props();

  // Get margin position and industry stats
  const marginPosition = $derived(getMarginPosition(comparison.yourNetMargin));
  const industryStats = $derived(getIndustryMarginStats());

  // Create a clean data structure with your position clearly marked
  const chartData = $derived(() => {
    // Create all items first
    const allItems = [
      // Industry benchmarks
      ...benchmarks.map(b => ({ 
        name: b.category, 
        description: b.description, 
        min: b.netMarginRange.min, 
        max: b.netMarginRange.max, 
        type: 'industry' as const,
        // Use average for positioning
        avgMargin: (b.netMarginRange.min + b.netMarginRange.max) / 2
      })),
      // Company margin
      { 
        name: 'Company Net Profit Margin', 
        description: '', 
        min: comparison.yourNetMargin, 
        max: comparison.yourNetMargin, 
        type: 'yours' as const,
        avgMargin: comparison.yourNetMargin
      }
    ];
    
    // Sort everything by average margin value for natural ordering
    return allItems.sort((a, b) => a.avgMargin - b.avgMargin);
  });

  // Get color classes based on margin position
  const getCompanyColors = () => {
    if (marginPosition === 'below_low') {
      return {
        bg: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-600'
      };
    } else if (marginPosition === 'above_high') {
      return {
        bg: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-400',
        dot: 'bg-blue-600'
      };
    } else {
      return {
        bg: 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50',
        text: 'text-gray-900 dark:text-gray-100',
        dot: 'bg-gray-900 dark:bg-gray-100'
      };
    }
  };

  const getStatusColor = () => {
    if (comparison.industryPosition === 'above') return 'text-blue-700 dark:text-blue-300';
    if (comparison.industryPosition === 'below') return 'text-amber-700 dark:text-amber-300';
    return 'text-cyan-700 dark:text-cyan-300';
  };
</script>

<div class="space-y-6">
  <!-- Position Summary -->
  <div class="flex items-center justify-between p-4 rounded-lg border-2 {getCompanyColors().bg}">
    <div class="flex items-center gap-3">
      {#if comparison.industryPosition === 'above'}
        <TrendingUp class="w-6 h-6 {getStatusColor()}" />
      {:else if comparison.industryPosition === 'below'}
        <TrendingDown class="w-6 h-6 {getStatusColor()}" />
      {:else}
        <Target class="w-6 h-6 {getStatusColor()}" />
      {/if}
      <div>
        <div class="font-semibold text-lg">
          Company Net Profit Margin: <span class="{getCompanyColors().text}">{formatPercentage(comparison.yourNetMargin)}</span>
        </div>
        <div class="text-sm text-muted-foreground">
          {comparison.industryPosition === 'above' ? 'Above' : comparison.industryPosition === 'below' ? 'Below' : 'Within'} industry average
        </div>
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
              <div class="w-3 h-3 {getCompanyColors().dot} rounded-full animate-pulse"></div>
              <div>
                <span class="font-semibold {getCompanyColors().text}">{item.name}</span>
              </div>
            {:else if item.type === 'industry'}
              <div class="w-3 h-3 {item.name === comparison.closestBenchmark.category ? 'bg-primary' : 'bg-muted-foreground'} rounded-full"></div>
              <div>
                <div class="font-medium {item.name === comparison.closestBenchmark.category ? 'text-primary' : 'text-foreground'}">{item.name}</div>
                <div class="text-xs text-muted-foreground">{item.description}</div>
              </div>
            {/if}
          </div>
          
          <div class="text-right">
            {#if item.type === 'yours'}
              <div class="font-bold {getCompanyColors().text} text-lg">{formatPercentage(item.min)}</div>
            {:else if item.type === 'industry'}
              <div class="font-semibold text-lg">{formatPercentage(item.min)} - {formatPercentage(item.max)}</div>
              <div class="text-xs text-muted-foreground">Avg: {formatPercentage(item.avgMargin)}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-3 gap-4">
    <div class="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
      <div class="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatPercentage(industryStats.industryLow)}</div>
      <div class="text-xs text-amber-600 dark:text-amber-300 font-medium">Industry Low</div>
    </div>
    <div class="text-center p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg border border-gray-200 dark:border-gray-800">
      <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {formatPercentage(industryStats.industryAverage)}
      </div>
      <div class="text-xs text-gray-700 dark:text-gray-300 font-medium">Industry Average</div>
    </div>
    <div class="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
      <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatPercentage(industryStats.industryHigh)}</div>
      <div class="text-xs text-blue-600 dark:text-blue-300 font-medium">Industry High</div>
    </div>
  </div>

  <!-- Data Sources Reference -->
  <div class="mt-6 pt-4 border-t">
    <p class="text-xs text-muted-foreground italic text-center">
      Data sources: Staffing Industry Analysts, American Staffing Association, 2024 Industry Reports
    </p>
  </div>
</div>