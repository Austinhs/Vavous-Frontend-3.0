<template>
	<a-layout class="layout">
		<a-layout-header class="header" v-if="logged_in">
			<router-link to="/">
				<img class="logo" src="./assets/logo.png" />
			</router-link>

			<a-menu mode="horizontal">
				<router-link
					tag="li"
					class="ant-menu-item"
					v-for="(route, index) in routes"
					:key="index"
					:to="route.path"
				>
					<a-icon :type="route.icon" theme="twoTone" twoToneColor="#62c300" />
					{{ route.name }}
				</router-link>

				<a-menu-item ref="logoutBtn" @click="logout">
					<a-icon type="api" theme="twoTone" twoToneColor="#62c300" :key=" routes.length + 1" />Logout
				</a-menu-item>
			</a-menu>
		</a-layout-header>

		<a-layout-content class="content" v-if="logged_in">
			<transition name="bounce" mode="out-in">
				<router-view class="page" :style="{ background: '#fff', padding: '24px', minHeight: '280px' }" />
			</transition>
		</a-layout-content>

		<div class="login-container" v-else>
			<Login @logged_in="initJWT" :login_msg="login_msg" />
		</div>

		<a-layout-footer v-if="logged_in" class="footer">
			<a-icon type="copyright"></a-icon>Vavous @2020
		</a-layout-footer>
	</a-layout>
</template>

<script>
	import axios from "axios";
	import Login from "./Login";
	import jwt from "jsonwebtoken";

	export default {
		name: "App",

		components: {
			Login
		},

		data() {
			return {
				logged_in: false,
				login_msg: "",
				routes: []
			};
		},

		created() {
			this.initJWT();

			this.routes = this.$router.options.routes;

			axios.interceptors.response.use(
				response => Promise.resolve(response),
				error => {
					if (error.response.status == 401) {
						this.logged_in = false;
						this.login_msg = "Your session has expired, please login.";
					}

					return Promise.reject(error);
				}
			);
		},

		methods: {
			logout() {
				let confirm = window.confirm("Are you sure you want to logout?");

				if (confirm) {
					this.clearJWT();
				} else {
					setTimeout(function() {
						document
							.querySelector(".ant-menu-item-selected")
							.classList.remove("ant-menu-item-selected");
					}, 50);
				}
			},

			clearJWT() {
				this.$cookie.set("jwt_token", "");
				this.logged_in = false;
			},

			initJWT(token = null) {
				if (token == null) {
					token = this.$cookie.get("jwt_token");
				}

				if (token) {
					axios.defaults.headers.common["Authorization"] = "Bearer " + token;

					if (token != null && token != "") {
						token = jwt.decode(token, { json: true });
						this.logged_in = Date.now() <= token.exp * 1000;
					} else {
						this.logged_in = false;
					}
				} else {
					delete axios.defaults.headers.common["Authorization"];
				}
			}
		}
	};
</script>

<style scoped>
	@import url("https://fonts.googleapis.com/css?family=Montserrat");

	.bounce-enter-active {
		animation: bounce-in 0.5s;
	}

	.bounce-leave-active {
		animation: bounce-in 0.5s reverse;
	}

	@keyframes bounce-in {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}

	.layout {
		min-height: 100%;
	}

	.footer {
		font-weight: bolder;
		text-align: center;
		letter-spacing: 2px;
	}

	.footer i {
		padding-right: 10px;
	}

	.ant-menu .router-link-exact-active {
		color: black !important;
		border-bottom: 2px solid black !important;
	}

	.ant-menu {
		line-height: 63px;
		border: none;
	}

	.header {
		display: inherit;
		background: white;
		font-weight: bolder;
		padding: 0 50px;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;

		/* Sticky Header */
		position: fixed;
		z-index: 1;
		width: 100%;
		box-shadow: 16px 0px 8px;
	}

	.content {
		margin: 79px 15px 15px 15px;
	}

	.login-container {
		display: flex;
		width: 100%;
		flex-grow: 1;
		background: none;
	}

	.logo {
		height: 40px;
	}
</style>
