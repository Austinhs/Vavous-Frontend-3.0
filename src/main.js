import Vue from 'vue';
import router from './router';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.less';
import App from './App.vue';
import axios from 'axios';

axios.defaults.baseURL = 'http://api.vavous.com';
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
axios.defaults.headers.common['Access-Control-Allow-Headers'] = 'Content-type,Accept,X-Access-Token,X-Key';


Vue.use(Antd);

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
