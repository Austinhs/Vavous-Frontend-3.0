<template>
	<v-list-item :ripple="false">
		<v-list-item-content>
			<v-list-item-title>{{ title }}</v-list-item-title>
			<v-list-item-subtitle>{{ description }}</v-list-item-subtitle>
		</v-list-item-content>

		<v-list-item-action class="input-setting">
			<v-text-field v-model="input_value" :loading="input_loading" @focusout="update" />
		</v-list-item-action>
	</v-list-item>
</template>

<script>
	import axios from "axios";

	export default {
		name: "InputSetting",

		data() {
			return {
				input_id: null,
				input_value: "",
				input_loading: false
			};
		},

		props: {
			title: {
				required: true
			},
			field: {
				required: true
			},
			description: {
				default: ""
			}
		},

		created() {
			this.input_loading = true;

			axios
				.get(`/v1/crud/setting?filter[key]=${this.field}`)
				.then(response => {
					if (response.data.results.length > 0) {
						let setting = response.data.results.pop();

						this.input_value = setting.value;
						this.input_id = setting.id;
					}
				})
				.catch(error => {
					console.error(error);
					window.alert(error);
				})
				.finally(() => {
					this.input_loading = false;
				});
		},

		methods: {
			update() {
				this.input_loading = true;
				let upsert = {
					setting: {
						key: this.field,
						value: this.input_value
					}
				};

				if (this.input_id) {
					upsert.setting.id = this.input_id;
				}

				axios
					.post(`/v1/crud`, upsert)
					.then(response => {
						this.input_id = response.data.setting.id;
					})
					.catch(error => {
						console.error(error);
						window.alert(error);
					})
					.finally(() => {
						this.input_loading = false;
					});
			}
		}
	};
</script>

<style lang="less">
	.input-setting {
		width: 25vw;
	}
</style>