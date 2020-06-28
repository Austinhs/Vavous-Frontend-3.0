<template>
	<div class="datatable-container">
		<div class="top-controls">
			<a-button icon="plus-circle" @click="onAdd" type="primary">Add</a-button>
		</div>

		<a-table
			:data-source="data"
			:columns="columns"
			:loading="loading"
			rowKey="id"
			size="middle"
			class="datatable"
			bordered
			:pagination="{ showQuickJumper: true }"
		>
			<template v-for="col in columns" :slot="col.dataIndex" slot-scope="text, record">
				<div :key="col.dataIndex">
					<template v-if="record.editable && (typeof col.write === 'undefined' || col.write)">
						<a-select
							v-if="col.options"
							:defaultValue="options[col.options.model][text]"
							show-search
							:placeholder="`Select a ${col.options.model}`"
							:record_id="record.id"
							option-filter-prop="children"
							style="width: 100%"
							:filter-option="filterOption"
							:dropdownMatchSelectWidth="false"
							@change="value => handleEditOptionChange(value, record, col)"
						>
							<a-select-option
								v-for="(option, i) in options[col.options.model]"
								:key="i"
								style="min-width: 120px"
								:value="i"	
							>{{ option }}</a-select-option>
						</a-select>

						<a-date-picker 
							v-else-if="(col.format == 'date')" 
							:defaultValue="formatDisplay(text, 'date')" 
							format="MM/DD/YYYY"
							@change="(date, dateString) => handleEditChange(dateString, record, col.dataIndex)"
						/>

						<a-input
							v-else
							style="margin: -5px 0"
							:value="text"
							@change="e => handleEditChange(e.target.value, record, col.dataIndex)"
						/>
					</template>

					<template v-else>
						<template v-if="typeof col.default !== 'undefined' && (text === '' || text === null)">
							{{ setDefault(col, record) }}
						</template>
						<template v-if="col.options">{{ options[col.options.model][text] }}</template>
						<template v-else-if="col.format">{{ formatDisplay(text, col.format) }} </template>
						<template v-else>{{ text }}</template>
					</template>
				</div>
			</template>

			<!-- Controllers (save,delete,view,edit) -->
			<template slot="controls" slot-scope="text, record">
				<a-popconfirm
					v-if="can_delete"
					title="Are you sure?"
					@confirm="() => onDelete(record) "
					ok-text="Delete"
					ok-type="danger"
				>
					<a-icon slot="icon" type="delete" theme="twoTone" two-tone-color="crimson" />

					<a-icon
						class="control_icon"
						style="margin-right: 10px;"
						type="delete"
						theme="twoTone"
						two-tone-color="crimson"
					/>
				</a-popconfirm>

				<a-icon
					v-if="canSave(record)"
					class="control_icon"
					type="save"
					@click="() => onSave(record)"
					style="color: green"
				/>

				<a-popconfirm
					v-if="canSave(record) && !record.datatable_add"
					@confirm="() => cancelSave(record)"
					title="Are you sure? This will revert edited data"
				>
					<a-icon class="control_icon" type="close-circle" />
				</a-popconfirm>

				<span v-else-if="!record.datatable_add">
					<a-icon v-if="can_edit" class="control_icon" type="edit" @click="() => onEdit(record)" />
					<a-icon v-if="view != ''" class="control_icon" type="eye" style="color: green" @click="() => onView(record)" />
				</span>
			</template>

			<!-- The dropdown shown when you click the search icon -->
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

			<!-- The search icon are we using -->
			<a-icon
				slot="filterIcon"
				slot-scope="filtered"
				type="search"
				:style="{ color: filtered ? 'white' : undefined, background: filtered ? '#62c300' : undefined }"
			/>
		</a-table>
	</div>
</template>

