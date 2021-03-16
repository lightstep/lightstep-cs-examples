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
    diagram: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      svg: null,
      svgWidth: 0,
      node: null,
      link: null,
      simulation: null
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
    },
    diagram: function(newD) {
      // Update here
      this.simulation.stop()
      this.update(newD.nodes, newD.edges)
    }
  },
  mounted() {
    this.svgWidth = document.getElementById('container').offsetWidth * 0.9

    this.svg = d3.select('#diagram')

    this.simulation = d3
      .forceSimulation()
      .force('charge', d3.forceManyBody().strength(-400))
      .force(
        'link',
        d3
          .forceLink()
          .id(d => d.id)
          .distance(150)
      )
      .force('center', d3.forceCenter(this.svgWidth / 2, this.svgHeight / 2))
      .on('tick', this.ticked)

    this.svg
      .append('defs')
      .selectAll('marker')
      .data(['one'])
      .join('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 42)
      .attr('refY', -0.5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#999')
      .attr('d', 'M0,-5L10,0L0,5')

    this.link = this.svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')

    this.node = this.svg
      .append('g')
      .attr('fill', 'currentColor')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .selectAll('g')

    this.simulation.stop()
    this.update(this.diagram.nodes, this.diagram.edges)
  },
  methods: {
    update(nodes, links) {
      // FIXME: 10 colors only so far
      const color = d3
        .scaleOrdinal()
        .domain([0, 10])
        .range(['#eee'].concat(d3.schemeCategory10))
      const old = new Map(this.node.data().map(d => [d.id, d]))
      // nodes = nodes.map(d => Object.create(d))
      nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d))
      links = links.map(d => Object.create(d))

      const vm = this

      this.node = this.node.data(nodes).join(
        enter =>
          enter
            .append('g')
            .call(node => {
              node
                .append('circle')
                .attr('r', 20)
                .attr('fill', d => color(d.group))
            })
            .call(vm.drag(vm.simulation))
            .call(node =>
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
            ),
        update =>
          update.call(node =>
            node.select('circle').attr('fill', d => color(d.group))
          )
      )

      this.link = this.link
        .data(links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr(
          'marker-end',
          d => `url(${new URL(`#arrow-${d.type}`, location)})`
        )

      vm.simulation.nodes(nodes)
      vm.simulation.force('link').links(links)
      vm.simulation.alpha(1).restart()
    },
    ticked() {
      //this.node.attr('cx', d => d.x).attr('cy', d => d.y)
      this.node.attr('transform', d => `translate(${d.x},${d.y})`)

      this.link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
    },
    drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged(event, d) {
        d.fx = event.x
        d.fy = event.y
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }

      return d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss"></style>
