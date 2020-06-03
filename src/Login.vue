<template>
	<div class="login">
		<img src="./assets/Design/Login/Green.png" class="design" />
		<form ref="form" @submit="login" class="login-form">
			<div class="welcome">Welcome to vavous</div>
			<div class="welcome-sub spacer">Please enter your login information to continue</div>

			<a-input
				ref="email"
				v-model="email"
				label="Email"
				class="email spacer"
				placeholder="test@test.com"
				size="large"
				:allowClear="true"
				@keyup.enter="login"
			>
				<a-icon slot="addonBefore" type="mail" />
			</a-input>

			<a-input
				ref="password"
				type="password"
				v-model="password"
				class="password spacer"
				label="Password"
				placeholder="*************"
				:allowClear="true"
				size="large"
				@keyup.enter="login"
			>
				<a-icon slot="addonBefore" type="lock" />
			</a-input>

			<div class="settings spacer">
				<a-checkbox v-model="remember">Remember me</a-checkbox>
				<a>Forgot Password?</a>
			</div>

			<a-button type="primary" size="large" :loading="loading" @click="login">Login</a-button>
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
				remember: false,
				loading: false,
				login_error: ""
			};
		},

		props: ["login_msg"],

		watch: {
			remember: function(val) {
				this.handleLoginMemory(val);
			}
		},

		methods: {
			async login(e) {
				e.preventDefault();

				this.handleLoginMemory(this.remember);

				this.loading = true;

				let loginInfo = {
					email: this.email,
					password: this.password
				};

				await axios
					.post("/auth", loginInfo)
					.then(response => {
						let token = response.data.token;
						this.cookieSet("jwt_token", token);
						this.$emit("logged_in", token);
					})
					.catch(err => {
						console.info(err.response);

						if (err.response) {
							this.login_error = err.response.data.message;
						} else {
							this.login_error = "Network error, Please try again later.";
						}
					})
					.finally(() => {
						this.loading = false;
					});
			},

			handleLoginMemory(val) {
				if (val) {
					this.remember_login();
				} else {
					this.clear_login_memory();
				}
			},

			remember_login() {
				this.cookieSet("email", this.email);
				this.cookieSet("password", this.password);
				this.cookieSet("remember", Boolean(this.remember));
			},

			clear_login_memory() {
				this.cookieSet("email", "");
				this.cookieSet("password", "");
				this.cookieSet("remember", false);
			},

			cookieSet(field, value) {
				this.$cookie.set(field, value, {
					expire: "2d",
					samesite: "strict"
				});
			}
		},

		created() {
			if (this.$cookie) {
				this.email = this.$cookie.get("email") ? this.$cookie.get("email") : "";
				this.password = this.$cookie.get("password")
					? this.$cookie.get("password")
					: "";
				this.remember =
					this.$cookie.get("remember") == "true"
						? Boolean(this.$cookie.get("remember"))
						: false;
			}
		}
	};
</script>

<style scoped>
	.login {
		display: flex;
		background: #fefefe;
	}

	.design {
		max-height: 100vh;
		max-width: 60vw;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		justify-content: center;
		flex-grow: 1;
		padding: 5vw;
		min-width: 40vw;
	}

	.welcome {
		display: flex;
		justify-content: center;
		font-size: 34px;
		text-align: left;
		font: Bold 34px/19px Montserrat;
		letter-spacing: 0.71px;
		color: #878787;
		opacity: 1;
	}

	.welcome-sub {
		display: flex;
		justify-content: center;
		font-size: 17px;
		font: Light 17px/19px Montserrat;
		letter-spacing: 0.36px;
		color: #bcbcbc;
		opacity: 1;
		margin-bottom: 15px;
		margin-top: 10px;
	}

	.spacer {
		margin-bottom: 15px;
	}

	.settings {
		display: flex;
		justify-content: space-between;
	}

	.settings a {
		color: blue;
	}

	.settings a:hover {
		color: black;
	}
</style>