import firebase from 'firebase'
import { findById, docToResource } from '@/helpers'

export default {
  initAuthentication ({ dispatch, commit, state }) {
    if (state.authObserverUnsubscribe) state.authObserverUnsubscribe()
    return new Promise(resolve => {
      const unsubscribe = firebase.auth().onAuthStateChanged(async user => {
        this.dispatch('unsubscribeAuthUserSnapshot')
        if (user) {
          await this.dispatch('fetchAuthUser')
          resolve(user)
        } else {
          resolve(null)
        }
      })
      commit('setAuthObserverUnsubscribe', unsubscribe)
    })
  },

  async createPost ({ commit, state }, post) {
    post.userId = state.authId
    post.publishedAt = firebase.firestore.FieldValue.serverTimestamp()
    const batch = firebase.firestore().batch()
    const postRef = firebase
      .firestore()
      .collection('posts')
      .doc()
    const threadRef = firebase
      .firestore()
      .collection('threads')
      .doc(post.threadId)
    const userRef = firebase
      .firestore()
      .collection('users')
      .doc(state.authId)
    batch.set(postRef, post)
    batch.update(threadRef, {
      posts: firebase.firestore.FieldValue.arrayUnion(postRef.id),
      contributors: firebase.firestore.FieldValue.arrayUnion(state.authId)
    })
    batch.update(userRef, {
      postsCount: firebase.firestore.FieldValue.increment(1)
    })
    await batch.commit()

    const newPost = await postRef.get()
    commit('setItem', {
      resource: 'posts',
      item: { ...newPost.data(), id: newPost.id }
    })
    commit('appendPostToThread', {
      childId: newPost.id,
      parentId: post.threadId
    })
    commit('appendContributorToThread', {
      childId: state.authorId,
      parentId: post.threadId
    })
  },

  async updatePost ({ commit, state }, { text, id }) {
    const post = {
      text,
      edited: {
        at: firebase.firestore.FieldValue.serverTimestamp(),
        by: state.authId,
        moderated: false
      }
    }

    const postRef = firebase
      .firestore()
      .collection('posts')
      .doc(id)
    await postRef.update(post)
    const updatedPost = await postRef.get()
    commit('setItem', { resource: 'posts', item: updatedPost })
  },

  async createThread ({ commit, state, dispatch }, { text, title, forumId }) {
    const userId = state.authId
    const publishedAt = firebase.firestore.FieldValue.serverTimestamp()
    const threadRef = firebase
      .firestore()
      .collection('threads')
      .doc()
    const thread = { forumId, title, publishedAt, userId, id: threadRef.id }
    const userRef = firebase
      .firestore()
      .collection('users')
      .doc(userId)
    const forumRef = firebase
      .firestore()
      .collection('forums')
      .doc(forumId)
    const batch = firebase.firestore().batch()

    batch.set(threadRef, thread)
    batch.update(userRef, {
      threads: firebase.firestore.FieldValue.arrayUnion(threadRef.id)
    })
    batch.update(forumRef, {
      threads: firebase.firestore.FieldValue.arrayUnion(threadRef.id)
    })

    await batch.commit()
    const newThread = await threadRef.get()

    commit('setItem', {
      resource: 'threads',
      item: { ...newThread.data(), id: newThread.id }
    })
    commit('appendThreadToUser', { parentId: userId, childId: threadRef.id })
    commit('appendThreadToForum', { parentId: forumId, childId: threadRef.id })
    await dispatch('createPost', { text, threadId: threadRef.id })

    return findById(state.threads, threadRef.id)
  },

  async updateThread ({ commit, state }, { title, text, id }) {
    const thread = findById(state.threads, id)
    const post = findById(state.posts, thread.posts[0])
    let newThread = { ...thread, title }
    let newPost = { ...post, text }
    const threadRef = firebase
      .firestore()
      .collection('threads')
      .doc(id)
    const postRef = firebase
      .firestore()
      .collection('posts')
      .doc(post.id)
    const batch = firebase.firestore().batch()
    batch.update(threadRef, newThread)
    batch.update(postRef, newPost)
    await batch.commit()

    newThread = await threadRef.get()
    newPost = await postRef.get()

    commit('setItem', { resource: 'threads', item: newThread })
    commit('setItem', { resource: 'posts', item: newPost })

    return docToResource(newThread)
  },

  async registerUserWithEmailAndPassword (
    { dispatch },
    { avatar = null, email, name, username, password }
  ) {
    const result = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
    await dispatch('createUser', {
      id: result.user.uid,
      email,
      name,
      username,
      avatar
    })
  },

  signInWithEmailAndPassword (context, { email, password }) {
    return firebase.auth().signInWithEmailAndPassword(email, password)
  },

  async signInWithGoogle ({ dispatch }) {
    const provider = new firebase.auth.GoogleAuthProvider()
    const response = await firebase.auth().signInWithPopup(provider)
    const user = response.user
    const userRef = firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      return dispatch('createUser', {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        username: user.email,
        avatar: user.photoURL
      })
    }
  },

  async signOut ({ commit }) {
    await firebase.auth().signOut()
    commit('setAuthId', null)
  },

  async createUser ({ commit }, { id, email, name, username, avatar = null }) {
    const registeredAt = firebase.firestore.FieldValue.serverTimestamp()
    const usernameLower = username.toLowerCase()
    email = email.toLowerCase()
    const user = { avatar, email, name, username, usernameLower, registeredAt }
    const userRef = await firebase
      .firestore()
      .collection('users')
      .doc(id)
    userRef.set(user)
    const newUser = await userRef.get()
    commit('setItem', { resource: 'users', item: newUser })
    return docToResource(newUser)
  },

  async updateUser ({ commit }, user) {
    const updates = {
      avatar: user.avatar || null,
      username: user.username || null,
      name: user.name || null,
      bio: user.bio || null,
      website: user.website || null,
      email: user.email || null,
      location: user.location || null
    }

    const userRef = firebase.firestore().collection('users').doc(user.id)
    await userRef.update(updates)

    commit('setItem', { resource: 'users', item: user })
  },

  fetchCategory ({ dispatch }, { id }) {
    return dispatch('fetchItem', { emoji: '🎉', resource: 'categories', id })
  },

  fetchForum ({ dispatch }, { id }) {
    return dispatch('fetchItem', { emoji: '🎉', resource: 'forums', id })
  },

  fetchThread ({ dispatch }, { id }) {
    return dispatch('fetchItem', { emoji: '🎉', resource: 'threads', id })
  },

  fetchUser ({ dispatch }, { id }) {
    return dispatch('fetchItem', { emoji: '🎉', resource: 'users', id })
  },

  fetchAuthUser: async ({ dispatch, state, commit }) => {
    const userId = firebase.auth().currentUser?.uid
    if (!userId) return
    dispatch('fetchItem', {
      emoji: '🙋',
      resource: 'users',
      id: userId,
      handleUnsubscribe: unsubscribe => {
        commit('setAuthUserUnsubscribe', unsubscribe)
      }
    })
    commit('setAuthId', userId)
  },

  async fetchAuthUsersPosts ({ commit, state }) {
    const posts = await firebase
      .firestore()
      .collection('posts')
      .where('userId', '==', state.authId)
      .get()
    posts.forEach(item => {
      commit('setItem', { resource: 'posts', item })
    })
  },

  fetchPost ({ dispatch }, { id }) {
    return dispatch('fetchItem', { emoji: '🎉', resource: 'posts', id })
  },

  fetchAllCategories ({ commit }) {
    console.log('🎉', '🎉', 'all')
    return new Promise(resolve => {
      firebase
        .firestore()
        .collection('categories')
        .onSnapshot(querySnapShot => {
          const categories = querySnapShot.docs.map(doc => {
            const item = { id: doc.id, ...doc.data() }
            commit('setItem', { resource: 'categories', item })
            return item
          })
          resolve(categories)
        })
    })
  },

  fetchThreads ({ dispatch }, { ids }) {
    return dispatch('fetchItems', { emoji: '🎉', resource: 'threads', ids })
  },

  fetchForums ({ dispatch }, { ids }) {
    return dispatch('fetchItems', { emoji: '🎉', resource: 'forums', ids })
  },

  fetchUsers ({ dispatch }, { ids }) {
    return dispatch('fetchItems', { emoji: '🎉', resource: 'users', ids })
  },

  fetchPosts ({ dispatch }, { ids }) {
    return dispatch('fetchItems', { emoji: '🎉', resource: 'posts', ids })
  },

  fetchItem (
    { state, commit },
    { emoji, resource, id, handleUnsubscribe = null }
  ) {
    console.log('Id', emoji, id)

    return new Promise(function (resolve, reject) {
      const unsubscribe = firebase
        .firestore()
        .collection(resource)
        .doc(id)
        .onSnapshot(doc => {
          if (doc.exists) {
            const item = { ...doc.data(), id: doc.id }
            commit('setItem', { resource, item })
            resolve(item)
          } else {
            resolve(null)
          }
        })

      if (handleUnsubscribe) {
        handleUnsubscribe(unsubscribe)
      } else {
        commit('appendUnsubscribe', { unsubscribe })
      }
    })
  },

  fetchItems ({ dispatch }, { emoji, resource, ids }) {
    return Promise.all(
      ids.map(id => dispatch('fetchItem', { id, emoji, resource }))
    )
  },

  async unsubscribeAllSnapshots ({ commit, state }) {
    state.unsubscribes.forEach(unsubscribe => unsubscribe())
    commit('clearUnsubscribe')
  },

  async unsubscribeAuthUserSnapshot ({ state, commit }) {
    if (state.authUserUnsubscribe) {
      state.authUserUnsubscribe()
      commit('setAuthUserUnsubscribe', null)
    }
  }
}
