<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		const script = document.createElement('script');
		script.src = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js';
		script.defer = true;
		script.onload = () => {
			// @ts-expect-error - Redoc is loaded globally
			Redoc.init(
				'/api/openapi.json',
				{
					hideSingleRequestSampleTab: true,
					theme: {
						colors: {
							primary: {
								main: '#1F2937'
							}
						},
						rightPanel: {
							backgroundColor: '#1F2937'
						},
						typography: {
							fontFamily: 'system-ui, -apple-system, sans-serif',
							headings: {
								fontFamily: 'system-ui, -apple-system, sans-serif'
							}
						}
					}
				},
				document.getElementById('redoc-container')
			);
		};
		document.body.appendChild(script);
	});
</script>

<svelte:head>
	<title>API Documentation</title>
</svelte:head>

<div id="redoc-container" class="h-screen"></div>
