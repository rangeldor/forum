<template>
  <div class="col-large push-top" v-if="asyncDataStatus_ready">
    <h1>
      {{ thread.title }}
      <router-link v-if="thread.userId === authUser?.id" :to="{ name: 'ThreadEdit', params: { id: id } }" class="btn-green btn-small" tag="button"> Edit Thread </router-link>
    </h1>

    <p>
      By <a href="#" class="link-unstyled">{{ thread.author?.name }}</a
      >, <AppDate :timestamp="thread.publishedAt" />
      <span style="float: right; margin-top: 2px" class="hide-mobile text-faded text-small">{{ thread.repliesCount }} replies by {{ thread.contributorsCount }} contributors</span>
    </p>

    <PostList :posts="threadPosts" />

    <PostEditor v-if="authUser" @save="addPost" />
    <div v-else class="text-center" style="margin-bottom: 50px">
      <router-link :to="{ name: 'SignIn', query: { redirectTo: $route.path } }">Sign In</router-link> or
      <router-link :to="{ name: 'Register', query: { redirectTo: $route.path } }"> Register</router-link> to reply.
    </div>
  </div>
</template>

<script>

import PostList from '@/components/PostList'
import PostEditor from '@/components/PostEditor'
import { mapActions, mapGetters } from 'vuex'
import asyncDataStatus from '@/mixins/asyncDataStatus'

export default {
  name: 'ThreadShow',

  components: {
    PostList,
    PostEditor
  },

  mixins: [asyncDataStatus],

  props: {
    id: {
      required: true,
      type: String
    }
  },

  computed: {
    ...mapGetters(['authUser']),

    threads () {
      return this.$store.state.threads
    },

    posts () {
      return this.$store.state.posts
    },

    thread () {
      return this.$store.getters.thread(this.id)
    },

    threadPosts () {
      return this.posts.filter(post => post.threadId === this.id)
    }
  },

  methods: {
    ...mapActions(['createPost', 'fetchThread', 'fetchUsers', 'fetchPosts']),

    addPost (eventData) {
      const post = {
        ...eventData.post,
        threadId: this.id
      }
      this.createPost(post)
    }
  },

  async created () {
    // fetch the thread
    const thread = await this.fetchThread({ id: this.id })

    // fetch the posts
    const posts = await this.fetchPosts({ ids: thread.posts })

    // fetch the users associated with the posts
    const users = posts.map(post => post.userId).concat(thread.userId)
    await this.fetchUsers({ ids: users })
    this.asyncDataStatus_fetched()
  }
}
</script>

<style lang="scss" scoped>
</style>
