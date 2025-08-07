<script lang="ts">
  import { 
    calculateSalaryBreakdown, 
    generateNegotiationInsights,
    generateMarginComparison,
    industryBenchmarks,
    formatCurrency,
    formatPercentage,
    defaultConfig,
    type SalaryCalculation,
    type CalculatorConfig
  } from '$lib/salary-calculator';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import MarginComparisonChart from '$lib/components/MarginComparisonChart.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import Settings from '@lucide/svelte/icons/settings';
  import Calculator from '@lucide/svelte/icons/calculator';
  import TrendingUp from '@lucide/svelte/icons/trending-up';
  import Euro from '@lucide/svelte/icons/euro';
  import Clock from '@lucide/svelte/icons/clock';
  import Users from '@lucide/svelte/icons/users';
  import Info from '@lucide/svelte/icons/info';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import ArrowDownRight from '@lucide/svelte/icons/arrow-down-right';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
  import Target from '@lucide/svelte/icons/target';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
  
  let grossSalary = $state(90000);
  let customerRate = $state(110);
  let config = $state({ ...defaultConfig });
  let showSettings = $state(false);
  
  let calculation = $derived(calculateSalaryBreakdown(grossSalary, customerRate, config));
  let insights = $derived(generateNegotiationInsights(calculation));
  let marginComparison = $derived(generateMarginComparison(calculation));

  function handleSettingsClose() {
    showSettings = false;
  }

  function handleSettingsSave(newConfig: CalculatorConfig) {
    config = { ...newConfig };
  }
</script>

