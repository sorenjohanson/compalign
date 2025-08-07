<script lang="ts">
	import {
		type CalculatorConfig,
		defaultConfig,
		clearSettingsFromStorage
	} from '../salary-calculator.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Settings from '@lucide/svelte/icons/settings';

	interface Props {
		open: boolean;
		config: CalculatorConfig;
		onClose: () => void;
		onSave: (config: CalculatorConfig) => void;
	}

	let { open = $bindable(), config, onClose, onSave }: Props = $props();

	let tempConfig = $state({ ...config });
	let resetConfirmation = $state(false);

	// Reactive variables for percentage inputs (display as whole numbers)
	let employerRatePercent = $state(config.employerSocialContributionRate * 100);
	let utilisationRatePercent = $state(config.utilisationRate * 100);
	let targetNetMarginPercent = $state(config.targetNetMargin);

	$effect(() => {
		if (open) {
			tempConfig = { ...config };
			employerRatePercent = config.employerSocialContributionRate * 100;
			utilisationRatePercent = config.utilisationRate * 100;
			targetNetMarginPercent = config.targetNetMargin;
			resetConfirmation = false;
		}
	});

	// Update tempConfig when percentage inputs change
	$effect(() => {
		tempConfig.employerSocialContributionRate = employerRatePercent / 100;
		tempConfig.utilisationRate = utilisationRatePercent / 100;
		tempConfig.targetNetMargin = targetNetMarginPercent;
	});

	function handleSave() {
		onSave(tempConfig);
		onClose();
	}

	function handleResetToDefaults() {
		if (!resetConfirmation) {
			resetConfirmation = true;
			// Auto-reset confirmation after 3 seconds
			setTimeout(() => {
				resetConfirmation = false;
			}, 3000);
		} else {
			clearSettingsFromStorage();
			tempConfig = { ...defaultConfig };
			employerRatePercent = defaultConfig.employerSocialContributionRate * 100;
			utilisationRatePercent = defaultConfig.utilisationRate * 100;
			targetNetMarginPercent = defaultConfig.targetNetMargin;
			resetConfirmation = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Settings class="h-5 w-5" />
				Calculator Settings
			</Dialog.Title>
			<Dialog.Description>
				Configure German employment parameters for accurate calculations
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<!-- Social Contributions and Vacation -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<label for="employerRate" class="text-sm font-medium">
						Additional Employer Cost (%)
					</label>
					<Input
						id="employerRate"
						type="number"
						bind:value={employerRatePercent}
						min="15"
						max="25"
						step="1"
						placeholder="20"
					/>
					<p class="text-xs text-muted-foreground">
						Social contributions, insurance, benefits (German standard: 20%)
					</p>
				</div>

				<div class="space-y-2">
					<label for="vacationDays" class="text-sm font-medium"> Vacation Days </label>
					<Input
						id="vacationDays"
						type="number"
						bind:value={tempConfig.vacationDays}
						min="20"
						max="50"
						step="1"
						placeholder="30"
					/>
					<p class="text-xs text-muted-foreground">German minimum: 24 days</p>
				</div>
			</div>

			<!-- Sick Days and Training -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<label for="sickDays" class="text-sm font-medium"> Estimated Sick Days </label>
					<Input
						id="sickDays"
						type="number"
						bind:value={tempConfig.sickDaysEstimate}
						min="0"
						max="30"
						step="1"
						placeholder="8"
					/>
					<p class="text-xs text-muted-foreground">Average: 8-12 days per year</p>
				</div>

				<div class="space-y-2">
					<label for="trainingDays" class="text-sm font-medium"> Training/Development Days </label>
					<Input
						id="trainingDays"
						type="number"
						bind:value={tempConfig.trainingDays}
						min="0"
						max="30"
						step="1"
						placeholder="10"
					/>
					<p class="text-xs text-muted-foreground">Professional development time</p>
				</div>
			</div>

			<!-- Public Holidays and Working Schedule -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<label for="publicHolidays" class="text-sm font-medium"> Public Holidays </label>
					<Input
						id="publicHolidays"
						type="number"
						bind:value={tempConfig.publicHolidays}
						min="9"
						max="15"
						step="1"
						placeholder="11"
					/>
					<p class="text-xs text-muted-foreground">Varies by German state (9-13)</p>
				</div>

				<div class="space-y-2">
					<label for="workingDaysPerWeek" class="text-sm font-medium">
						Working Days per Week
					</label>
					<Input
						id="workingDaysPerWeek"
						type="number"
						bind:value={tempConfig.workingDaysPerWeek}
						min="4"
						max="6"
						step="1"
						placeholder="5"
					/>
					<p class="text-xs text-muted-foreground">Standard: 5 days</p>
				</div>
			</div>

			<!-- Hours per Day -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<label for="hoursPerDay" class="text-sm font-medium"> Hours per Working Day </label>
					<Input
						id="hoursPerDay"
						type="number"
						bind:value={tempConfig.hoursPerWorkingDay}
						min="6"
						max="10"
						step="0.5"
						placeholder="8"
					/>
					<p class="text-xs text-muted-foreground">Standard: 8 hours</p>
				</div>

				<div class="space-y-2">
					<label for="utilisationRate" class="text-sm font-medium"> Utilisation Rate (%) </label>
					<Input
						id="utilisationRate"
						type="number"
						bind:value={utilisationRatePercent}
						min="40"
						max="90"
						step="5"
						placeholder="65"
					/>
					<p class="text-xs text-muted-foreground">
						Realistic billable hours: 65% is industry average
					</p>
				</div>
			</div>

			<!-- Target Margin Section -->
			<div class="space-y-2">
				<label for="targetMargin" class="text-sm font-medium"> Target Net Margin (%) </label>
				<Input
					id="targetMargin"
					type="number"
					bind:value={targetNetMarginPercent}
					min="5"
					max="50"
					step="1"
					placeholder="25"
				/>
				<p class="text-xs text-muted-foreground">
					Company's target net profit margin for sustainable operations
				</p>
			</div>

			<!-- Fuzzy Costs Section -->
			<div class="space-y-4">
				<div class="border-t pt-4">
					<h3 class="mb-3 text-base font-medium">Non-Billable Work (Hours per Week)</h3>
					<p class="mb-4 text-xs text-muted-foreground">
						These activities add business value but aren't directly billable to clients
					</p>
				</div>

				<!-- Sales and Business Development -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<label for="salesDemos" class="text-sm font-medium"> Sales Demos & Pre-Sales </label>
						<Input
							id="salesDemos"
							type="number"
							bind:value={tempConfig.salesDemosHours}
							min="0"
							max="20"
							step="0.5"
							placeholder="2"
						/>
						<p class="text-xs text-muted-foreground">Client demos, technical presentations</p>
					</div>

					<div class="space-y-2">
						<label for="businessDev" class="text-sm font-medium"> Business Development </label>
						<Input
							id="businessDev"
							type="number"
							bind:value={tempConfig.businessDevelopmentHours}
							min="0"
							max="10"
							step="0.5"
							placeholder="1"
						/>
						<p class="text-xs text-muted-foreground">Networking, proposals, marketing</p>
					</div>
				</div>

				<!-- Internal Operations -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<label for="internalMeetings" class="text-sm font-medium"> Internal Meetings </label>
						<Input
							id="internalMeetings"
							type="number"
							bind:value={tempConfig.internalMeetingsHours}
							min="0"
							max="20"
							step="0.5"
							placeholder="4"
						/>
						<p class="text-xs text-muted-foreground">Team meetings, planning, standups</p>
					</div>

					<div class="space-y-2">
						<label for="adminTasks" class="text-sm font-medium"> Admin Tasks </label>
						<Input
							id="adminTasks"
							type="number"
							bind:value={tempConfig.adminTasksHours}
							min="0"
							max="10"
							step="0.5"
							placeholder="2"
						/>
						<p class="text-xs text-muted-foreground">Timesheets, expenses, reporting</p>
					</div>
				</div>
			</div>

			<!-- Summary Card -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Configuration Summary</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3 text-sm">
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
							<span class="text-muted-foreground">Utilisation rate:</span>
							<span class="font-medium">
								{utilisationRatePercent.toFixed(0)}%
							</span>
						</div>
					</div>

					<!-- Fuzzy Costs -->
					<div class="space-y-2 border-t pt-2">
						<div class="text-xs font-medium">Weekly Non-Billable Hours:</div>
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div class="flex justify-between">
								<span class="text-muted-foreground">Sales demos:</span>
								<span>{tempConfig.salesDemosHours}h</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Internal meetings:</span>
								<span>{tempConfig.internalMeetingsHours}h</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Admin tasks:</span>
								<span>{tempConfig.adminTasksHours}h</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Business dev:</span>
								<span>{tempConfig.businessDevelopmentHours}h</span>
							</div>
						</div>
						<div class="flex justify-between border-t pt-1">
							<span class="font-medium text-muted-foreground">Total fuzzy hours/week:</span>
							<span class="font-medium">
								{tempConfig.salesDemosHours +
									tempConfig.internalMeetingsHours +
									tempConfig.adminTasksHours +
									tempConfig.businessDevelopmentHours}h
							</span>
						</div>
					</div>

					<!-- Employer Contribution -->
					<div class="border-t pt-2">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Additional employer cost:</span>
							<span class="font-medium">
								{employerRatePercent.toFixed(1)}%
							</span>
						</div>
						<div class="mt-2 flex justify-between">
							<span class="text-muted-foreground">Target net margin:</span>
							<span class="font-medium">
								{targetNetMarginPercent}%
							</span>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<Dialog.Footer class="flex justify-between">
			<Button
				variant="ghost"
				onclick={handleResetToDefaults}
				class={resetConfirmation ? 'text-destructive bg-destructive/10 hover:bg-destructive/20 hover:text-destructive' : 'text-destructive hover:text-destructive'}
			>
				{resetConfirmation ? 'Are you sure?' : 'Reset to Defaults'}
			</Button>

			<div class="flex gap-3">
				<Button variant="outline" onclick={onClose}>Cancel</Button>
				<Button onclick={handleSave}>Save Settings</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
