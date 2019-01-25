import VueRouter from 'vue-router'
import Vue from 'vue'
import Home from './pages/index'
Vue.use(VueRouter)


const routes = [{
  path: '/',
  component: Home,
}]

const router = new VueRouter({
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return {x: 0, y: 0}
    }
  },
  routes
});


export default router

