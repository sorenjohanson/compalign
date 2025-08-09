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
	import ShareDialog from '$lib/components/ShareDialog.svelte';
	import MarginComparisonChart from '$lib/components/MarginComparisonChart.svelte';
	import FormattedNumberInput from '$lib/components/FormattedNumberInput.svelte';
	import CollaborativeFormattedNumberInput from '$lib/components/CollaborativeFormattedNumberInput.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import {
		Settings,
		Share2,
		Calculator,
		TrendingUp,
		Euro,
		Clock,
		Users,
		Info,
		ArrowUpRight,
		ArrowDownRight,
		ArrowRight,
		BarChart3,
		Target,
		Calendar,
		Lock
	} from '@lucide/svelte';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import CollaborationAvatars from '$lib/components/CollaborationAvatars.svelte';
	import {
		initializeCollaboration,
		joinSession,
		isInSession,
		effectiveProStatus
	} from '$lib/stores/collaboration';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { isCollaborationEnabled } from '$lib/feature-flags';

	const savedInputs = loadInputValuesFromStorage();
	let grossSalary = $state(savedInputs.grossSalary);
	let customerRate = $state(savedInputs.customerRate);
	let config = $state(loadSettingsFromStorage());
	let showSettings = $state(false);
	let showShareDialog = $state(false);
	let isFreelancerMode = $state(false);
	let isProEnabled = $state($effectiveProStatus);
	let isSharedSession = $state(false);
	let showSharedAlert = $state(false);
	let currentSessionId = $state<string | null>(null);

	$effect(() => {
		saveInputValuesToStorage({ grossSalary, customerRate });
	});

	$effect(() => {
		isProEnabled = $effectiveProStatus;
	});

	let calculation = $derived(calculateSalaryBreakdown(grossSalary, customerRate, config));
	let strategicInsights = $derived(generateStrategicInsights(calculation, config));
	let marginComparison = $derived(generateMarginComparison(calculation));
	let marginPosition = $derived(getMarginPosition(calculation.netMarginPercentage));
	let marginStatus = $derived(
		getMarginStatus(calculation.netMarginPercentage, config.targetNetMargin)
	);

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

	function handleShareClose() {
		showShareDialog = false;
	}

	function handleShareOpen() {
		showShareDialog = true;
		initializeCollaborationIfNeeded();
	}

	function handleCollaborationFieldUpdate(event: CustomEvent) {
		const { fieldId, value, userId } = event.detail;

		switch (fieldId) {
			case 'grossSalary':
				grossSalary = value;
				break;
			case 'customerRate':
				customerRate = value;
				break;
		}
	}

	function initializeCollaborationIfNeeded() {
		if (!browser) return;

		initializeCollaboration();

		window.addEventListener(
			'collaboration-field-update',
			handleCollaborationFieldUpdate as EventListener
		);
	}

	onMount(() => {
		if (browser) {
			const urlParams = new URLSearchParams(window.location.search);
			const isShared = urlParams.has('shared');
			const sessionId = urlParams.get('sessionId');
			const storedSessionId = localStorage.getItem('collaboration-session-id');

			// Only initialize if we have a shared session context
			if (isShared) {
				initializeCollaborationIfNeeded();

				const sharedData = localStorage.getItem('shared-calculator-data');
				const isSharedFlag = localStorage.getItem('is-shared-session');

				if (sharedData && isSharedFlag) {
					try {
						const data = JSON.parse(sharedData);
						grossSalary = data.grossSalary;
						customerRate = data.customerRate;
						config = { ...config, ...data.config };
						isSharedSession = true;
						showSharedAlert = true;

						// Use sessionId from URL or fallback to stored one
						const collaborationSessionId = sessionId || storedSessionId;
						if (collaborationSessionId) {
							currentSessionId = collaborationSessionId;
							console.log('Joining collaboration session:', collaborationSessionId);

							// Small delay to ensure Socket.IO is initialized
							setTimeout(() => {
								console.log('Attempting to join session with delay:', collaborationSessionId);
								joinSession(collaborationSessionId);
							}, 1000);
						}

						localStorage.removeItem('shared-calculator-data');
						localStorage.removeItem('is-shared-session');

						// Delay URL cleaning to ensure session join happens first
						setTimeout(() => {
							console.log('Cleaning URL after session join attempt');
							window.history.replaceState({}, '', window.location.pathname);
						}, 2000);

						setTimeout(() => (showSharedAlert = false), 5000);
					} catch (err) {
						console.error('Error loading shared data:', err);
					}
				}
			}
		}

		return () => {
			if (browser) {
				window.removeEventListener(
					'collaboration-field-update',
					handleCollaborationFieldUpdate as EventListener
				);
			}
		};
	});
</script>

<div
	class="min-h-screen bg-gray-100 px-4 py-4 sm:py-8 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800"
