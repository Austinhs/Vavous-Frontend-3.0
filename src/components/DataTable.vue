<template>
	<div class="datatable-container">
		<div class="top-controls">
			<a-button icon="plus-circle">Add</a-button>
		</div>

		<a-table
			:data-source="data"
			:columns="columns"
			:loading="loading"
			rowKey="id"
			size="middle"
			class="datatable"
			:pagination="{ showQuickJumper: true }"
		>
			<template slot="controls" slot-scope="text, record">
				<a-popconfirm v-if="can_delete" title="Are you sure?" @confirm="() => onDelete(record.id)">
					<a-icon
						class="control_icon"
						style="margin-right: 10px;"
						type="delete"
						theme="twoTone"
						two-tone-color="crimson"
					/>
				</a-popconfirm>

				<a-icon v-if="can_edit" class="control_icon" type="edit" />
				<a-icon v-if="view != ''" class="control_icon" type="eye" style="color: green" />
			</template>

			<div
				slot="filterDropdown"
				slot-scope="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }"
				style="padding: 8px"
			>
				<a-input
					v-ant-ref="c => (searchInput = c)"
					:placeholder="`Search ${column.dataIndex}`"
					:value="selectedKeys[0]"
					style="width: 188px; margin-bottom: 8px; display: block;"
					@change="e => setSelectedKeys(e.target.value ? [e.target.value] : [])"
					@pressEnter="() => handleSearch(selectedKeys, confirm, column.dataIndex)"
				/>
				<a-button
					type="primary"
					icon="search"
					size="small"
					style="width: 90px; margin-right: 8px"
					@click="() => handleSearch(selectedKeys, confirm, column.dataIndex)"
				>Search</a-button>
				<a-button size="small" style="width: 90px" @click="() => handleReset(clearFilters)">Reset</a-button>
			</div>

			<a-icon
				slot="filterIcon"
				slot-scope="filtered"
				type="search"
				:style="{ color: filtered ? '#108ee9' : undefined}"
			/>

			<template slot="customRender" slot-scope="text, record, index, column">
				<span v-if="searchText && searchedColumn === column.dataIndex">
					<template v-for="(fragment, i) in text">
						<mark
							v-if="fragment.toLowerCase() === searchText.toLowerCase()"
							:key="i"
							class="highlight"
						>{{ fragment }}</mark>
						<template v-else>{{ fragment }}</template>
					</template>
				</span>
				<template v-else>{{ text }}</template>
			</template>
		</a-table>
	</div>
</template>