<div class="min-h-screen bg-gray-100 dark:from-slate-900 dark:to-slate-800 dark:bg-gradient-to-br py-8 px-4">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="flex justify-between items-start mb-4">
        <div></div>
        <div class="text-center flex-1">
          <div class="flex items-center justify-center gap-3 mb-4">
            <Calculator class="w-8 h-8 text-primary" />
            <h1 class="text-4xl font-bold">Salary & Profitability Calculator</h1>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <DarkModeToggle />
          <Button
            variant="outline"
            size="sm"
            onclick={() => showSettings = true}
            class="flex items-center gap-2"
          >
            <Settings class="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>

    <!-- Input Controls -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Euro class="w-5 h-5 text-primary" />
            Annual Gross Salary
          </Card.Title>
          <Card.Description>Annual salary being analysed</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="space-y-2">
            <Input
              type="number"
              bind:value={grossSalary}
              placeholder="90000"
              min="30000"
              max="200000"
              step="1000"
              class="text-lg h-12"
            />
            <p class="text-xs text-muted-foreground">Range: €30,000 - €200,000</p>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary" />
            Customer Hourly Rate
          </Card.Title>
          <Card.Description>What clients pay per hour for the employee</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="space-y-2">
            <Input
              type="number"
              bind:value={customerRate}
              placeholder="110"
              min="50"
              max="300"
              step="5"
              class="text-lg h-12"
            />
            <p class="text-xs text-muted-foreground">Range: €50 - €300 per hour</p>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card.Root>
        <Card.Content class="p-6">
          <div class="flex items-center space-x-4">
            <div class="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
              <TrendingUp class="w-6 h-6 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <div class="text-2xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(calculation.annualRevenue)}</div>
              <div class="text-sm font-medium">Annual Revenue</div>
              <div class="text-xs text-muted-foreground mt-1">Generated for company</div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="p-6">
          <div class="flex items-center space-x-4">
            <div class="p-2 {calculation.netMarginPercentage >= config.targetNetMargin ? 'bg-sky-100 dark:bg-sky-900/50' : 'bg-orange-100 dark:bg-orange-900/50'} rounded-lg">
              {#if calculation.netMarginPercentage >= config.targetNetMargin}
                <ArrowUpRight class="w-6 h-6 text-sky-700 dark:text-sky-400" />
              {:else}
                <ArrowDownRight class="w-6 h-6 text-orange-700 dark:text-orange-400" />
              {/if}
            </div>
            <div>
              <div class="text-2xl font-bold {calculation.netMarginPercentage >= config.targetNetMargin ? 'text-sky-700 dark:text-sky-400' : 'text-orange-700 dark:text-orange-400'}">
                {formatCurrency(calculation.netMargin)}
              </div>
              <div class="text-sm font-medium">Company Net Profit</div>
              <div class="text-xs text-muted-foreground mt-1">
                {formatPercentage(calculation.netMarginPercentage)} vs {formatPercentage(config.targetNetMargin)} target margin
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="p-6">
          <div class="flex items-center space-x-4">
            <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Users class="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div>
              <div class="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(calculation.employeeHourlyRate)}</div>
              <div class="text-sm font-medium">Employee Hourly Rate</div>
              <div class="text-xs text-muted-foreground mt-1">Based on total hours</div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="p-6">
          <div class="flex items-center space-x-4">
            <div class="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Clock class="w-6 h-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <div class="text-2xl font-bold text-amber-700 dark:text-amber-400">{calculation.realBillableHoursPerYear}</div>
              <div class="text-sm font-medium">Billable Hours</div>
              <div class="text-xs text-muted-foreground mt-1">{formatPercentage(calculation.utilizationRate * 100)} utilisation</div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Detailed Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Cost Breakdown -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Euro class="w-5 h-5 text-primary" />
            Cost Breakdown
          </Card.Title>
          <Card.Description>Total employment costs for the company</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-muted-foreground">Gross Salary</span>
            <span class="font-semibold">{formatCurrency(calculation.grossSalaryAnnual)}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-muted-foreground">Additional Employer Cost ({formatPercentage(config.employerSocialContributionRate * 100)})</span>
            <span class="font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(calculation.employerSocialContributions)}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b-2 border-primary/20">
            <span class="font-medium">Total Employer Costs</span>
            <span class="font-bold text-lg">{formatCurrency(calculation.totalEmployerCosts)}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-muted-foreground">Employer Cost per Hour</span>
            <span class="font-semibold">{formatCurrency(calculation.employerCostHourlyRate)}</span>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Revenue & Margin -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-primary" />
            Revenue & Margins
          </Card.Title>
          <Card.Description>Company profitability from employee</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-muted-foreground">Annual Revenue</span>
            <span class="font-semibold text-sky-700 dark:text-sky-400">{formatCurrency(calculation.annualRevenue)}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-muted-foreground">Gross Margin</span>
            <span class="font-semibold">{formatCurrency(calculation.grossMargin)} ({formatPercentage(calculation.grossMarginPercentage)})</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b-2 border-primary/20">
            <span class="font-medium">Net Margin</span>
            <span class="font-bold text-lg text-sky-700 dark:text-sky-400">{formatCurrency(calculation.netMargin)} ({formatPercentage(calculation.netMarginPercentage)})</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-muted-foreground">Non-billable Time Cost</span>
            <span class="font-semibold text-orange-700 dark:text-orange-400">{formatCurrency(calculation.nonBillableTimeValue)}</span>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Negotiation Insights -->
    <div class="mt-8">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Info class="w-6 h-6 text-primary" />
            Financial Analysis
          </Card.Title>
          <Card.Description>Key metrics for salary planning and business sustainability</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each insights as insight}
              <Card.Root class="border-l-4 {insight.impact === 'positive' ? 'border-l-sky-600' : insight.impact === 'negative' ? 'border-l-orange-600' : 'border-l-primary'}">
                <Card.Content class="p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="font-medium flex items-center gap-2">
                        {insight.category}
                        {#if insight.impact === 'positive'}
                          <ArrowUpRight class="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        {:else if insight.impact === 'negative'}
                          <ArrowDownRight class="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        {:else}
                          <ArrowRight class="w-4 h-4 text-primary" />
                        {/if}
                      </div>
                      <div class="text-sm text-muted-foreground mt-1">{insight.description}</div>
                    </div>
                  </div>
                  <div class="mt-3 text-lg font-bold {insight.impact === 'positive' ? 'text-sky-700 dark:text-sky-400' : insight.impact === 'negative' ? 'text-orange-700 dark:text-orange-400' : 'text-primary'}">
                    {insight.value}
                  </div>
                </Card.Content>
              </Card.Root>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Industry Benchmark Comparison -->
    <div class="mt-8">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <BarChart3 class="w-6 h-6 text-primary" />
            Industry Margin Benchmarks
          </Card.Title>
          <Card.Description>
            Compare margins against 2024 industry data to ensure competitive yet sustainable salary levels
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <MarginComparisonChart benchmarks={industryBenchmarks} comparison={marginComparison} />
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Working Time Analysis -->
    <div class="mt-8">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Clock class="w-6 h-6 text-primary" />
            Working Time Analysis
          </Card.Title>
          <Card.Description>Breakdown of employee annual working hours</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 rounded-lg bg-teal-50 dark:bg-teal-950/50">
              <div class="text-3xl font-bold text-teal-700 dark:text-teal-400">{calculation.workingDaysPerYear}</div>
              <div class="text-sm font-medium mt-2">Working Days</div>
              <div class="text-xs text-muted-foreground">Per year</div>
            </div>
            <div class="text-center p-4 rounded-lg bg-sky-50 dark:bg-sky-950/50">
              <div class="text-3xl font-bold text-sky-700 dark:text-sky-400">{calculation.realBillableHoursPerYear}</div>
              <div class="text-sm font-medium mt-2">Realistic Billable</div>
              <div class="text-xs text-muted-foreground">{calculation.billableHoursPerYear}h theoretical</div>
            </div>
            <div class="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/50">
              <div class="text-3xl font-bold text-orange-700 dark:text-orange-400">{calculation.totalHoursPerYear - calculation.realBillableHoursPerYear}</div>
              <div class="text-sm font-medium mt-2">Non-billable Hours</div>
              <div class="text-xs text-muted-foreground">Admin, meetings, training</div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

  </div>
</div>

<!-- Settings Dialog -->
<SettingsDialog
  bind:open={showSettings}
  {config}
  onClose={handleSettingsClose}
  onSave={handleSettingsSave}
/>