>
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-6 text-center sm:mb-8">
			<div class="mb-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
				<div class="flex flex-1 items-center justify-start">
					{#if isCollaborationEnabled() && $isInSession}
						<CollaborationAvatars />
					{/if}
				</div>
				<div class="flex flex-col items-center text-center">
					<div class="mb-2 flex items-center justify-center gap-2 sm:gap-3">
						<Calculator class="hidden h-12 w-12 text-primary md:block" />
						<h1 class="text-3xl font-bold">Rate Transparency Calculator</h1>
					</div>
					<p class="mb-4 text-sm text-muted-foreground sm:mb-0">
						Open Beta • Unlock <span class="font-medium text-blue-600 dark:text-blue-400">Pro</span>
						features in Settings
					</p>
				</div>
				<div class="flex flex-1 items-center justify-end gap-2">
					<DarkModeToggle />
					{#if isCollaborationEnabled()}
						<Button
							variant="outline"
							size="sm"
							onclick={handleShareOpen}
							class="flex items-center gap-2"
						>
							<Share2 class="h-4 w-4" />
							<span class="hidden sm:inline">Share</span>
						</Button>
					{/if}
					<Button
						variant="outline"
						size="sm"
						onclick={() => (showSettings = true)}
						class="flex items-center gap-2"
					>
						<Settings class="h-4 w-4" />
						<span class="hidden sm:inline">Settings</span>
					</Button>
				</div>
			</div>
		</div>

		<!-- Shared Session Alert -->
		{#if showSharedAlert}
			<div class="mb-6">
				<Alert.Root class="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
					<Users class="h-4 w-4" />
					<Alert.Description>
						You're now viewing a shared salary calculation. The values have been loaded
						automatically.
					</Alert.Description>
				</Alert.Root>
			</div>
		{/if}

		<!-- Input Controls -->
		<div class="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-2">
			<Card.Root>
				<Card.Header>
					<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div>
							<Card.Title class="flex items-center gap-2">
								<Euro class="h-5 w-5 text-primary" />
								Annual Gross Salary
							</Card.Title>
						</div>
						<div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:space-x-3">
							<div class="flex items-center space-x-2">
								<span class="text-xs text-muted-foreground/60 sm:text-sm">Employee</span>
								<Switch bind:checked={isFreelancerMode} disabled class="opacity-50" />
								<span class="text-xs text-muted-foreground/60 sm:text-sm">Freelancer</span>
							</div>
							<Badge
								variant="secondary"
								class="border-gray-200 bg-gray-100 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
							>
								<Clock class="mr-1 h-3 w-3" />
								Coming soon
							</Badge>
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="space-y-2">
						{#if isCollaborationEnabled() && $isInSession}
							<CollaborativeFormattedNumberInput
								fieldId="grossSalary"
								bind:value={grossSalary}
								placeholder="90.000"
								min="1"
								step="1000"
								class="h-12 text-lg"
							/>
						{:else}
							<FormattedNumberInput
								bind:value={grossSalary}
								placeholder="90.000"
								min="1"
								step="1000"
								class="h-12 text-lg"
							/>
						{/if}
						<p class="text-xs text-muted-foreground">Enter any positive amount (e.g., 90.000)</p>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Clock class="h-5 w-5 text-primary" />
						Average Billing Rate
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-2">
						{#if isCollaborationEnabled() && $isInSession}
							<CollaborativeFormattedNumberInput
								fieldId="customerRate"
								bind:value={customerRate}
								placeholder="110"
								min="1"
								step="5"
								class="h-12 text-lg"
							/>
						{:else}
							<FormattedNumberInput
								bind:value={customerRate}
								placeholder="110"
								min="1"
								step="5"
								class="h-12 text-lg"
							/>
						{/if}
						<p class="text-xs text-muted-foreground">Enter any positive rate (e.g., 1.500)</p>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

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
						{#each strategicInsights as insight}
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
										<ArrowDownRight
											class="h-5 w-5 text-amber-700 sm:h-6 sm:w-6 dark:text-amber-300"
										/>
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
							<div
								class="mb-1 text-xl font-bold text-cyan-700 sm:mb-2 sm:text-2xl dark:text-cyan-300"
							>
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

		<!-- Industry Benchmark Comparison -->
		<div class="mt-8">
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<BarChart3 class="h-6 w-6 text-primary" />
						Industry Margin Benchmarks
					</Card.Title>
					<Card.Description>
						Compare margins against 2024 industry data to ensure competitive yet sustainable salary
						levels
					</Card.Description>
				</Card.Header>
				<Card.Content class="relative">
					<div class={!isProEnabled ? 'pointer-events-none blur-sm' : ''}>
						<MarginComparisonChart benchmarks={industryBenchmarks} comparison={marginComparison} />
					</div>

					{#if !isProEnabled}
						<!-- Pro Overlay -->
						<div
							class="absolute inset-0 flex items-center justify-center rounded-lg bg-background/10 backdrop-blur-[2px]"
						>
							<div class="p-6 text-center">
								<Badge
									variant="secondary"
									class="border-blue-200 bg-blue-100 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
								>
									<Lock class="mr-1 h-3 w-3" />
									<span class="xs:inline hidden">Unlock with </span>Pro
								</Badge>
								<p class="mt-3 max-w-xs text-sm text-muted-foreground">
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

<!-- Share Dialog -->
<ShareDialog
	bind:open={showShareDialog}
	{grossSalary}
	{customerRate}
	{config}
	onClose={handleShareClose}
/>

<!-- Settings Dialog -->
<SettingsDialog
	bind:open={showSettings}
	{config}
	onClose={handleSettingsClose}
	onSave={handleSettingsSave}
	onProStatusChange={handleProStatusChange}
/>
