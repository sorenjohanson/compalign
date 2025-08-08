<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { focusField, setTypingStatus, updateField } from '$lib/stores/collaboration';
	import { fieldFocuses } from '$lib/stores/collaboration';
	import { Input } from '$lib/components/ui/input';
	import type { CollaborationUser } from '$lib/collaboration-types';

	// Props
	export let fieldId: string;
	export let value: number = 0;
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
		change: { value: number };
		input: { value: number };
	}>();

	let inputElement: HTMLInputElement | null = null;
	let typingTimeout: ReturnType<typeof setTimeout>;
	let displayValue = '';
	let isExternalUpdate = false;

	// Format number for display
	function formatNumber(num: number): string {
		if (isNaN(num) || num === 0) return '';
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	}

	// Parse display value to number
	function parseDisplayValue(str: string): number {
		if (!str) return 0;
		const cleanStr = str.replace(/\./g, '');
		const parsed = parseFloat(cleanStr);
		return isNaN(parsed) ? 0 : parsed;
	}

	// Update display value when value prop changes (from external sources)
	$: if (!isExternalUpdate) {
		displayValue = formatNumber(value);
	}

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
		const rawValue = target.value;
		
		// Allow only digits and dots
		const cleanValue = rawValue.replace(/[^\d.]/g, '');
		
		// Parse to number for internal use
		const numericValue = parseDisplayValue(cleanValue);
		
		// Update values
		isExternalUpdate = true;
		value = numericValue;
		displayValue = cleanValue;
		isExternalUpdate = false;
		
		dispatch('input', { value: numericValue });
		
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
		const cleanValue = target.value.replace(/[^\d.]/g, '');
		const numericValue = parseDisplayValue(cleanValue);
		
		// Format the display value
		isExternalUpdate = true;
		displayValue = formatNumber(numericValue);
		value = numericValue;
		isExternalUpdate = false;
		
		// Send update to other collaborators
		updateField(fieldId, numericValue);
		dispatch('change', { value: numericValue });
		
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
		bind:value={displayValue}
		{placeholder}
		{min}
		{max}
		{step}
		{disabled}
		type="text"
		inputmode="numeric"
		class="{hasFocus ? 'ring-0 border-transparent' : ''} {$$props.class || ''}"
		onfocus={handleFocus}
		onblur={handleBlur}
		oninput={handleInput}
		onchange={handleChange}
		{...$$restProps}
	/>
</div>