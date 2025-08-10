<script lang="ts">
	import {
		calculateSalaryBreakdown,
		generateStrategicInsights,
		generateMarginComparison,
		generateMockMarginComparison,
		mockIndustryBenchmarks,
		getMarginStatus,
		loadSettingsFromStorage,
		saveSettingsToStorage,
		loadInputValuesFromStorage,
		saveInputValuesToStorage,
		type CalculatorConfig,
		type IndustryBenchmark,
		type MarginComparison
	} from '$lib/salary-calculator';
	import { proStatus } from '$lib/stores/pro-status';
	import { fetchIndustryMargins, isIndustryMarginError } from '$lib/services/industry-margins';
	import SettingsDialog from '$lib/components/SettingsDialog.svelte';
	import ShareDialog from '$lib/components/ShareDialog.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import InputControls from '$lib/components/InputControls.svelte';
	import KeyMetrics from '$lib/components/KeyMetrics.svelte';
	import FinancialOverview from '$lib/components/FinancialOverview.svelte';
	import StrategicAnalysis from '$lib/components/StrategicAnalysis.svelte';
	import IndustryBenchmarks from '$lib/components/IndustryBenchmarks.svelte';
	import {
		initializeCollaboration,
		joinSession,
		effectiveProStatus
	} from '$lib/stores/collaboration';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	const savedInputs = loadInputValuesFromStorage();
	let grossSalary = $state(savedInputs.grossSalary);
	let customerRate = $state(savedInputs.customerRate);
	let config = $state(loadSettingsFromStorage());
	let showSettings = $state(false);
	let showShareDialog = $state(false);
	let isFreelancerMode = $state(false);
	// Use both local Pro status and collaborative Pro status
	let isProEnabled = $derived($effectiveProStatus || $proStatus.isUnlocked);
	let showSharedAlert = $state(false);

	$effect(() => {
		saveInputValuesToStorage({ grossSalary, customerRate });
	});

	let calculation = $derived(calculateSalaryBreakdown(grossSalary, customerRate, config));
	let strategicInsights = $derived(generateStrategicInsights(calculation, config));

	// Industry margins state - always provide data for display
	let industryBenchmarks: IndustryBenchmark[] = $state(mockIndustryBenchmarks);
	let marginComparison: MarginComparison | undefined = $state();
	let industryDataLoading = $state(false);
	let industryDataError = $state<string | null>(null);

	// Update margin comparison when calculation changes
	$effect(() => {
		if (!isProEnabled || industryBenchmarks === mockIndustryBenchmarks) {
			marginComparison = generateMockMarginComparison(calculation);
		} else {
			marginComparison = generateMarginComparison(calculation, industryBenchmarks);
		}
	});

	// Load industry margins when Pro status changes
	$effect(() => {
		const loadIndustryMargins = async () => {
			if (isProEnabled) {
				industryDataLoading = true;
				industryDataError = null;

				try {
					const userId = proStatus.getUserId();
					const response = await fetchIndustryMargins(userId);
					if (isIndustryMarginError(response)) {
						industryDataError = response.error;
						// Fall back to mock data on error
						industryBenchmarks = mockIndustryBenchmarks;
						marginComparison = generateMockMarginComparison(calculation);
					} else {
						industryBenchmarks = response.benchmarks;
						// Generate margin comparison with fetched data
						marginComparison = generateMarginComparison(calculation, response.benchmarks);
					}
				} catch (error) {
					console.error('Failed to load industry margins:', error);
					industryDataError = 'Failed to load industry data';
					// Fall back to mock data on error
					industryBenchmarks = mockIndustryBenchmarks;
					marginComparison = generateMockMarginComparison(calculation);
				} finally {
					industryDataLoading = false;
				}
			} else {
				// Use mock data when Pro access is not available
				industryBenchmarks = mockIndustryBenchmarks;
				marginComparison = generateMockMarginComparison(calculation);
				industryDataError = null;
				industryDataLoading = false;
			}
		};

		loadIndustryMargins();
	});

	function handleSettingsClose() {
		showSettings = false;
	}

	function handleSettingsSave(newConfig: CalculatorConfig) {
		config = { ...newConfig };
		saveSettingsToStorage(config);
	}

	function handleProStatusChange() {
		// Pro status is now reactive through the store
		// This function can be used for additional logic if needed
	}

	function handleShareClose() {
		showShareDialog = false;
	}

	function handleShareOpen() {
		showShareDialog = true;
		initializeCollaborationIfNeeded();
	}

	function handleCollaborationFieldUpdate(event: CustomEvent) {
		const { fieldId, value } = event.detail;

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
						showSharedAlert = true;

						// Use sessionId from URL or fallback to stored one
						const collaborationSessionId = sessionId || storedSessionId;
						if (collaborationSessionId) {
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
		<PageHeader onShareOpen={handleShareOpen} onSettingsOpen={() => (showSettings = true)} />

		<InputControls bind:grossSalary bind:customerRate bind:isFreelancerMode {showSharedAlert} />

		<KeyMetrics {calculation} {config} />

		<FinancialOverview {calculation} {config} />

		<StrategicAnalysis {calculation} {strategicInsights} />

		<IndustryBenchmarks
			{isProEnabled}
			{industryBenchmarks}
			{marginComparison}
			{industryDataLoading}
			{industryDataError}
		/>
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
