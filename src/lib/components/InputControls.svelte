<script lang="ts">
	import { Euro, Clock, Users } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Alert from '$lib/components/ui/alert';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import FormattedNumberInput from '$lib/components/FormattedNumberInput.svelte';
	import CollaborativeFormattedNumberInput from '$lib/components/CollaborativeFormattedNumberInput.svelte';
	import { isCollaborationEnabled } from '$lib/feature-flags';
	import { isInSession } from '$lib/stores/collaboration';

	let {
		grossSalary = $bindable(),
		customerRate = $bindable(),
		isFreelancerMode = $bindable(false),
		showSharedAlert = false
	} = $props();
</script>

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