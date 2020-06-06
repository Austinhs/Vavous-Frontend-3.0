<template>
	<div class="pipeline">
		<DataTable model="person" view="something" :columns="headers" />
	</div>
</template>

<script>
	import DataTable from "../components/DataTable";
	import AddressHeaders from "../table_headers/Address";

	export default {
		name: "Pipeline",

		components: {
			DataTable
		},

		data() {
			return {
				headers: [
					{ title: "Suffix", dataIndex: "suffix" },
					{
						title: "First Name",
						dataIndex: "first_name",
						defaultSortOrder: "ascend"
					},
					{ title: "Middle Name", dataIndex: "middle_name" },
					{ title: "Last Name", dataIndex: "last_name" },
					{ title: "Phone", dataIndex: "phone" },
					{ title: "Email", dataIndex: "email" },
					{ title: "Company", dataIndex: "company.name" }
				].concat(AddressHeaders)
			};
		}
	};
</script>

<style lang="less">
</style>