<template>
	<div class="switch-setting-item">
		<div class="info">
			<div class="title">{{ title }}</div>
			<div class="description">{{ description }}</div>
		</div>
		<div class="value">
			<a-switch :checked="switch_value" :loading="switch_loading" @click="toggle"/>
		</div>
	</div>
</template>

<script>
	import axios from "axios";
	export default {
		name: "SwitchSetting",
		data() {
			return {
				switch_id: null,
				switch_value: false,
				switch_loading: false
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
			this.switch_loading = true;

			axios
				.get(`/v1/crud/setting?filter[key]=${this.field}`)
				.then(response => {
					if (response.data.results.length > 0) {
						let switch_obj = response.data.results.pop();

						this.switch_value = switch_obj.value == "1" ? true : false;
						this.switch_id = switch_obj.id;
					}
				})
				.catch(error => {
					console.error(error);
					window.alert(error);
				})
				.finally(() => {
					this.switch_loading = false;
				});
		},

		methods: {
			toggle() {
				this.switch_value = !this.switch_value;
			}
		},

		watch: {
			switch_value(val) {
				this.switch_loading = true;
				let upsert = {
					setting: {
						key: this.field,
						value: val ? "1" : "0"
					}
				};

				// Exists and we need to update it
				if (this.switch_id) {
					upsert.setting.id = this.switch_id;
				}

				axios
					.post(`/v1/crud`, upsert)
					.then(response => {
						this.switch_id = response.data.setting.id;
					})
					.catch(error => {
						console.error(error);
						window.alert(error);
					})
					.finally(() => {
						this.switch_loading = false;
					});
			}
		}
	};
</script>

<style lang="less" scoped>
.switch-setting-item {
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
}

</style>
