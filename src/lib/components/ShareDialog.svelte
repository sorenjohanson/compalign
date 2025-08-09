<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Alert from '$lib/components/ui/alert';
	import {
		Share2,
		Copy,
		Users,
		Clock,
		Key,
		CheckCircle,
		AlertCircle,
		Trash2
	} from '@lucide/svelte';
	import { initializeCollaboration, joinSession } from '$lib/stores/collaboration';
	import type { CalculatorConfig } from '$lib/salary-calculator';

	interface Props {
		open: boolean;
		grossSalary: number;
		customerRate: number;
		config: CalculatorConfig;
		onClose: () => void;
	}

	let { open = $bindable(), grossSalary, customerRate, config, onClose }: Props = $props();

	let isCreating = $state(false);
	let isDeactivating = $state(false);
	let activeSession = $state<{
		id: string;
		otpCode: string;
		shareableLink: string;
		otpExpiresAt: Date;
		createdAt: Date;
		isUpdate?: boolean;
	} | null>(null);
	let error = $state('');
	let linkCopied = $state(false);
	let otpCopied = $state(false);
	let isLoadingSession = $state(false);
	let otpTimeRemaining = $state<number>(0);
	let otpTimer = $state<ReturnType<typeof setInterval> | null>(null);

	async function createOrUpdateShare() {
		isCreating = true;
		error = '';

		try {
			const response = await fetch('/api/v1/share', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					grossSalary,
					customerRate,
					config
				})
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to create shareable link';
				return;
			}

			activeSession = {
				id: result.sessionId,
				otpCode: result.otpCode,
				shareableLink: result.shareableLink,
				otpExpiresAt: new Date(result.otpExpiresAt),
				createdAt: new Date(),
				isUpdate: result.isUpdate
			};

			initializeCollaboration();

			localStorage.setItem('collaboration-session-id', result.sessionId);

			setTimeout(() => {
				console.log('Creator joining collaboration session:', result.sessionId);
				joinSession(
					result.sessionId,
					{
						name: 'Session Creator'
					},
					true
				); // true = isHost
			}, 1000);

			startOTPTimer();
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			isCreating = false;
		}
	}

	async function copyToClipboard(text: string, type: 'link' | 'otp') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'link') {
				linkCopied = true;
				setTimeout(() => (linkCopied = false), 2000);
			} else {
				otpCopied = true;
				setTimeout(() => (otpCopied = false), 2000);
			}
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	}

	async function loadActiveSession() {
		isLoadingSession = true;
		try {
			const response = await fetch('/api/v1/share/history');
			if (response.ok) {
				const result = await response.json();
				if (result.session) {
					activeSession = {
						...result.session,
						otpExpiresAt: new Date(result.session.otpExpiresAt),
						createdAt: new Date(result.session.createdAt)
					};
					startOTPTimer();
				}
			}
		} catch (err) {
			console.error('Failed to load active session:', err);
		} finally {
			isLoadingSession = false;
		}
	}

	async function deactivateSession() {
		isDeactivating = true;
		try {
			const response = await fetch('/api/v1/share/deactivate', {
				method: 'POST'
			});

			if (response.ok) {
				activeSession = null;
				stopOTPTimer();
			}
		} catch (err) {
			console.error('Failed to deactivate session:', err);
		} finally {
			isDeactivating = false;
		}
	}

	function startOTPTimer() {
		stopOTPTimer(); // Clear any existing timer

		const updateTimer = () => {
			if (!activeSession) return;

			const now = new Date();
			const timeLeft = Math.max(0, activeSession.otpExpiresAt.getTime() - now.getTime());
			otpTimeRemaining = Math.floor(timeLeft / 1000);

			if (timeLeft <= 0) {
				// OTP expired, refresh to get new one
				loadActiveSession();
			}
		};

		updateTimer();
		otpTimer = setInterval(updateTimer, 1000);
	}

	function stopOTPTimer() {
		if (otpTimer) {
			clearInterval(otpTimer);
			otpTimer = null;
		}
		otpTimeRemaining = 0;
	}

	function handleClose() {
		error = '';
		linkCopied = false;
		otpCopied = false;
		stopOTPTimer();
		onClose();
	}

	$effect(() => {
		if (open) {
			loadActiveSession();
		}
	});

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function formatDateTime(date: Date): string {
		return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[80vh] max-w-lg overflow-hidden">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Share2 class="h-5 w-5" />
				Collaboration Link
			</Dialog.Title>
			<Dialog.Description>
				Share your salary calculation securely with a rotating access code
			</Dialog.Description>
		</Dialog.Header>

		<div class="max-h-[60vh] overflow-y-auto">
			{#if isLoadingSession}
				<div class="flex items-center justify-center py-8">
					<Share2 class="mr-2 h-6 w-6 animate-spin" />
					Loading session...
				</div>
			{:else if !activeSession}
				<!-- No Active Session -->
				<div class="space-y-4">
					<Card.Root>
						<Card.Content class="pt-6">
							<div class="space-y-3 text-center">
								<div
									class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50"
								>
									<Users class="h-6 w-6 text-blue-600 dark:text-blue-300" />
								</div>
								<div>
									<h3 class="font-semibold">No Active Share</h3>
									<p class="mt-1 text-sm text-muted-foreground">
										Create a collaboration link to share your calculation
									</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					{#if error}
						<Alert.Root variant="destructive">
							<AlertCircle class="h-4 w-4" />
							<Alert.Description>{error}</Alert.Description>
						</Alert.Root>
					{/if}
				</div>
			{:else}
				<!-- Active Session -->
				<div class="space-y-4">
					{#if activeSession.isUpdate}
						<Alert.Root>
							<CheckCircle class="h-4 w-4" />
							<Alert.Description>
								Collaboration link updated with new calculator data and fresh access code!
							</Alert.Description>
						</Alert.Root>
					{:else}
						<Alert.Root>
							<CheckCircle class="h-4 w-4" />
							<Alert.Description>
								Collaboration link is active. Access code rotates every 30 minutes for security.
							</Alert.Description>
						</Alert.Root>
					{/if}

					<div class="space-y-3">
						<div>
							<label for="share-link" class="mb-2 block text-sm font-medium">Shareable Link:</label>
							<div class="flex space-x-2">
								<Input
									id="share-link"
									value={activeSession.shareableLink}
									readonly
									class="flex-1 font-mono text-sm"
								/>
								<Button
									variant="outline"
									size="sm"
									onclick={() =>
										activeSession && copyToClipboard(activeSession.shareableLink, 'link')}
									class="px-3"
								>
									{#if linkCopied}
										<CheckCircle class="h-4 w-4 text-green-600" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</Button>
							</div>
						</div>

						<div>
							<label for="otp-code" class="mb-2 block flex items-center gap-2 text-sm font-medium">
								<Key class="h-3 w-3" />
								Current Access Code
								<Badge variant="secondary" class="ml-auto flex items-center gap-1">
									<Clock class="h-3 w-3" />
									{formatTime(otpTimeRemaining)}
								</Badge>
							</label>
							<div class="flex space-x-2">
								<Input
									id="otp-code"
									value={activeSession.otpCode}
									readonly
									class="flex-1 text-center font-mono text-lg font-bold tracking-widest"
								/>
								<Button
									variant="outline"
									size="sm"
									onclick={() => activeSession && copyToClipboard(activeSession.otpCode, 'otp')}
									class="px-3"
								>
									{#if otpCopied}
										<CheckCircle class="h-4 w-4 text-green-600" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</Button>
							</div>
						</div>
					</div>

					<Card.Root>
						<Card.Content class="pt-4">
							<div class="space-y-2 text-sm text-muted-foreground">
								<div class="flex items-center gap-2">
									<Clock class="h-3 w-3" />
									<span>Created: {formatDateTime(activeSession.createdAt)}</span>
								</div>
								<p class="text-xs">
									Share the link and access code through different channels for security. The access
									code automatically rotates every 30 minutes.
								</p>
							</div>
						</Card.Content>
					</Card.Root>

					{#if error}
						<Alert.Root variant="destructive">
							<AlertCircle class="h-4 w-4" />
							<Alert.Description>{error}</Alert.Description>
						</Alert.Root>
					{/if}
				</div>
			{/if}
		</div>

		<Dialog.Footer class="flex justify-between">
			<Button variant="outline" onclick={handleClose}>Close</Button>
			<div class="flex gap-2">
				{#if activeSession}
					<Button
						variant="outline"
						onclick={createOrUpdateShare}
						disabled={isCreating}
						class="flex items-center gap-2"
					>
						{#if isCreating}
							<Share2 class="h-4 w-4 animate-spin" />
							Updating...
						{:else}
							<Share2 class="h-4 w-4" />
							Update & Rotate
						{/if}
					</Button>
					<Button
						variant="outline"
						onclick={deactivateSession}
						disabled={isDeactivating}
						class="flex items-center gap-2 text-red-600 hover:text-red-700"
					>
						{#if isDeactivating}
							<Trash2 class="h-4 w-4 animate-spin" />
							Deactivating...
						{:else}
							<Trash2 class="h-4 w-4" />
							Deactivate
						{/if}
					</Button>
				{:else}
					<Button
						onclick={createOrUpdateShare}
						disabled={isCreating}
						class="flex items-center gap-2"
					>
						{#if isCreating}
							<Share2 class="mr-2 h-4 w-4 animate-spin" />
							Creating link...
						{:else}
							<Share2 class="mr-2 h-4 w-4" />
							Create Collaboration Link
						{/if}
					</Button>
				{/if}
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
