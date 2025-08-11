<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { AlertCircle, Home } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { open = $bindable(false) } = $props();

	function handleGoHome() {
		open = false;
		goto('/');
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<AlertCircle class="h-5 w-5 text-destructive" />
				Session Terminated
			</Dialog.Title>
			<Dialog.Description>
				The CompAlign session has been terminated by the host.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<Alert.Root variant="destructive">
				<AlertCircle class="h-4 w-4" />
				<Alert.Title>Session Ended</Alert.Title>
				<Alert.Description>
					You have been disconnected from the shared session. The host has terminated the collaboration.
				</Alert.Description>
			</Alert.Root>

			<div class="flex justify-end space-x-2">
				<Button onclick={handleGoHome} class="flex items-center gap-2">
					<Home class="h-4 w-4" />
					Return Home
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>