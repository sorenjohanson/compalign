<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { focusField, setTypingStatus, updateField } from '$lib/stores/collaboration';
	import { fieldFocuses } from '$lib/stores/collaboration';
	import { Input } from '$lib/components/ui/input';
	import type { CollaborationUser } from '$lib/collaboration-types';

	// Props
	export let fieldId: string;
	export let value: number | string = '';
	export let placeholder: string = '';
	export let min: string | undefined = undefined;
	export let max: string | undefined = undefined;
	export let step: string | undefined = undefined;
	export let disabled: boolean = false;

	// Focus ring styling
	$: focusedUser = $fieldFocuses[fieldId];
	$: hasFocus = !!focusedUser;
	$: focusRingColor = focusedUser?.color || '#3b82f6';

	const dispatch = createEventDispatcher<{
		change: { value: number | string };
		input: { value: number | string };
	}>();

	let inputElement: HTMLInputElement | null = null;
	let typingTimeout: ReturnType<typeof setTimeout>;

	// Handle focus events
	function handleFocus() {
		focusField(fieldId);
	}

	function handleBlur() {
		focusField(null);
		// Clear typing status when losing focus
		clearTimeout(typingTimeout);
		setTypingStatus(fieldId, false);
	}

	// Handle input events
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.type === 'number' ? parseFloat(target.value) || 0 : target.value;
		
		value = newValue;
		dispatch('input', { value: newValue });
		
		// Set typing status
		setTypingStatus(fieldId, true);
		
		// Clear typing status after 1 second of no input
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			setTypingStatus(fieldId, false);
		}, 1000);
	}

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.type === 'number' ? parseFloat(target.value) || 0 : target.value;
		
		// Send update to other collaborators
		updateField(fieldId, newValue);
		dispatch('change', { value: newValue });
		
		// Clear typing status
		clearTimeout(typingTimeout);
		setTypingStatus(fieldId, false);
	}

	onDestroy(() => {
		clearTimeout(typingTimeout);
	});
</script>

<div class="relative">
	<!-- Collaboration focus indicator -->
	{#if hasFocus}
		<div 
			class="absolute -inset-1 rounded-lg border-2 pointer-events-none z-10"
			style="border-color: {focusRingColor}"
		>
			<!-- User name label -->
			<div 
				class="absolute -top-6 left-0 px-2 py-1 text-xs font-medium text-white rounded-md shadow-sm whitespace-nowrap"
				style="background-color: {focusRingColor}"
			>
				{focusedUser.name} is editing
			</div>
		</div>
	{/if}
	
	<!-- Input field -->
	<Input
		ref={inputElement}
		{value}
		{placeholder}
		{min}
		{max}
		{step}
		{disabled}
		class="{hasFocus ? 'ring-0 border-transparent' : ''} {$$props.class || ''}"
		onfocus={handleFocus}
		onblur={handleBlur}
		oninput={handleInput}
		onchange={handleChange}
		{...$$restProps}
	/>
</div>