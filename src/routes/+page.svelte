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
    getMarginStatus,
    loadSettingsFromStorage,
    saveSettingsToStorage,
    loadInputValuesFromStorage,
    saveInputValuesToStorage,
    isProUnlocked,
    type SalaryCalculation,
    type CalculatorConfig
  } from '$lib/salary-calculator';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import MarginComparisonChart from '$lib/components/MarginComparisonChart.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
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
  import Lock from '@lucide/svelte/icons/lock';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
  
  // Load persisted values or use defaults
  const savedInputs = loadInputValuesFromStorage();
  let grossSalary = $state(savedInputs.grossSalary);
  let customerRate = $state(savedInputs.customerRate);
  let config = $state(loadSettingsFromStorage());
  let showSettings = $state(false);
  let isFreelancerMode = $state(false);
  let isProEnabled = $state(isProUnlocked());

  // Save input values to localStorage when they change
  $effect(() => {
    saveInputValuesToStorage({ grossSalary, customerRate });
  });
  
  let calculation = $derived(calculateSalaryBreakdown(grossSalary, customerRate, config));
  let strategicInsights = $derived(generateStrategicInsights(calculation, config));
  let marginComparison = $derived(generateMarginComparison(calculation));
  let marginPosition = $derived(getMarginPosition(calculation.netMarginPercentage));
  let marginStatus = $derived(getMarginStatus(calculation.netMarginPercentage, config.targetNetMargin));

  function handleSettingsClose() {
    showSettings = false;
  }

  function handleSettingsSave(newConfig: CalculatorConfig) {
    config = { ...newConfig };
    saveSettingsToStorage(config);
  }

  function handleProStatusChange() {
    isProEnabled = isProUnlocked();
  }
</script>

