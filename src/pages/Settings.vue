<template>
  <div>
	<a-tabs
		default-active-key="general"
		tab-position="left"
		type="card"
	>
		<a-tab-pane key="general" tab="General">
			<a-tabs tab-position="top" default-active-key="globals">
				<a-tab-pane key="globals" tab="Globals">
					<InputSetting 
						title="Company name" 
						field="company_name" 
						description="Your company name, we will use this to fill in places throughout the site with your company name."
					/>

					<InputSetting
						title="Company Address"
						field="company_address"
						description="Your companies address, we will use this to fill in places throughout the site with your company address."
					/>
				</a-tab-pane>

				<a-tab-pane key="persons" tab="People">
					<DataTable model="person" :columns="columns.persons" />
				</a-tab-pane>

				<a-tab-pane key="companies" tab="Companies">
					<DataTable model="company" :columns="columns.companies" />
				</a-tab-pane>
			</a-tabs>
		</a-tab-pane>

		<a-tab-pane key="invoice" tab="Invoice">
			<a-tabs tab-position="top" default-active-key="globals">
				<a-tab-pane key="globals" tab="Globals">
					<InputSetting 
						title="Thank you message"
						field="invoice::thank_you"
						description="A thank you message we will use on every invoice."
					/>

					<SwitchSetting
						title="Show your company address"
						field="invoice::show_company_address"
						description="Do you want your company address to show on invoices."
					/>
				</a-tab-pane>

				<a-tab-pane key="services" tab="Services">
					<DataTable model="service" :columns="columns.services" />
				</a-tab-pane>

				<a-tab-pane key="service_terms" tab="Service Terms">
					<DataTable model="service_term" :columns="columns.service_terms" />
				</a-tab-pane>
			</a-tabs>
		</a-tab-pane>
		
	</a-tabs>
  </div>
</template>

<script>
import DataTable from '../components/DataTable';
import AddressHeaders from "../table_headers/Address";
import SwitchSetting from '../components/Settings/SwitchSetting';
import InputSetting from '../components/Settings/InputSetting';

export default {
	components: {
		DataTable,
		SwitchSetting,
		InputSetting
	},

	data() {
		return {
			columns: {
				service_terms: [
					{ title: "Service", dataIndex: "service_id", options: {
						model: "service",
						column: "name"
					}, required: true },
					{ title: "Company", dataIndex: "company_id", options: {
						model: "company",
						column: "name"
					}},
					{ title: "Person", dataIndex: "person_id", options: {
						model: "person",
						column: ["first_name", "last_name"]
					}},
					{ title: "Price", dataIndex: "price", format: "money", required: true },
					{ title: "Expires", dataIndex: "expired_at", format: 'date' }
				],

				companies: [
					{ title: "Name", dataIndex: "name" },
					{ title: "Phone Number", dataIndex: "phone" },
					{ title: "Website", dataIndex: "website" }
				].concat(AddressHeaders),

				persons: [
					{ title: "Suffix", dataIndex: "suffix" },
					{ title: "First Name", dataIndex: "first_name" },
					{ title: "Middle Name", dataIndex: "middle_name" },
					{ title: "Last Name", dataIndex: "last_name" },
					{ title: "Phone", dataIndex: "phone", required: true },
					{ title: "Email", dataIndex: "email" },
					{
						title: "Company",
						dataIndex: "company_id",
						options: {
							model: "company",
							column: "name"
						}
					}
				].concat(AddressHeaders),

				services: [
					{ title: "Service", dataIndex: "name" },
					{ title: "Description", dataIndex: "description" },
					{ title: "Default Price", dataIndex: "default_price", format: "money" }
				]
			},

			mode: 'left'
		}
	}
}

</script>

<style scoped>

</style>