<script>
	import axios from "axios";

	export default {
		name: "DataTable",
		data() {
			return {
				data: [],
				loading: false,
				expand: [],

				// Search
				searchText: "",
				searchInput: null,
				searchedColumn: ""
			};
		},

		props: {
			// Backend model
			model: {
				required: true
			},

			model_txt: {
				// Default to the model but allow model_txt to be set as an attribute
				default: function() {
					return this.model;
				}
			},

			columns: {
				required: true
			},

			searchColumn: {
				default: true
			},

			can_delete: {
				default: true
			},

			can_edit: {
				default: true
			},

			view: {
				default: ""
			},

			/**
			 * Example: [
			 *  { column: 'wesbite', value: 'harvey.net },
			 *  { column: 'name', value: 'Howe Group' }
			 * ]
			 */
			where: {
				default: function() {
					return [];
				}
			}
		},

		created() {
			this.tableSetup();
			this.getModelData();
		},

		methods: {
			onDelete(id) {
				const data = [...this.data];
				this.data = data.filter(item => item.id !== id);
			},

			tableSetup() {
				let has_controls = false;

				for (let column of this.columns) {
					if (column.keys === "datatable_controls") {
						has_controls = true;
						continue;
					}

					if (
						typeof column.dataIndex === "undefined" ||
						column.dataIndex === null
					) {
						window.alert("All columns must have a defined dataIndex");
					}

					// Setup default functionality like sorting/searching
					if (this.searchColumn) {
						if (typeof column.scopedSlots === "undefined") {
							column.scopedSlots = {};
						}

						column.scopedSlots.filterDropdown = "filterDropdown";
						column.scopedSlots.filterIcon = "filterIcon";
					}

					if (typeof column.key == "undefined") {
						column.key = column.dataIndex;
					}

					if (typeof column.sorter == "undefined") {
						column.sorter = (a, b) => {
							let col_a = a;
							let col_b = b;

							try {
								col_a = eval(`a.${column.dataIndex}`);
								col_b = eval(`b.${column.dataIndex}`);
							} catch (e) {
								return 0;
							}

							if (col_a < col_b) {
								return -1;
							}

							if (col_a > col_b) {
								return 1;
							}

							return 0;
						};
					}

					if (typeof column.filterMultiple == "undefined") {
						column.filterMultiple = true;
					}

					if (typeof column.ellipsis == "undefined") {
						column.ellipsis = true;
					}

					if (typeof column.onFilter == "undefined") {
						column.onFilter = (value, record) => {
							record;
							let eval_str = `record.${this.searchedColumn}`;

							try {
								let obj = eval(eval_str);
								return obj
									.toString()
									.toLowerCase()
									.includes(value.toLowerCase());
							} catch (e) {
								console.info("Failed to find any realted data: " + eval_str);
							}
						};
					}

					if (typeof column.onFilterDropdownVisibleChange == "undefined") {
						column.onFilterDropdownVisibleChange = visible => {
							if (visible) {
								setTimeout(() => {
									this.searchInput.focus();
								}, 0);
							}
						};
					}

					let keys = column.dataIndex.split(".");

					if (keys.length > 1) {
						// Remove target
						keys.pop();

						for (let key of keys) {
							if (!this.expand.includes(key)) {
								this.expand.push(key);
							}
						}
					}
				}

				if (!has_controls) {
					this.columns.unshift({
						title: "Controls",
						keys: "datatable_controls",
						scopedSlots: { customRender: "controls" }
					});
				}
			},

			handleSearch(selectedKeys, confirm, dataIndex) {
				confirm();
				this.searchText = selectedKeys[0];
				this.searchedColumn = dataIndex;
			},

			handleReset(clearFilters) {
				clearFilters();
				this.searchText = "";
			},

			getModelData() {
				this.loading = true;

				let query_params = [];

				if (this.expand.length > 0) {
					query_params.push("expand=" + this.expand.join(","));
				}

				if (this.where.length > 0) {
					this.where.forEach(filter_item => {
						query_params.push(
							`filter[${filter_item.column}]=${filter_item.value}`
						);
					});
				}

				if (query_params.length > 0) {
					query_params = "?" + query_params.join("&");
				}

				axios
					.get(`/v1/crud/${this.model}${query_params}`)
					.then(response => {
						this.data = response.data.results;
					})
					.catch(err => {
						console.error(err);
						window.alert("Failed to load table for model: " + this.model);
					})
					.finally(() => {
						this.loading = false;
					});
			},

			remove_item(item) {
				const index = this.items.indexOf(item);

				if (confirm("Are you sure you want to delete this item?")) {
					axios.delete(`/v1/crud/${this.model}/${item.id}`);

					console.log(item);

					this.items.splice(index, 1);
				}
			},

			edit_dialog(item) {
				let edit_model = {};

				this.source_headers.forEach(header => {
					if (!header.disabled) {
						let keys = header.value.split(".");

						if (keys.length > 1) {
							let lookup_value = Object.assign({}, item);
							keys.forEach(index => {
								if (lookup_value[index]) {
									lookup_value = lookup_value[index];
								}
							});

							edit_model[header.value] = lookup_value;
						} else {
							edit_model[header.value] = item[header.value];
						}
					}
				});

				edit_model.id = item.id;

				/**
				 * Get the id's for expanded fields (You wont get the id's off the headers of the table)
				 * @TODO Add onto this functionality to go more than 1 level deep
				 */
				if (this.expand) {
					this.expand.forEach(key => {
						edit_model[`${key}.id`] = item[key].id;
					});
				}

				this.index = this.items.indexOf(item);
				this.edit_model = edit_model;
				this.dialog = true;
			},

			close_dialog() {
				this.dialog = false;
				this.$nextTick(() => {
					this.edit_model = Object.assign({}, this.default_model);
					this.index = -1;
				});
			},

			assignEditValues(target, ...value_maps) {
				target = target && target instanceof Object ? target : {};

				for (const map of value_maps) {
					for (let field in map) {
						const keys = field.split(".");
						const last_key = keys.pop();

						let ref = target;

						for (const key of keys) {
							if (!ref[key] || !(ref[key] instanceof Object)) {
								ref[key] = {};
							}

							ref = ref[key];
						}

						ref[last_key] = map[field];
					}
				}

				return target;
			},

			async save() {
				let post = {};
				let post_url = `/v1/crud`;
				let crud = this.assignEditValues({}, this.edit_model);

				post[this.model] = crud;

				if (this.index > -1) {
					await axios
						.post(post_url, post)
						.then(() => {
							Object.assign(this.items[this.index], crud);
						})
						.catch(error => {
							console.error(error);
							window.alert(error.message);
						});
				} else {
					await axios
						.post(post_url, post)
						.then(response => {
							crud.id = response.data[this.model].id;

							this.items.push(crud);
						})
						.catch(error => {
							console.error(error);
							window.alert(error.message);
						});
				}

				this.close_dialog();
			}
		}
	};
