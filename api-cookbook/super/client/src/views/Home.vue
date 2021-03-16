<template>
  <div class="home container">
    <b-field label="Overlay Attribute">
      <b-autocomplete
        v-model="searchAttribute"
        placeholder="eg. platform"
        :keep-first="false"
        :open-on-focus="true"
        :data="filteredAttributes"
        field="name"
        :clearable="true"
        @select="o => (o ? (chosenAttribute = o.name) : (chosenAttribute = ''))"
      />
    </b-field>
    <div style="border: 5px solid #eee; border-radius: 10px;">
      <div v-if="diagramData.nodes">
        <ServiceDiagram :diagram="diagramData" />
      </div>
      <div v-else>Loading diagram...</div>
    </div>
    <!-- TODO: this is for "autocomplete" 
    <div>
      <p v-for="(s, idx) in services" :key="idx">
        {{ s.name }}
        <span v-for="(a, idy) in s.attributes" :key="idy">{{ a }}</span>
      </p>
    </div>
    -->
  </div>
</template>

<script>
// @ is an alias to /src
import ServiceDiagram from '@/components/ServiceDiagram'

export default {
  name: 'Home',
  components: {
    ServiceDiagram
  },
  data() {
    return {
      searchAttribute: '',
      chosenAttribute: ''
    }
  },
  computed: {
    diagramData() {
      const nodes = this.diagram.nodes
      const svcs = this.services
      let diagram = { nodes: [], edges: [], groups: { '': 0 } }
      if (this.chosenAttribute !== '' && svcs !== []) {
        // Update the service diagram grouped by
        let hashCount = 1

        diagram.nodes = nodes.map(n => {
          let group = svcs.filter(s => {
            return s.name == n.id
          })
          let g = ''
          if (
            group[0].attributes &&
            group[0].attributes[this.chosenAttribute] &&
            group[0].attributes[this.chosenAttribute][0]
          ) {
            g = group[0].attributes[this.chosenAttribute][0]['value']
          }
          if (g !== '' && !diagram.groups[g]) {
            diagram.groups[g] = hashCount
            hashCount += 1
          }

          return {
            id: n.id,
            group: diagram.groups[g]
          }
        })
      } else {
        diagram.nodes = this.$store.state.diagram.nodes.map(n => {
          return {
            id: n.id,
            group: 0
          }
        })
      }
      diagram.edges = this.$store.state.diagram.edges.map(e => {
        return {
          source: e.source,
          target: e.target,
          type: e.type
        }
      })
      return diagram
    },
    diagram() {
      return this.$store.state.diagram
    },
    attributes() {
      return this.$store.state.attributes
    },
    services() {
      return this.$store.state.services
    },
    filteredAttributes() {
      return this.attributes.filter(option => {
        return (
          option.name
            .toString()
            .toLowerCase()
            .indexOf(this.searchAttribute.toString().toLowerCase()) >= 0
        )
      })
    }
  },
  watch: {
    chosenAttribute: function() {
      // this fires anytime the attribute is updated
      this.$store.dispatch('getServices', {
        attribute: this.chosenAttribute
      })
    }
  },
  mounted() {
    // This fires once
    this.$store.dispatch('getDiagram')
    this.$store.dispatch('getServices', {
      attribute: this.chosenAttribute
    })
    this.$store.dispatch('getAttributes')
  }
}
</script>
