<script lang="ts">
	import {
		type CalculatorConfig,
		defaultConfig,
		clearSettingsFromStorage,
		validateFuzzyHours,
		calculateSalaryBreakdown
	} from '$lib/salary-calculator';
	import { proStatus } from '$lib/stores/pro-status';
	import { getPaymentLink, isPaymentLinkError } from '$lib/services/stripe-client';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Settings, Lock, Unlock } from '@lucide/svelte';

	interface Props {
		open: boolean;
		config: CalculatorConfig;
		onClose: () => void;
		onSave: (config: CalculatorConfig) => void;
		onProStatusChange?: () => void;
	}

	let { open = $bindable(), config, onClose, onSave, onProStatusChange }: Props = $props();

	let tempConfig = $state({ ...config });
	let resetConfirmation = $state(false);

	// Use the new Pro status store
	let isProEnabled = $derived($proStatus.isUnlocked);

	// Reactive variables for percentage inputs (display as whole numbers)
	let employerRatePercent = $state(config.employerSocialContributionRate * 100);
	let targetNetMarginPercent = $state(config.targetNetMargin);
	let overheadPercent = $state(config.overheadAsPercentOfRevenue * 100);

	let fuzzyHoursValidation = $derived(validateFuzzyHours(tempConfig));

	// Calculate utilisation rate from the current config
	let calculatedUtilisationRate = $derived(() => {
		// Use sample values for calculation - we just need the utilisation rate
		const sampleCalculation = calculateSalaryBreakdown(90000, 110, tempConfig);
		return sampleCalculation.utilisationRate * 100;
	});

	$effect(() => {
		if (open) {
			tempConfig = { ...config };
			employerRatePercent = config.employerSocialContributionRate * 100;
			targetNetMarginPercent = config.targetNetMargin;
			overheadPercent = config.overheadAsPercentOfRevenue * 100;
			resetConfirmation = false;
		}
	});

	$effect(() => {
		tempConfig.employerSocialContributionRate = employerRatePercent / 100;
		tempConfig.targetNetMargin = targetNetMarginPercent;
		tempConfig.overheadAsPercentOfRevenue = overheadPercent / 100;
	});

	function handleSave() {
		onSave(tempConfig);
		onClose();
	}

	function handleResetToDefaults() {
		if (!resetConfirmation) {
			resetConfirmation = true;
			setTimeout(() => {
				resetConfirmation = false;
			}, 3000);
		} else {
			clearSettingsFromStorage();
			tempConfig = { ...defaultConfig };
			employerRatePercent = defaultConfig.employerSocialContributionRate * 100;
			targetNetMarginPercent = defaultConfig.targetNetMargin;
			overheadPercent = defaultConfig.overheadAsPercentOfRevenue * 100;
			resetConfirmation = false;
		}
	}

	async function handleProToggle() {
		if (isProEnabled) {
			onProStatusChange?.();
		} else {
			// Get payment link from server and redirect to Stripe
			try {
				const userId = proStatus.getUserId();
				const response = await getPaymentLink(userId || undefined);

				if (isPaymentLinkError(response)) {
					console.error('Failed to get payment link:', response.error);
					// Fallback - could show an error message to user
					alert('Unable to load payment page. Please try again.');
					return;
				}

				// Redirect to Stripe payment
				window.open(response.paymentLink, '_blank');
			} catch (error) {
				console.error('Error getting payment link:', error);
				alert('Unable to load payment page. Please try again.');
			}
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto sm:w-full">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Settings class="h-5 w-5" />
				Calculator Settings
			</Dialog.Title>
			<Dialog.Description>
				Configure employment parameters for accurate calculations
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4 sm:space-y-6">
			<div
				class="rounded-lg border border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-blue-50/50 p-4 dark:border-blue-800/50 dark:from-blue-950/20 dark:to-blue-950/20"
			>
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						{#if isProEnabled}
							<Unlock class="h-5 w-5 text-blue-600 dark:text-blue-300" />
							<span class="font-medium text-blue-700 dark:text-blue-300">Pro Features Unlocked</span
							>
						{:else}
							<Lock class="h-5 w-5 text-blue-600 dark:text-blue-300" />
							<span class="font-medium text-blue-700 dark:text-blue-300">Pro Features</span>
						{/if}
					</div>
					{#if !isProEnabled}
						<Button
							variant={isProEnabled ? 'outline' : 'default'}
							size="sm"
							onclick={handleProToggle}
							class="bg-blue-600 text-white hover:bg-blue-700"
						>
							<Unlock class="mr-2 h-4 w-4" />
							Unlock Pro
						</Button>
					{/if}
				</div>
				<div class="text-sm text-muted-foreground">
					{#if isProEnabled}
						<p>✓ Industry benchmark comparisons</p>
						<p>✓ Freelancer mode (soon!)</p>
						<p>✓ Internationalisation (soon!)</p>
					{:else}
						<p>• Industry benchmark comparisons</p>
						<p>• Freelancer mode (soon!)</p>
						<p>• Internationalisation (soon!)</p>
					{/if}
				</div>
			</div>

			<!-- Work Schedule -->
			<div class="space-y-3 sm:space-y-4">
				<h3 class="border-b pb-2 text-base font-medium">Work Schedule</h3>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="workingDaysPerWeek" class="text-sm font-medium">Working Days / Week</label>
						<Input
							id="workingDaysPerWeek"
							type="number"
							bind:value={tempConfig.workingDaysPerWeek}
							min="4"
							max="6"
							step="1"
						/>
						<p class="text-xs text-muted-foreground">Standard: 5 days</p>
					</div>
					<div class="space-y-2">
						<label for="hoursPerDay" class="text-sm font-medium">Hours / Day</label>
						<Input
							id="hoursPerDay"
							type="number"
							bind:value={tempConfig.hoursPerWorkingDay}
							min="6"
							max="10"
							step="0.5"
						/>
						<p class="text-xs text-muted-foreground">Standard: 8 hours</p>
					</div>
				</div>
			</div>

			<!-- Time Off -->
			<div class="space-y-3 sm:space-y-4">
				<h3 class="border-b pb-2 text-base font-medium">Time Off (Days per Year)</h3>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="vacationDays" class="text-sm font-medium">Vacation</label>
						<Input
							id="vacationDays"
							type="number"
							bind:value={tempConfig.vacationDays}
							min="20"
							max="50"
							step="1"
						/>
						<p class="text-xs text-muted-foreground">German minimum: 24 days</p>
					</div>
					<div class="space-y-2">
						<label for="sickDays" class="text-sm font-medium">Sick Days</label>
						<Input
							id="sickDays"
							type="number"
							bind:value={tempConfig.sickDaysEstimate}
							min="0"
							max="30"
							step="1"
						/>
						<p class="text-xs text-muted-foreground">Average: 8-12 days per year</p>
					</div>
					<div class="space-y-2">
						<label for="trainingDays" class="text-sm font-medium">Training</label>
						<Input
							id="trainingDays"
							type="number"
							bind:value={tempConfig.trainingDays}
							min="0"
							max="30"
							step="1"
						/>
						<p class="text-xs text-muted-foreground">Professional development time</p>
					</div>
					<div class="space-y-2">
						<label for="publicHolidays" class="text-sm font-medium">Holidays</label>
						<Input
							id="publicHolidays"
							type="number"
							bind:value={tempConfig.publicHolidays}
							min="9"
							max="15"
							step="1"
						/>
						<p class="text-xs text-muted-foreground">Varies by German state (9-13)</p>
					</div>
				</div>
			</div>

			<!-- Non-Billable Work -->
			<div class="space-y-3 sm:space-y-4">
				<div class="flex flex-col justify-between gap-1 border-b pb-2 sm:flex-row sm:items-center">
					<h3 class="text-base font-medium">Non-Billable Work (Hours/Week)</h3>
					<span class="text-sm text-muted-foreground">
						Utilisation: {calculatedUtilisationRate().toFixed(0)}%
					</span>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="internalMeetings" class="text-sm font-medium">Meetings</label>
						<Input
							id="internalMeetings"
							type="number"
							bind:value={tempConfig.internalMeetingsHours}
							min="0"
							max="20"
							step="0.5"
						/>
						<p class="text-xs text-muted-foreground">Team meetings, planning, standups</p>
					</div>
					<div class="space-y-2">
						<label for="adminTasks" class="text-sm font-medium">Admin</label>
						<Input
							id="adminTasks"
							type="number"
							bind:value={tempConfig.adminTasksHours}
							min="0"
							max="10"
							step="0.5"
						/>
						<p class="text-xs text-muted-foreground">Timesheets, expenses, reporting</p>
					</div>
					<div class="space-y-2">
						<label for="salesDemos" class="text-sm font-medium">Sales</label>
						<Input
							id="salesDemos"
							type="number"
							bind:value={tempConfig.salesDemosHours}
							min="0"
							max="20"
							step="0.5"
						/>
						<p class="text-xs text-muted-foreground">Client demos, technical presentations</p>
					</div>
					<div class="space-y-2">
						<label for="businessDev" class="text-sm font-medium">Business Dev</label>
						<Input
							id="businessDev"
							type="number"
							bind:value={tempConfig.businessDevelopmentHours}
							min="0"
							max="10"
							step="0.5"
						/>
						<p class="text-xs text-muted-foreground">Networking, proposals, marketing</p>
					</div>
				</div>
			</div>

			<!-- Financial Settings -->
			<div class="space-y-3 sm:space-y-4">
				<h3 class="border-b pb-2 text-base font-medium">Financial Settings</h3>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="employerRate" class="text-sm font-medium">Employer Costs (%)</label>
						<Input
							id="employerRate"
							type="number"
							bind:value={employerRatePercent}
							min="15"
							max="25"
							step="1"
						/>
						<p class="text-xs text-muted-foreground">
							Social contributions, insurance, benefits (German standard: 20%)
						</p>
					</div>
					<div class="space-y-2">
						<label for="overheadPercent" class="text-sm font-medium">Overhead (%)</label>
						<Input
							id="overheadPercent"
							type="number"
							bind:value={overheadPercent}
							min="5"
							max="40"
							step="1"
						/>
						<p class="text-xs text-muted-foreground">
							Office, admin, tools, marketing costs (15% is typical)
						</p>
					</div>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="targetMargin" class="text-sm font-medium">Target Net Margin (%)</label>
						<Input
							id="targetMargin"
							type="number"
							bind:value={targetNetMarginPercent}
							min="5"
							max="50"
							step="1"
						/>
						<p class="text-xs text-muted-foreground">
							Company's target net margin percentage for sustainable operations
						</p>
					</div>
				</div>
			</div>

			<!-- Configuration Summary -->
			<Card.Root class="hidden sm:block">
				<Card.Header>
					<Card.Title class="text-base">Configuration Summary</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-2 text-sm">
					<!-- Time Breakdown -->
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Total non-working days:</span>
							<span class="font-medium">
								{tempConfig.vacationDays +
									tempConfig.sickDaysEstimate +
									tempConfig.trainingDays +
									tempConfig.publicHolidays}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Working days per year:</span>
							<span class="font-medium">
								{261 -
									(tempConfig.vacationDays +
										tempConfig.sickDaysEstimate +
										tempConfig.trainingDays +
										tempConfig.publicHolidays)}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Calculated utilisation rate:</span>
							<span class="font-medium">
								{calculatedUtilisationRate().toFixed(0)}%
							</span>
						</div>
					</div>

					<!-- Non-Billable Hours -->
					<div class="space-y-2 border-t pt-2">
						<div class="text-xs font-medium">Weekly Non-Billable Hours:</div>
						<div class="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
							<div class="flex justify-between">
								<span class="text-muted-foreground">Meetings:</span>
								<span>{tempConfig.internalMeetingsHours}h</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Admin:</span>
								<span>{tempConfig.adminTasksHours}h</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Sales:</span>
								<span>{tempConfig.salesDemosHours}h</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Business dev:</span>
								<span>{tempConfig.businessDevelopmentHours}h</span>
							</div>
						</div>
						<div class="flex justify-between border-t pt-1">
							<span class="font-medium text-muted-foreground">Total non-billable hours/week:</span>
							<span
								class="font-medium {!fuzzyHoursValidation.isValid
									? 'text-slate-600 dark:text-slate-300'
									: ''}"
							>
								{fuzzyHoursValidation.totalFuzzyHours}h / {fuzzyHoursValidation.maxWeeklyHours}h
							</span>
						</div>
						{#if !fuzzyHoursValidation.isValid}
							<div class="mt-1 text-xs text-slate-600 dark:text-slate-300">
								⚠️ Exceeds weekly capacity by {fuzzyHoursValidation.exceededBy.toFixed(1)}h. Hours
								will be scaled down proportionally.
							</div>
						{/if}
					</div>

					<!-- Financial Summary -->
					<div class="border-t pt-2">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Additional employer cost:</span>
							<span class="font-medium">
								{employerRatePercent.toFixed(1)}%
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Overhead costs:</span>
							<span class="font-medium">
								{overheadPercent.toFixed(1)}%
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Target net margin:</span>
							<span class="font-medium">
								{targetNetMarginPercent.toFixed(1)}%
							</span>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<Dialog.Footer class="flex flex-col justify-between gap-3 sm:flex-row sm:gap-0">
			<Button
				variant="ghost"
				onclick={handleResetToDefaults}
				class={`w-full sm:w-auto ${resetConfirmation ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive' : 'text-destructive hover:text-destructive'}`}
			>
				{resetConfirmation ? 'Are you sure?' : 'Reset to Defaults'}
			</Button>

			<div class="flex w-full gap-3 sm:w-auto">
				<Button variant="outline" onclick={onClose} class="flex-1 sm:flex-none">Cancel</Button>
				<Button onclick={handleSave} class="flex-1 sm:flex-none">Save Settings</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