<script>
	import axios from "axios";
	import moment from "moment";

	export default {
		name: "DataTable",
		data() {
			return {
				// Table
				data: [],
				loading: false,
				expand: [],
				options: {},
				required_columns: [],

				// Search
				searchText: "",
				searchInput: null,
				searchedColumn: "",

				// Add
				add_counter: 0,

				// Edit
				editCacheData: {},

				// Save
				post_url: `/v1/crud`
			};
		},

		props: {
			// Backend model
			model: {
				required: true
			},

			parent_column: {
				required: false
			},

			parent_id: {
				required: false
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

		async created() {
			this.loading = true;

			await this.tableSetup();
			await this.getModelData();

			this.loading = false;
		},

		methods: {
			setDefault(column, record) {
				if(typeof column.default === "undefined") {
					return;
				}

				const newData = [...this.data];
				let target = newData.filter(item => record.id === item.id)[0];

				if (target) {
					target = this.assignValueByString(target, column.dataIndex, column.default);
					this.data = newData;
				}
				
				return column.default;
			},

			formatDisplay(value, format) {
				let display = value;
				
				if(format === "money") {
					const formatter = new Intl.NumberFormat('en-US', {
						style: 'currency',
						currency: 'USD',
					});

					display = formatter.format(value);
				}

				if(format === "date") {
					const date = moment(value);

					if(date.isValid()) {
						display = date.format('MM/DD/YYYY');
					} else {
						display = null;
					}
				}

				if(typeof format === "function") {
					display = format(value);
				}

				return display;
			},

			handleEditChange(value, key, column) {
				const newData = [...this.data];
				let target = newData.filter(item => key.id === item.id)[0];

				if (target) {
					target = this.assignValueByString(target, column, value);
					this.data = newData;
				}
			},

			handleEditOptionChange(value, record, col) {
				const newData = [...this.data];
				let target = newData.filter(item => record.id === item.id)[0];

				if (target) {
					target = this.assignValueByString(target, col.dataIndex, value);
					this.data = newData;
				}
			},

			onDelete(record) {
				const data = [...this.data];
				this.data = data.filter(item => item.id !== record.id);

				if (!record.datatable_add) {
					axios.delete(`/v1/crud/${this.model}/${record.id}`);
				}
			},

			onView(record) {
				this.$router.push(`${this.view}/${record.id}`);
			},

			onEdit(record) {
				const data = [...this.data];
				const target = data.filter(item => item.id === record.id)[0];

				if (target) {
					target.editable = true;

					this.editCacheData[record.id] = Object.assign({}, target);
					this.data = data;
				}
			},

			onAdd() {
				const add_key = `datatable_add_${this.add_counter}`;

				this.add_counter++;

				let template = {
					key: add_key,
					id: add_key,
					datatable_add: true,
					editable: true
				};

				this.editingKey = add_key;

				for (const index in this.columns) {
					const column = this.columns[index];
					const column_key = column.key;

					if (column_key == "datatable_controls") {
						continue;
					}

					const split = column_key.split(".");
					const last_key = split.pop();

					let ref = template;

					for (const key of split) {
						if (!ref[key] || !(ref[key] instanceof Object)) {
							ref[key] = {};
						}

						ref = ref[key];
					}

					ref[last_key] = null;
				}

				this.data.unshift(template);
			},

			async onSave(record) {
				this.loading = true;

				const required_errors = [];
				for(const column of this.required_columns) {
					const column_value = this.getValueByString(record, column.dataIndex);
					
					if(column_value == null || column_value.trim() == "") {
						required_errors.push(`"${column.title}" is a required field`);
					}
				}

				if(required_errors.length) {
					window.alert(required_errors.join('\n') + '\n\n Due to these errors, the row was not saved.');
					this.loading = false;
					return;
				}

				const data = [...this.data];
				const target = data.filter(item => item.id === record.id)[0];
				const post = {};
				post[this.model] = Object.assign({}, target);

				// Remove fields not used in CRUD
				if (post[this.model].id.toString().includes("datatable_add")) {
					delete post[this.model].id;
					delete post[this.model].datatable_add;
					delete target.datatable_add;
				}

				delete post[this.model].editable;
				delete post[this.model].key;

				if(typeof this.parent_column !== "undefined" && typeof this.parent_id !== "undefined") {
					post[this.model] = this.assignValueByString(post[this.model], this.parent_column, this.parent_id);
				}

				await axios
					.post(this.post_url, post)
					.then(response => {
						target.id = response.data[this.model].id;
						target.key = response.data[this.model].id;
					})
					.catch(error => {
						console.error(error);
						window.alert(error.message);
					})
					.finally(() => {
						delete target.editable;
						this.loading = false;
					});
			},

			canSave(record) {
				return record.datatable_add == true || record.editable;
			},

			cancelSave(record) {
				if (typeof record.datatable_add != "undefined") {
					return this.onDelete(record);
				}

				const newData = [...this.data];
				const target = newData.filter(item => record.id === item.id)[0];

				if (target) {
					Object.assign(target, this.editCacheData[record.id]);

					delete target.editable;
					this.data = newData;
				}
			},

			getValueByString(target, string) {
				target = target && target instanceof Object ? target : {};

				const keys = string.split(".");
				const last_key = keys.pop();

				let ref = target;

				for (const key of keys) {
					if (!ref[key] || !(ref[key] instanceof Object)) {
						ref[key] = {};
					}

					ref = ref[key];
				}

				return ref[last_key];
			},

			assignValueByString(target, string, value) {
				target = target && target instanceof Object ? target : {};

				const keys = string.split(".");
				const last_key = keys.pop();

				let ref = target;

				for (const key of keys) {
					if (!ref[key] || !(ref[key] instanceof Object)) {
						ref[key] = {};
					}

					ref = ref[key];
				}

				ref[last_key] = value;

				return target;
			},

			async tableSetup() {
				let has_controls = false;

				for (let column of this.columns) {
					if (column.key === "datatable_controls") {
						has_controls = true;
						continue;
					}

					if (
						typeof column.dataIndex === "undefined" ||
						column.dataIndex === null
					) {
						window.alert("All columns must have a defined dataIndex");
					}

					if(typeof column.required !== "undefined" && column.required) {
						this.required_columns.push(column);
					}

					if (typeof column.options !== "undefined") {
						await this.setupTableOptions(column.options);
					}

					if (typeof column.scopedSlots === "undefined") {
						column.scopedSlots = {};
					}

					if (typeof column.scopedSlots.customRender === "undefined") {
						column.scopedSlots.customRender = column.dataIndex;
					}

					// Setup default functionality like sorting/searching
					if (this.searchColumn) {
						column.scopedSlots.filterDropdown = "filterDropdown";
						column.scopedSlots.filterIcon = "filterIcon";
					}

					if (typeof column.key == "undefined") {
						column.key = column.dataIndex;
					}

					if (typeof column.sorter == "undefined") {
						column.sorter = (a, b) => {
							let col_a = this.getValueByString(a, column.dataIndex);
							let col_b = this.getValueByString(b, column.dataIndex);

							console.log(column);

							if (typeof col_b === "undefined" || col_b == null || col_b == "") {
								return -1;
							}

							if(typeof col_a === "undefined" || col_a == null || col_a == "") {
								return -1;
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
							if (!this.searchedColumn) {
								return;
							}

							if (record.datatable_add || record.editable) {
								return false;
							}

							try {
								let obj = this.getValueByString(record, this.searchedColumn);

								return (
									obj.toLowerCase().includes(value.toLowerCase()) ||
									obj === null ||
									obj === "" ||
									obj === value
								);
							} catch (e) {
								console.info(
									`Failed to find any realted data: record.${this.searchedColumn}`
								);
								console.error(e);
							}
						};
					}

					if (typeof column.onFilterDropdownVisibleChange == "undefined") {
						column.onFilterDropdownVisibleChange = visible => {
							if (visible) {
								setTimeout(() => {
									if (this.searchInput !== null) {
										this.searchInput.focus();
									}
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
						key: "datatable_controls",
						width: 100,
						dataIndex: "datatable_controls",
						scopedSlots: { customRender: "controls" }
					});
				}
			},

			async setupTableOptions(option_def) {
				if (!this.options[option_def.model]) {
					this.options[option_def.model] = {};
					const options = this.options[option_def.model];

					if(!Array.isArray(option_def.column)) {
						option_def.column = [option_def.column];
					}

					let option_join = ' ';

					if(typeof option_def.column_join !== "undefined") {
						option_join = option_def.column_join;
					}

					await axios
						.get(`/v1/crud/${option_def.model}`)
						.then(response => {
							for (const option of response.data.results) {
								let option_text = [];
								for (const column of option_def.column) {
									option_text.push(option[column]);
								}

								options[option.id] = option_text.join(option_join);
							}
						})
						.catch(err => {
							let indexes = [];
							for (const column of option_def.column) {
								indexes.push(column);
							}

							console.error(err);

							window.alert(
								`Failed to load options for model: ${option_def.model} \n index(s): ${indexes.join(',')}`
							);
						});
				}
			},

			filterOption(input, option) {
				return (
					option.componentOptions.children[0].text
						.toLowerCase()
						.indexOf(input.toLowerCase()) >= 0
				);
			},

			handleSearch(selectedKeys, confirm, dataIndex) {
				this.searchedColumn = dataIndex;
				confirm();
				this.searchText = selectedKeys[0];
			},

			handleReset(clearFilters) {
				clearFilters();
				this.searchText = "";
			},

			getModelData() {
				let query_params = [];

				if (this.expand.length > 0) {
					query_params.push("expand=" + this.expand.join(","));
				}

				// If we are using a parent table, we should only load the children for that parent in this model
				if (typeof this.parent_column !== "undefined" && typeof this.parent_id !== "undefined") {
					this.where.push({
						column: this.parent_column,
						value: this.parent_id
					});
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
					});
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

	.control_icon:not(.anticon-delete) {
		margin-left: 10px;
	}

	.control_icon {
		cursor: pointer;
	}

	.top-controls {
		margin: 10px;
	}
</style>