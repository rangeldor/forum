<template>
  <div class="col-full">
    <ForumList v-for="category in categories" :key="category.id" :forums="getForumsForCategory(category)" :title="category.name" :category-id="category.id" />
  </div>
</template>

<script>
import ForumList from './ForumList.vue'

export default {
  components: { ForumList },

  props: {
    categories: {
      required: true,
      type: Array
    }
  },

  methods: {
    getForumsForCategory (category) {
      return this.$store.state.forums.filter(forum => forum.categoryId === category.id)
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
