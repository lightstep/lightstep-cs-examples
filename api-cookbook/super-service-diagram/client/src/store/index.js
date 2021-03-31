import Vue from 'vue'
import Vuex from 'vuex'
import api from './api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    diagram: {},
    services: [],
    attributes: []
  },
  mutations: {
    setDiagram(state, val) {
      state.diagram = val
    },
    setServices(state, val) {
      state.services = val
    },
    setAttributes(state, val) {
      state.attributes = val
    }
  },
  actions: {
    async getDiagram({ commit }) {
      let url = '/services/diagram'
      api
        .get(url)
        .then(res => {
          // format the data
          let graph = { nodes: [], edges: [] }
          graph.nodes = res.data.services.map(s => {
            return {
              id: s.name
            }
          })
          graph.edges = res.data.edges.map(e => {
            return {
              source: e.from,
              target: e.to,
              type: 'one' // FIXME
            }
          })
          commit('setDiagram', graph)
        })
        .catch(err => {
          console.error(err)
        })
    },
    async getServices({ commit }, data) {
      let url = '/services'
      api
        .get(url, { params: { attribute: data.attribute } })
        .then(res => {
          commit('setServices', res.data.services)
        })
        .catch(err => {
          console.error(err)
        })
    },
    async getAttributes({ commit }) {
      let url = '/attributes'
      api
        .get(url)
        .then(res => {
          commit('setAttributes', res.data.attributes)
        })
        .catch(err => {
          console.error(err)
        })
    }
  },
  modules: {}
})
