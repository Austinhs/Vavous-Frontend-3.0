<template>
	<div class="input-setting-item">
		<div class="info">
			<div class="title">{{ title }}</div>
			<div class="description">{{ description }}</div>
		</div>
		<div class="value">
			<a-input class="input-setting" v-model="input_value" :loading="input_loading" @focusout="update" />
		</div>
	</div>
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

	.input-setting-item {
		display: flex;
		align-items: center;
		margin: 10px;
		padding: 10px;
		border-radius: 5px;
		background: #f0f2f5;
		border: 1px solid darkseagreen;

		.info {
			flex-grow: 1;
			padding: 15px;

			.title {
				font-weight: bolder;
				font-size: 1.3em;
			}

			.description {
				opacity: .75;
			}
		}

		.input-setting {
			width: 250px;
		}
	}
</style>