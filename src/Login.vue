<template>
	<div>
		<form ref="form" @submit="login">
			<input ref="email" v-model="email" label="Email" />
			<input ref="password" type="password" v-model="password" label="Password" />
			<button type="submit">Login</button>
		</form>
	</div>
</template>

<script>
	import axios from "axios";

	export default {
		data() {
			return {
				email: "",
				password: "",
				loading: false,
				login_error: ""
			};
		},

		props: ["login_msg"],

		methods: {
			async login(e) {
				e.preventDefault();

				this.loading = true;

				let loginInfo = {
					email: this.email,
					password: this.password
				};

				await axios
					.post("/auth", loginInfo)
					.then(response => {
						let token = response.data.token;
						localStorage.setItem("jwt", token);
						this.$emit("logged_in", token);
					})
					.catch(err => {
						console.log(err.response);

						if (err.response) {
							this.login_error = err.response.data.message;
						} else {
							this.login_error = "Network error, Please try again later.";
						}
					})
					.finally(() => {
						this.loading = false;
					});
			}
		},

		mounted() {
			// if value exists create focus so the label does not overlap
			this.$refs.password.isFocused = true;
			this.$refs.email.isFocused = true;
		}
	};
</script>

<style scoped>
	.logo {
		width: 15%;
	}
</style>