<script lang="ts">
	import { Calculator, Share2, Settings } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import CollaborationAvatars from '$lib/components/CollaborationAvatars.svelte';
	import { isCollaborationEnabled } from '$lib/feature-flags';
	import { isInSession } from '$lib/stores/collaboration';

	let { onShareOpen, onSettingsOpen } = $props();
</script>

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
		</div>
		<div class="flex flex-1 items-center justify-end gap-2">
			<DarkModeToggle />
			{#if isCollaborationEnabled()}
				<Button variant="outline" size="sm" onclick={onShareOpen} class="flex items-center gap-2">
					<Share2 class="h-4 w-4" />
					<span class="hidden sm:inline">Share</span>
				</Button>
			{/if}
			<Button variant="outline" size="sm" onclick={onSettingsOpen} class="flex items-center gap-2">
				<Settings class="h-4 w-4" />
				<span class="hidden sm:inline">Settings</span>
			</Button>
		</div>
	</div>
</div>
