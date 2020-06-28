<template>
	<div class="container">
		<a-breadcrumb>
			<a-breadcrumb-item v-for="(crumb, i) in breadcrumbs" :key="i">
				<a :href="crumb.path">
					{{crumb.name}}
				</a>
			</a-breadcrumb-item>
			<a-breadcrumb-item>
				{{current_route.name}}
			</a-breadcrumb-item>
		</a-breadcrumb>
	</div>
</template>

<script>
export default {
	data() {
		return {
			breadcrumbs: [],
			current_route: null
		};
	},

	created() {
		const current = this.$router.history.current;
		let routes = {};
		
		for(const route of this.$router.options.routes) {
			if(typeof routes[route.name] === "undefined") {
				routes[route.name] = route;
			} else {
				console.error("This route is defined more than once in the router file:" + route.name);
			}
		}
		
		if(typeof routes[current.name] !== "undefined") {
			const current_route = routes[current.name];

			for(const parent of current_route.parents) {
				const parent_route = routes[parent];
				
				this.breadcrumbs.push(parent_route);
			}

			this.current_route = current_route;
		}

	}
}
</script>

<style scoped>
	.container {
		margin-bottom: 1em;
	}
</style>