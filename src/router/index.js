import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../pages/Home.vue'
import Invoices from '../pages/Invoices.vue'
import Settings from '../pages/Settings.vue'
import Pipeline from '../pages/Pipeline.vue'

Vue.use(VueRouter)

  const routes = [
    {
      path: '/',
      name: 'Home',
      icon: 'home',
      component: Home,
    },
    {
      path: '/pipeline',
      name: 'Pipeline',
      icon: 'layout',
      component: Pipeline
    },
    {
      path: '/invoices',
      name: 'Invoices',
      icon: 'reconciliation',
      component: Invoices
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: 'setting',
      component: Settings
    }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
