<template>
  <span :title="humanFriendlyDate">
    {{ diffForHumans }}
  </span>
</template>

<script>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedDate from 'dayjs/plugin/localizedFormat'
import ptBr from 'dayjs/locale/pt-br'

export default {
  props: {
    timestamp: {
      required: true,
      type: [Number, Object]
    }
  },

  created () {
    dayjs.extend(relativeTime)
    dayjs.extend(localizedDate)
    dayjs.locale(ptBr) // Muda idioma global do dayjs
  },

  computed: {
    normalizedTimestamp () {
      return this.timestamp?.seconds || this.timestamp
    },

    diffForHumans () {
      return dayjs.unix(this.normalizedTimestamp).fromNow()
    },

    humanFriendlyDate () {
      return dayjs.unix(this.normalizedTimestamp).format('llll')
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
