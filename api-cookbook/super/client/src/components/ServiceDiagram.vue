<template>
  <div id="container" class="container">
    <svg id="diagram" :width="svgWidth" :height="svgHeight"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'ServiceDiagram',
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      svgWidth: 0
    }
  },
  computed: {
    svgHeight() {
      return this.svgWidth // / 1.61803
    }
  },
  watch: {
    svgWidth: function() {
      this.svgWidth = document.getElementById('container').offsetWidth * 0.9
    }
  },
  mounted() {
    this.svgWidth = document.getElementById('container').offsetWidth * 0.9
    this.init()
  },
  methods: {
    drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event) {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      }

      return d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    },
    init() {
      const color = d3.scaleOrdinal(d3.schemeCategory10)

      const links = this.data.edges.map(d => Object.create(d))
      const nodes = this.data.nodes.map(d => Object.create(d))

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          'link',
          d3.forceLink(links).id(d => d.id)
        )
        .force('charge', d3.forceManyBody().strength(-1000))
        .force('center', d3.forceCenter(this.svgWidth / 2, this.svgHeight / 2))

      const svg = d3.select('#diagram')

      svg
        .append('defs')
        .selectAll('marker')
        .data(['one'])
        .join('marker')
        .attr('id', d => `arrow-${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 30)
        .attr('refY', -0.5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('fill', '#999')
        .attr('d', 'M0,-5L10,0L0,5')

      const link = svg
        .append('g')
        .attr('fill', 'none')
        .attr('stroke-width', 1.5)
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr(
          'marker-end',
          d => `url(${new URL(`#arrow-${d.type}`, location)})`
        )

      const node = svg
        .append('g')
        .attr('fill', 'currentColor')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .call(this.drag(simulation))

      node
        .append('circle')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .attr('r', 20)
        .attr('fill', d => {
          return color(d.group)
        })

      node
        .append('text')
        .attr('x', 22)
        .attr('y', '0.31em')
        .text(d => d.id)
        .clone(true)
        .lower()
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 5)

      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        node.attr('transform', d => `translate(${d.x},${d.y})`)
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss"></style>
