<script lang="ts">
  import { 
    calculateSalaryBreakdown, 
    generateStrategicInsights,
    generateMarginComparison,
    industryBenchmarks,
    formatCurrency,
    formatPercentage,
    defaultConfig,
    getMarginPosition,
    loadSettingsFromStorage,
    saveSettingsToStorage,
    loadInputValuesFromStorage,
    saveInputValuesToStorage,
    type SalaryCalculation,
    type CalculatorConfig
  } from '$lib/salary-calculator';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import MarginComparisonChart from '$lib/components/MarginComparisonChart.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
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
  import Calendar from '@lucide/svelte/icons/calendar';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
  
  // Load persisted values or use defaults
  const savedInputs = loadInputValuesFromStorage();
  let grossSalary = $state(savedInputs.grossSalary);
  let customerRate = $state(savedInputs.customerRate);
  let config = $state(loadSettingsFromStorage());
  let showSettings = $state(false);
  let isFreelancerMode = $state(false);

  // Save input values to localStorage when they change
  $effect(() => {
    saveInputValuesToStorage({ grossSalary, customerRate });
  });
  
  let calculation = $derived(calculateSalaryBreakdown(grossSalary, customerRate, config));
  let strategicInsights = $derived(generateStrategicInsights(calculation, config));
  let marginComparison = $derived(generateMarginComparison(calculation));
  let marginPosition = $derived(getMarginPosition(calculation.netMarginPercentage));

  function handleSettingsClose() {
    showSettings = false;
  }

  function handleSettingsSave(newConfig: CalculatorConfig) {
    config = { ...newConfig };
    saveSettingsToStorage(config);
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
          <div class="flex items-center justify-between">
            <div>
              <Card.Title class="flex items-center gap-2">
                <Euro class="w-5 h-5 text-primary" />
                Annual Gross Salary
              </Card.Title>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-muted-foreground">Employee</span>
              <Switch bind:checked={isFreelancerMode} />
              <span class="text-sm text-muted-foreground">Freelancer</span>
            </div>
          </div>
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
            Client Hourly Rate
          </Card.Title>
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
              <div class="text-xs text-muted-foreground mt-1">{formatPercentage(calculation.utilisationRate * 100)} utilisation</div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Financial Overview -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-primary" />
          Financial Overview
        </Card.Title>
        <Card.Description>Complete breakdown of costs, revenue, and profitability</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Costs Column -->
          <div class="space-y-4">
            <h4 class="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-2">Costs</h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">Gross Salary</span>
                <span class="font-semibold">{formatCurrency(calculation.grossSalaryAnnual)}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Employer Contributions ({formatPercentage(config.employerSocialContributionRate * 100)})</span>
                <span class="font-semibold text-amber-700 dark:text-amber-400">+{formatCurrency(calculation.employerSocialContributions)}</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t">
                <span class="font-medium">Total Employment Cost</span>
                <span class="font-bold text-lg">{formatCurrency(calculation.totalEmployerCosts)}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-muted-foreground">Per Hour Cost</span>
                <span class="font-medium">{formatCurrency(calculation.employerCostHourlyRate)}</span>
              </div>
            </div>
          </div>

          <!-- Revenue Column -->
          <div class="space-y-4">
            <h4 class="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-2">Revenue</h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">Billable Hours</span>
                <span class="font-semibold">{calculation.realBillableHoursPerYear}h</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Hourly Rate</span>
                <span class="font-semibold">{formatCurrency(calculation.customerHourlyRate)}</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t">
                <span class="font-medium">Total Annual Revenue</span>
                <span class="font-bold text-lg text-sky-700 dark:text-sky-400">{formatCurrency(calculation.annualRevenue)}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-muted-foreground">Non-billable Time Cost</span>
                <span class="font-medium text-orange-700 dark:text-orange-400">{formatCurrency(calculation.nonBillableTimeValue)}</span>
              </div>
            </div>
          </div>

          <!-- Margins Column -->
          <div class="space-y-4">
            <h4 class="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-2">Profitability</h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">Gross Margin</span>
                <span class="font-semibold">{formatCurrency(calculation.grossMargin)}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Gross Margin %</span>
                <span class="font-semibold">{formatPercentage(calculation.grossMarginPercentage)}</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t">
                <span class="font-medium">Net Margin</span>
                <span class="font-bold text-lg {calculation.netMarginPercentage >= config.targetNetMargin ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}">{formatCurrency(calculation.netMargin)}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Net Margin %</span>
                <span class="font-bold {calculation.netMarginPercentage >= config.targetNetMargin ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}">{formatPercentage(calculation.netMarginPercentage)}</span>
              </div>
              <div class="flex justify-between items-center text-sm pt-1 border-t border-dashed">
                <span class="text-muted-foreground">Target Margin</span>
                <span class="font-medium text-muted-foreground">{formatPercentage(config.targetNetMargin)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Strategic Analysis -->
    <div class="mt-8">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Target class="w-6 h-6 text-primary" />
            Strategic Analysis & Working Time
          </Card.Title>
          <Card.Description>Performance indicators, efficiency metrics, and working time breakdown</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each strategicInsights as insight}
              <div class="text-center p-4 rounded-lg border {insight.impact === 'positive' ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800' : insight.impact === 'negative' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'}">
                <div class="flex items-center justify-center mb-3">
                  {#if insight.impact === 'positive'}
                    <ArrowUpRight class="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  {:else if insight.impact === 'negative'}
                    <ArrowDownRight class="w-6 h-6 text-red-600 dark:text-red-400" />
                  {:else}
                    <ArrowRight class="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  {/if}
                </div>
                <div class="text-2xl font-bold mb-2 {insight.impact === 'positive' ? 'text-sky-700 dark:text-sky-400' : insight.impact === 'negative' ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-400'}">
                  {insight.value}
                </div>
                <div class="font-medium text-sm mb-1">{insight.category}</div>
                <div class="text-xs text-muted-foreground">{insight.description}</div>
              </div>
            {/each}
            
            <!-- Working Time Analysis Cards -->
            <div class="text-center p-4 rounded-lg border bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
              <div class="flex items-center justify-center mb-3">
                <Calendar class="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div class="text-2xl font-bold mb-2 text-teal-700 dark:text-teal-400">
                {calculation.workingDaysPerYear}
              </div>
              <div class="font-medium text-sm mb-1">Working Days</div>
              <div class="text-xs text-muted-foreground">Per year</div>
            </div>
            
            <div class="text-center p-4 rounded-lg border bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800">
              <div class="flex items-center justify-center mb-3">
                <Clock class="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div class="text-2xl font-bold mb-2 text-sky-700 dark:text-sky-400">
                {calculation.realBillableHoursPerYear}
              </div>
              <div class="font-medium text-sm mb-1">Realistic Billable</div>
              <div class="text-xs text-muted-foreground">{calculation.billableHoursPerYear}h theoretical</div>
            </div>
            
            <div class="text-center p-4 rounded-lg border bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
              <div class="flex items-center justify-center mb-3">
                <Clock class="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div class="text-2xl font-bold mb-2 text-orange-700 dark:text-orange-400">
                {calculation.totalHoursPerYear - calculation.realBillableHoursPerYear}
              </div>
              <div class="font-medium text-sm mb-1">Non-billable Hours</div>
              <div class="text-xs text-muted-foreground">Admin, meetings, training</div>
            </div>
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


  </div>
</div>

<!-- Settings Dialog -->
<SettingsDialog
  bind:open={showSettings}
  {config}
  onClose={handleSettingsClose}
  onSave={handleSettingsSave}
/>

