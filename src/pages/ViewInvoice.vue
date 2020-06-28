<template>
	<div class="view-invoice-container">
		<PathBreadcrumbs />
		<div class="view-invoice">
			<h1>Line items</h1>
			<DataTable 
				model="invoice_line_item"
				parent_column="invoice_id"
				:parent_id="$route.params.id"
				:columns="columns.line_items"
			/>
		</div>
	</div>
</template>

<script>
import PathBreadcrumbs from '../components/PathBreadcrumbs';
import DataTable from '../components/DataTable';

export default {
	components: {
		PathBreadcrumbs,
		DataTable
	},

	data() {
		return {
			columns: {
				line_items: [
					{ title: "Name", dataIndex: "name" },
					{ title: "Description", dataIndex: "description" },
					{ title: "Price", dataIndex: "price", format: "money" }
				]
			}
		}
	},
}
</script>

<style>

</style>