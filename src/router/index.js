import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../pages/Home.vue'
import Invoices from '../pages/Invoices.vue'
import Settings from '../pages/Settings.vue'
import Pipeline from '../pages/Pipeline.vue'
import ViewInvoice from '../pages/ViewInvoice.vue'

Vue.use(VueRouter)

  const routes = [
    {
      path: '/',
      name: 'Home',
      icon: 'home',
      main_page: true,
      component: Home,
    },
    {
      path: '/pipeline',
      name: 'Pipeline',
      icon: 'layout',
      main_page: true,
      component: Pipeline
    },
    {
      path: '/invoices',
      name: 'Invoices',
      icon: 'reconciliation',
      main_page: true,
      component: Invoices
    },
    {
      path: '/view_invoice/:id',
      name: 'View Invoice',
      main_page: false,
      parents: [
        'Invoices'
      ],
      component: ViewInvoice
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: 'setting',
      main_page: true,
      component: Settings
    }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
