import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import store from '@/store'
import firebase from 'firebase'
import firebaseConfig from '@/config/firebase'
import FontAwesome from '@/plugins/FontAwesome'

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

const forumApp = createApp(App)
forumApp.use(router)
forumApp.use(store)
forumApp.use(FontAwesome)

// Percorre a pasta setada (components) e procura por componentes com nome iniciado por App
const requireComponent = require.context('./components', true, /App[A-Z]\w+\.(vue|js)$/)
// Percorre os componentes encontrados e seta o nome do componente para ser usado
requireComponent.keys().forEach(function (fileName) {
  let baseComponentConfig = requireComponent(fileName)
  baseComponentConfig = baseComponentConfig.default || baseComponentConfig
  const baseComponentName = baseComponentConfig.name || (
    fileName
      .replace(/^.+\//, '')
      .replace(/\.\w+$/, '')
  )
  // Todos os componentes encontrados são registrados globalmente
  forumApp.component(baseComponentName, baseComponentConfig)
})

forumApp.mount('#app')
