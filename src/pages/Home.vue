<template>
<div class="container col-full" v-if="asyncDataStatus_ready">
  <h1 class="push-top">Welcome to the forum</h1>
  <CategoryList :categories="categories" />
</div>

</template>

<script>
import CategoryList from '@/components/CategoryList'
import { mapActions } from 'vuex'
import asyncDataStatus from '@/mixins/asyncDataStatus'

export default {

  components: {
    CategoryList
  },

  mixins: [asyncDataStatus],

  computed: {
    categories () {
      return this.$store.state.categories
    }
  },

  methods: {
    ...mapActions(['fetchAllCategories', 'fetchForums'])
  },

  async created () {
    const categories = await this.fetchAllCategories()
    const forumIds = categories.map(category => category.forums).flat()
    await this.fetchForums({ ids: forumIds })

    this.asyncDataStatus_fetched()
  }
}
</script>

<style lang="scss" scoped>
</style>
