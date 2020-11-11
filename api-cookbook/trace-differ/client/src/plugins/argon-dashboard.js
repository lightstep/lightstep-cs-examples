import '@/assets/vendor/nucleo/css/nucleo.css'
import '@/assets/scss/argon.scss'
import globalComponents from './globalComponents'
import globalDirectives from './globalDirectives'
import SidebarPlugin from '@/components/SidebarPlugin/index'
import NotificationPlugin from '@/components/NotificationPlugin/index'
import VueToast from 'vue-toast-notification'
import Vuelidate from 'vuelidate'

export default {
  install(Vue) {
    Vue.use(Vuelidate)
    Vue.use(VueToast, {
      position: 'top',
      duration: 3000,
      dismissible: true,
      type: 'info'
    })
    Vue.use(globalComponents)
    Vue.use(globalDirectives)
    Vue.use(SidebarPlugin)
    Vue.use(NotificationPlugin)
  }
}
