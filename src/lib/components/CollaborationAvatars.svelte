<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { totalUsers, isInSession, currentUser } from '$lib/stores/collaboration';
	import { Wifi } from '@lucide/svelte';

	const visibleUsers = $derived($totalUsers.slice(0, 5));
	const overflowCount = $derived(Math.max(0, $totalUsers.length - 5));
</script>

{#if $isInSession && $totalUsers.length > 0}
	<div
		class="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80"
	>
		<div class="flex items-center -space-x-2">
			{#each visibleUsers as user (user.id)}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Avatar.Root
								class="relative h-8 w-8 border-2 border-white transition-transform hover:z-10 hover:scale-110 dark:border-gray-800"
								style="border-color: {user.color}20"
							>
								<Avatar.Fallback
									class="text-sm font-semibold text-white"
									style="background-color: {user.color}"
								>
									{user.avatar}
								</Avatar.Fallback>
							</Avatar.Root>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<div class="flex items-center gap-2">
								<div class="h-2 w-2 rounded-full" style="background-color: {user.color}"></div>
								{user.name}
								{#if $currentUser && user.id === $currentUser.id}
									<span class="text-xs opacity-70">(You)</span>
								{/if}
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{/each}

			{#if overflowCount > 0}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Avatar.Root class="h-8 w-8 border-2 border-white dark:border-gray-800">
								<Avatar.Fallback
									class="bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
								>
									+{overflowCount}
								</Avatar.Fallback>
							</Avatar.Root>
						</Tooltip.Trigger>
						<Tooltip.Content>
							{overflowCount} more collaborator{overflowCount > 1 ? 's' : ''}
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{/if}
		</div>

		<div class="flex items-center gap-1">
			<Wifi class="h-3 w-3 text-green-500" />
			<span class="text-xs font-medium text-gray-600 dark:text-gray-400">
				{$totalUsers.length} online
			</span>
		</div>
	</div>
{:else if $isInSession}
	<div
		class="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80"
	>
		<div class="flex items-center gap-2">
			<div class="h-6 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
			<span class="text-xs text-gray-600 dark:text-gray-400"> Connecting... </span>
		</div>
	</div>
{/if}

<style>
	:global(.avatar-stack .avatar:hover) {
		z-index: 10;
	}
</style>
