<template>
  <the-nav-bar />

  <div class="container">
    <router-view v-show="showPage" @ready="onPageReady" :key="$route.path" />
    <AppSpinner v-show="!showPage" />
  </div>
</template>

<script>
import TheNavBar from '@/components/TheNavBar'
import { mapActions } from 'vuex'
import NProgress from 'nprogress'

export default {
  name: 'App',

  components: {
    TheNavBar
  },

  data () {
    return {
      showPage: false
    }
  },

  methods: {
    ...mapActions(['fetchAuthUser']),

    onPageReady () {
      this.showPage = true
      NProgress.done()
    }
  },

  created () {
    this.fetchAuthUser()
    NProgress.configure({
      speed: 200,
      showSpinner: false
    })
    this.$router.beforeEach(() => {
      this.showPage = false
      NProgress.start()
    })
  }
}
</script>

<style>
@import "assets/style.css";
@import "~nprogress/nprogress.css";

#nprogress .bar {
    background-color: #57AD8D;
}
</style>
