<script lang="ts">
	import * as InputOTP from '$lib/components/ui/input-otp';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Lock, Users, AlertCircle } from '@lucide/svelte';
	import { isCollaborationEnabled } from '$lib/feature-flags';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let otpValue = $state('');
	let isVerifying = $state(false);
	let error = $state('');

	const sessionId = $page.params.sessionId as string;

	onMount(() => {
		if (browser && !isCollaborationEnabled()) {
			goto('/');
		}
	});

	async function handleVerifyOTP() {
		if (otpValue.length !== 6) {
			error = 'Please enter the complete 6-character code';
			return;
		}

		isVerifying = true;
		error = '';

		try {
			const response = await fetch(`/api/v1/share/${sessionId}/verify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ otpCode: otpValue })
			});

			const result = await response.json();

			if (!response.ok) {
				if (response.status === 401) {
					error =
						result.error ||
						'Invalid or expired access code. The code may have rotated - please get a fresh one.';
				} else {
					error = result.error || 'Verification failed';
				}
				return;
			}

			if (result.valid) {
				localStorage.setItem('shared-calculator-data', JSON.stringify(result.calculatorData));
				localStorage.setItem('is-shared-session', 'true');
				localStorage.setItem('collaboration-session-id', sessionId);
				goto(`/share/${sessionId}/calculator`);
			}
		} catch (err) {
			error = 'Network error. Please try again.';
		} finally {
			isVerifying = false;
		}
	}

	function handleComplete() {
		if (otpValue.length === 6) {
			handleVerifyOTP();
		}
	}

	$effect(() => {
		if (otpValue) {
			const capitalizedValue = otpValue.toUpperCase();
			if (capitalizedValue !== otpValue) {
				otpValue = capitalizedValue;
			}
		}
	});
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800"
>
	<div class="w-full max-w-md">
		<Card.Root>
			<Card.Header class="text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50"
				>
					<Users class="h-6 w-6 text-blue-600 dark:text-blue-300" />
				</div>
				<Card.Title class="text-2xl">Join Shared Calculator</Card.Title>
				<Card.Description>
					Enter the 6-character access code to view the shared salary calculation (letters will be
					automatically capitalized)
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="flex flex-col items-center space-y-4">
					<InputOTP.Root
						bind:value={otpValue}
						maxlength={6}
						onComplete={handleComplete}
						class="space-x-2 [&_input]:uppercase [&_input]:placeholder-gray-400"
						pattern="[A-Z0-9]*"
					>
						{#snippet children({ cells })}
							<InputOTP.Group>
								{#each cells.slice(0, 3) as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator />
							<InputOTP.Group>
								{#each cells.slice(3, 6) as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>

					{#if error}
						<Alert.Root variant="destructive" class="w-full">
							<AlertCircle class="h-4 w-4" />
							<Alert.Description>{error}</Alert.Description>
						</Alert.Root>
					{/if}

					<Button
						onclick={handleVerifyOTP}
						disabled={otpValue.length !== 6 || isVerifying}
						class="w-full"
					>
						{#if isVerifying}
							<Lock class="mr-2 h-4 w-4 animate-spin" />
							Verifying...
						{:else}
							<Lock class="mr-2 h-4 w-4" />
							Access Calculator
						{/if}
					</Button>
				</div>

				<div class="text-center text-sm text-muted-foreground">
					<p>This code was provided by the person who shared the calculator with you.</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
