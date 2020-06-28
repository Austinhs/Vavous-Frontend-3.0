<template>
	<div>
		<DataTable model="invoice" :columns="columns.invoices" view="view_invoice" />
	</div>
</template>

<script>
	import DataTable from '../components/DataTable';
	import moment from 'moment';

	export default {
		components: {
			DataTable
		},

		data() {
			return {
				columns: {
					invoices: [
						{ title: "Invoice #", dataIndex: "id", defaultSortOrder: "descend"},
						{ title: "Company", dataIndex: "company_id", options: {
							model: "company",
							column: "name"
						}},
						{ title: "Person", dataIndex: "person_id", options: {
							model: "person",
							column: ["first_name", "last_name"]
						}},
						{ title: "Invoiced", dataIndex: "invoiced_at", format: "date", write: false, default: moment().format('MM/DD/YYYY') },
						{ title: "Due", dataIndex: "due_at", format: "date", required: true },
						{ title: "Paid", dataIndex: "paid_at", format: "date" }
					]
				}
			}
		}
	};
</script>

<style>
</style>