<div class="min-h-screen bg-gray-100 dark:from-slate-900 dark:to-slate-800 dark:bg-gradient-to-br py-4 sm:py-8 px-4">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-6 sm:mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div class="hidden sm:block flex-1"></div>
        <div class="text-center flex flex-col items-center">
          <div class="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Calculator class="w-12 h-12 text-primary hidden md:block" />
            <h1 class="text-3xl font-bold">Rate Transparency Calculator</h1>
          </div>
          <p class="text-sm text-muted-foreground mb-4 sm:mb-0">
            Open Beta • Unlock <span class="text-blue-600 dark:text-blue-400 font-medium">Pro</span> features in Settings
          </p>
        </div>
        <div class="flex items-center gap-2 flex-1 justify-end">
          <DarkModeToggle />
          <Button
            variant="outline"
            size="sm"
            onclick={() => showSettings = true}
            class="flex items-center gap-2"
          >
            <Settings class="w-4 h-4" />
            <span class="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Input Controls -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <Card.Root>
        <Card.Header>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Card.Title class="flex items-center gap-2">
                <Euro class="w-5 h-5 text-primary" />
                Annual Gross Salary
              </Card.Title>
            </div>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-3">
              <div class="flex items-center space-x-2">
                <span class="text-xs sm:text-sm text-muted-foreground/60">Employee</span>
                <Switch bind:checked={isFreelancerMode} disabled={!isProEnabled} class={!isProEnabled ? "opacity-50" : ""} />
                <span class="text-xs sm:text-sm text-muted-foreground/60">Freelancer</span>
              </div>
              {#if !isProEnabled}
                <Badge variant="secondary" class="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
                  <Lock class="w-3 h-3 mr-1" />
                  <span class="hidden xs:inline">Unlock with </span>Pro
                </Badge>
              {/if}
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <Card.Root>
        <Card.Content class="p-4 sm:p-6">
          <div class="flex items-center space-x-3 sm:space-x-4">
            <div class="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg flex-shrink-0">
              <TrendingUp class="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700 dark:text-cyan-300" />
            </div>
            <div class="min-w-0">
              <div class="text-lg sm:text-2xl font-bold text-cyan-700 dark:text-cyan-300 truncate">{formatCurrency(calculation.annualRevenue)}</div>
              <div class="text-xs sm:text-sm font-medium">Annual Revenue</div>
              <div class="text-xs text-muted-foreground mt-1">Generated for company</div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="p-4 sm:p-6">
          <div class="flex items-center space-x-3 sm:space-x-4">
            <div class="p-2 {marginStatus === 'above' ? 'bg-blue-100 dark:bg-blue-900/50' : marginStatus === 'exact' ? 'bg-gray-100 dark:bg-gray-900/50' : 'bg-amber-100 dark:bg-amber-900/50'} rounded-lg flex-shrink-0">
              {#if marginStatus === 'above'}
                <ArrowUpRight class="w-5 h-5 sm:w-6 sm:h-6 text-blue-700 dark:text-blue-300" />
              {:else if marginStatus === 'exact'}
                <ArrowRight class="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-400" />
              {:else}
                <ArrowDownRight class="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 dark:text-amber-300" />
              {/if}
            </div>
            <div class="min-w-0">
              <div class="text-lg sm:text-2xl font-bold {marginStatus === 'above' ? 'text-blue-700 dark:text-blue-300' : marginStatus === 'exact' ? 'text-gray-700 dark:text-gray-300' : 'text-amber-700 dark:text-amber-300'} truncate">
                {formatCurrency(calculation.netMargin)}
              </div>
              <div class="text-xs sm:text-sm font-medium">Company Net Profit</div>
              <div class="text-xs text-muted-foreground mt-1">
                {formatPercentage(calculation.netMarginPercentage)} vs {formatPercentage(config.targetNetMargin)} target
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="p-4 sm:p-6">
          <div class="flex items-center space-x-3 sm:space-x-4">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
              <Users class="w-5 h-5 sm:w-6 sm:h-6 text-blue-700 dark:text-blue-300" />
            </div>
            <div class="min-w-0">
              <div class="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300 truncate">{formatCurrency(calculation.employeeHourlyRate)}</div>
              <div class="text-xs sm:text-sm font-medium">Employee Hourly Rate</div>
              <div class="text-xs text-muted-foreground mt-1">Based on total hours</div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="p-4 sm:p-6">
          <div class="flex items-center space-x-3 sm:space-x-4">
            <div class="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg flex-shrink-0">
              <Clock class="w-5 h-5 sm:w-6 sm:h-6 text-violet-700 dark:text-violet-300" />
            </div>
            <div class="min-w-0">
              <div class="text-lg sm:text-2xl font-bold text-violet-700 dark:text-violet-300">{calculation.realBillableHoursPerYear} h</div>
              <div class="text-xs sm:text-sm font-medium">Billable Hours</div>
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
        <Card.Description>Complete breakdown of revenue, costs and profitability</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:h-80">
          <!-- Revenue Column -->
          <div class="bg-cyan-50/50 dark:bg-cyan-950/20 rounded-lg p-4 border border-cyan-200/50 dark:border-cyan-800/50 flex flex-col h-full">
            <div class="flex items-center gap-2 mb-4">
              <div class="p-1.5 bg-cyan-100 dark:bg-cyan-900/50 rounded">
                <TrendingUp class="w-4 h-4 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h4 class="font-semibold text-sm uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Revenue</h4>
            </div>
            <div class="space-y-3 flex-1 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Billable Hours</span>
                <span class="font-semibold text-gray-900 dark:text-gray-100">{calculation.realBillableHoursPerYear} h</span>
              </div>
              <div class="flex justify-between items-center py-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Hourly Rate</span>
                  <span class="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(calculation.customerHourlyRate)}</span>
                </div>
              </div>
              <div class="space-y-3">
                <div class="border-t border-cyan-200 dark:border-cyan-700 pt-3">
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-gray-900 dark:text-gray-100">Total Annual Revenue</span>
                    <span class="font-bold text-lg text-cyan-700 dark:text-cyan-300">{formatCurrency(calculation.annualRevenue)}</span>
                  </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded px-3 py-2 border border-gray-200 dark:border-gray-700">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Non-billable Time Value</span>
                    <span class="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(calculation.nonBillableTimeValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Costs Column -->
          <div class="bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/50 flex flex-col h-full">
            <div class="flex items-center gap-2 mb-4">
              <div class="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded">
                <Euro class="w-4 h-4 text-amber-600 dark:text-amber-300" />
              </div>
              <h4 class="font-semibold text-sm uppercase tracking-wide text-amber-700 dark:text-amber-300">Costs</h4>
            </div>
            <div class="space-y-3 flex-1 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Gross Salary</span>
                  <span class="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(calculation.grossSalaryAnnual)}</span>
                </div>
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Employer Costs ({formatPercentage(config.employerSocialContributionRate * 100)})</span>
                  <span class="font-semibold text-amber-700 dark:text-amber-300">+{formatCurrency(calculation.employerSocialContributions)}</span>
                </div>
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Overhead ({formatPercentage(config.overheadAsPercentOfRevenue * 100)})</span>
                  <span class="font-semibold text-amber-700 dark:text-amber-300">+{formatCurrency(calculation.overheadCosts)}</span>
                </div>
              </div>
              <div class="space-y-3">
                <div class="border-t border-amber-200 dark:border-amber-700 pt-3">
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-gray-900 dark:text-gray-100">Total Costs</span>
                    <span class="font-bold text-lg text-amber-700 dark:text-amber-300">{formatCurrency(calculation.totalEmployerCosts + calculation.overheadCosts)}</span>
                  </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded px-3 py-2 border border-gray-200 dark:border-gray-700">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Per Hour Cost</span>
                    <span class="font-medium text-gray-700 dark:text-gray-300">{formatCurrency((calculation.totalEmployerCosts + calculation.overheadCosts) / calculation.totalHoursPerYear)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profitability Column -->
          <div class="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50 flex flex-col h-full">
            <div class="flex items-center gap-2 mb-4">
              <div class="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded">
                <Target class="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </div>
              <h4 class="font-semibold text-sm uppercase tracking-wide text-blue-700 dark:text-blue-300">Profitability</h4>
            </div>
            <div class="space-y-3 flex-1 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Gross Profit</span>
                  <span class="font-semibold text-blue-700 dark:text-blue-300">{formatCurrency(calculation.grossMargin)}</span>
                </div>
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Gross Margin %</span>
                  <span class="font-semibold text-blue-700 dark:text-blue-300">{formatPercentage(calculation.grossMarginPercentage)}</span>
                </div>
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Net Margin %</span>
                  <span class="font-bold {calculation.netMargin >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}">{formatPercentage(calculation.netMarginPercentage)}</span>
                </div>
              </div>
              <div class="space-y-3">
                <div class="border-t border-blue-200 dark:border-blue-700 pt-3">
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-gray-900 dark:text-gray-100">Net Profit</span>
                    <span class="font-bold text-lg {calculation.netMargin >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}">{formatCurrency(calculation.netMargin)}</span>
                  </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded px-3 py-2 border border-gray-200 dark:border-gray-700">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Target Margin</span>
                    <span class="font-medium text-gray-700 dark:text-gray-300">{formatPercentage(config.targetNetMargin)}</span>
                  </div>
                </div>
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
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {#each strategicInsights as insight}
              <div class="text-center p-3 sm:p-4 rounded-lg border {insight.impact === 'positive' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : insight.impact === 'negative' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'}">
                <div class="flex items-center justify-center mb-2 sm:mb-3">
                  {#if insight.impact === 'positive'}
                    <ArrowUpRight class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-300" />
                  {:else if insight.impact === 'negative'}
                    <ArrowDownRight class="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 dark:text-amber-300" />
                  {:else}
                    <ArrowRight class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                  {/if}
                </div>
                <div class="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 {insight.impact === 'positive' ? 'text-blue-700 dark:text-blue-300' : insight.impact === 'negative' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}">
                  {insight.value}
                </div>
                <div class="font-medium text-xs sm:text-sm mb-1">{insight.category}</div>
                <div class="text-xs text-muted-foreground">{insight.description}</div>
              </div>
            {/each}
            
            <!-- Working Time Analysis Cards -->
            <div class="text-center p-3 sm:p-4 rounded-lg border bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800">
              <div class="flex items-center justify-center mb-2 sm:mb-3">
                <Calendar class="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <div class="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-cyan-700 dark:text-cyan-300">
                {calculation.workingDaysPerYear}
              </div>
              <div class="font-medium text-xs sm:text-sm mb-1">Working Days</div>
              <div class="text-xs text-muted-foreground">Per year</div>
            </div>

            <div class="text-center p-3 sm:p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <div class="flex items-center justify-center mb-2 sm:mb-3">
                <Clock class="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-300" />
              </div>
              <div class="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-amber-700 dark:text-amber-300">
                {calculation.totalHoursPerYear - calculation.realBillableHoursPerYear} h
              </div>
              <div class="font-medium text-xs sm:text-sm mb-1">Non-billable Hours</div>
              <div class="text-xs text-muted-foreground">Admin, meetings, training</div>
            </div>
            
            <div class="text-center p-3 sm:p-4 rounded-lg border bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800">
              <div class="flex items-center justify-center mb-2 sm:mb-3">
                <Clock class="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 dark:text-violet-300" />
              </div>
              <div class="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-violet-700 dark:text-violet-300">
                {calculation.realBillableHoursPerYear} h
              </div>
              <div class="font-medium text-xs sm:text-sm mb-1">Realistic Billable</div>
              <div class="text-xs text-muted-foreground">{calculation.billableHoursPerYear}h theoretical</div>
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
        <Card.Content class="relative">
          <div class={!isProEnabled ? "blur-sm pointer-events-none" : ""}>
            <MarginComparisonChart benchmarks={industryBenchmarks} comparison={marginComparison} />
          </div>
          
          {#if !isProEnabled}
            <!-- Pro Overlay -->
            <div class="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[2px] rounded-lg">
              <div class="text-center p-6">
                <Badge variant="secondary" class="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
                  <Lock class="w-3 h-3 mr-1" />
                  <span class="hidden xs:inline">Unlock with </span>Pro
                </Badge>
                <p class="text-sm text-muted-foreground mt-3 max-w-xs">
                  Access detailed industry benchmarks
                </p>
              </div>
            </div>
          {/if}
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
  onProStatusChange={handleProStatusChange}
/>