</script>

<style lang="less" scoped>
	.highlight {
		background-color: rgb(255, 192, 105);
		padding: 0px;
	}

	.ant-table-thead > tr > th .anticon-filter,
	.ant-table-thead > tr > th .ant-table-filter-icon {
		display: inline;
	}

	.ant-dropdown-trigger svg {
		color: black;
	}
</style>

<style>
	.ant-table-middle
		> .ant-table-content
		> .ant-table-header
		> table
		> .ant-table-thead
		> tr
		> th,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-body
		> table
		> .ant-table-thead
		> tr
		> th,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-scroll
		> .ant-table-header
		> table
		> .ant-table-thead
		> tr
		> th,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-scroll
		> .ant-table-body
		> table
		> .ant-table-thead
		> tr
		> th,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-fixed-left
		> .ant-table-header
		> table
		> .ant-table-thead
		> tr
		> th,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-fixed-right
		> .ant-table-header
		> table
		> .ant-table-thead
		> tr
		> th,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-fixed-left
		> .ant-table-body-outer
		> .ant-table-body-inner
		> table
		> .ant-table-thead
		> tr
		> th,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-fixed-right
		> .ant-table-body-outer
		> .ant-table-body-inner
		> table
		> .ant-table-thead
		> tr
		> th,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-header
		> table
		> .ant-table-tbody
		> tr
		> td,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-body
		> table
		> .ant-table-tbody
		> tr
		> td,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-scroll
		> .ant-table-header
		> table
		> .ant-table-tbody
		> tr
		> td,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-scroll
		> .ant-table-body
		> table
		> .ant-table-tbody
		> tr
		> td,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-fixed-left
		> .ant-table-header
		> table
		> .ant-table-tbody
		> tr
		> td,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-fixed-right
		> .ant-table-header
		> table
		> .ant-table-tbody
		> tr
		> td,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-fixed-left
		> .ant-table-body-outer
		> .ant-table-body-inner
		> table
		> .ant-table-tbody
		> tr
		> td,
	.ant-table-middle
		> .ant-table-content
		> .ant-table-fixed-right
		> .ant-table-body-outer
		> .ant-table-body-inner
		> table
		> .ant-table-tbody
		> tr
		> td {
		min-width: 50px;
	}

	.control_icon {
		margin-left: 10px;
		cursor: pointer;
	}

	.top-controls {
		margin: 10px;
	}
</style>