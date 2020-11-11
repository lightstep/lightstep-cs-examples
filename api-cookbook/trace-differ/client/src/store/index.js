import Vue from 'vue'
import Vuex from 'vuex'
import api from './api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    queries: [],
    diffs: [],
    snapshots: []
  },
  mutations: {
    setQueries(state, val) {
      state.queries = val
    },
    setDiffs(state, val) {
      state.diffs = val
    },
    setSnapshots(state, val) {
      state.snapshots = val
    }
  },
  actions: {
    fetchQueries({ commit }) {
      api
        .get('/queries')
        .then(res => {
          commit('setQueries', res.data)
        })
        .catch(e => {
          console.error(e)
        })
    },
    fetchDiffs({ commit }) {
      api
        .get('/diffs')
        .then(res => {
          commit('setDiffs', res.data)
        })
        .catch(e => {
          console.error(e)
        })
    },
    // Individual Ops
    addQuery({ dispatch }, query) {
      api
        .post('/queries', query)
        .then(() => {
          dispatch('fetchQueries')
        })
        .catch(e => {
          console.error(e)
        })
    },
    deleteQuery({ dispatch }, id) {
      api
        .delete(`/queries/${id}`)
        .then(() => {
          dispatch('fetchQueries')
        })
        .catch(e => {
          console.error(e)
        })
    },
    deleteDiff({ dispatch }, id) {
      api
        .delete(`/diffs/${id}`)
        .then(() => {
          dispatch('fetchDiffs')
        })
        .catch(e => {
          console.error(e)
        })
    }
  },
  modules: {}
})
