<template>
  <div v-if="asyncDataStatus_ready" class="col-full push-top">
    <h1>
      Editing <i>{{ thread.title }}</i>
    </h1>

    <ThreadEditor :title="thread.title" :text="text" @save="save" @cancel="cancel" />
  </div>
</template>

<script>
import ThreadEditor from '@/components/ThreadEditor'
import { findById } from '@/helpers/index'
import { mapActions } from 'vuex'
import asyncDataStatus from '@/mixins/asyncDataStatus'

export default {
  components: {
    ThreadEditor
  },

  mixins: [asyncDataStatus],

  props: {
    id: {
      type: String,
      required: true
    }
  },

  computed: {
    thread () {
      return this.$store.state.threads.find(thread => thread.id === this.id)
    },

    text () {
      const post = findById(this.$store.state.posts, this.thread.posts[0])

      return post ? post.text : ''
    }
  },

  methods: {

    ...mapActions(['updateThread', 'fetchThread', 'fetchPost']),

    async save ({ title, text }) {
      const thread = await this.updateThread({
        id: this.id,
        title: title,
        text: text
      })

      this.$router.push({ name: 'ThreadShow', params: { id: thread.id } })
    },

    cancel () {
      this.$router.push({ name: 'ThreadShow', params: { id: this.id } })
    }
  },

  async created () {
    const thread = await this.fetchThread({ id: this.id })
    await this.fetchPost({ id: thread.posts[0] })
    this.asyncDataStatus_fetched()
  }
}
</script>

<style lang="scss" scoped>

</style>
