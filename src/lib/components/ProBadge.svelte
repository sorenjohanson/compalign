<script lang="ts">
	import { Lock } from '@lucide/svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	interface Props {
		size?: 'xs' | 'sm' | 'md';
		showText?: boolean;
		showUnlockText?: boolean;
		class?: string;
	}

	let { showText = true, showUnlockText = false, class: className = '' }: Props = $props();

	const iconSize = 'h-3 w-3';
	const textSize = 'text-xs';
</script>

<Badge
	variant="secondary"
	class="border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-300 {textSize} {className}"
>
	<Lock class="mr-1 {iconSize}" />
	{#if showUnlockText}
		<span class="xs:inline hidden">Unlock with </span>
	{/if}
	{#if showText}
		Pro
	{/if}
</Badge>
