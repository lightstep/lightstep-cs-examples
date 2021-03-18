<template>
  <div id="diagramContainer" class="container">
    <svg id="diagram" :width="svgWidth" :height="svgHeight"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
const lsColors = [
  '#48AAF9',
  '#8A3EF2',
  '#78EEDA',
  '#D78000',
  '#1248B3',
  '#97DBFC',
  '#006174',
  '#00B6B6',
  '#854200',
  '#F3C8AD',
  '#410472'
]

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
      canvas: null,
      svgWidth: 0,
      node: null,
      link: null,
      simulation: null,
      legend: null,
      color: d3
        .scaleOrdinal()
        .domain([0, 10])
        .range(['#eee'].concat(lsColors))
    }
  },
  computed: {
    svgHeight() {
      return this.svgWidth / 1.61803
    }
  },
  watch: {
    svgWidth: function() {
      this.svgWidth = document.getElementById('diagramContainer').offsetWidth
    },
    diagram: function(newD) {
      // Update here
      this.simulation.stop()
      this.updateDiagram(newD.nodes, newD.edges)
      this.updateLegend(newD.groups)
    }
  },
  mounted() {
    this.svgWidth = document.getElementById('diagramContainer').offsetWidth

    this.svg = d3.select('#diagram')

    this.canvas = this.svg.append('g')

    this.simulation = d3
      .forceSimulation()
      .force('charge', d3.forceManyBody().strength(-4000))
      .force(
        'link',
        d3
          .forceLink()
          .id(d => d.id)
          .distance(150)
      )
      //.force('center', d3.forceCenter(this.svgWidth / 2, this.svgHeight / 2))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .on('tick', this.ticked)

    this.canvas
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

    this.link = this.canvas
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')

    this.node = this.canvas
      .append('g')
      .attr('fill', 'currentColor')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .selectAll('g')

    this.simulation.stop()
    this.resetDiagram()

    // Zoom and Drag
    this.svg.call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [this.svgWidth, this.svgHeight]
        ])
        .scaleExtent([0.25, 8])
        .on('zoom', this.zoomed)
    )
  },
  methods: {
    resetDiagram() {
      this.updateDiagram(this.diagram.nodes, this.diagram.edges)
      this.updateLegend(this.diagram.groups)
      this.updateToolbar(false)
    },
    updateToolbar(add) {
      if (!add) {
        this.svg.select('.toolbar').remove()
      } else {
        this.toolbar = this.svg
          .append('g')
          .attr('class', 'toolbar')
          .attr('transform', `translate(${this.svgWidth - 35},10)`)
        this.toolbar
          .append('circle')
          .attr('cx', '12')
          .attr('cy', '12')
          .attr('r', 17)
          .attr('fill', '#48AAF9')
        let resetBtn = this.toolbar
          .append('svg')
          .attr('id', 'resetBtn')
          .attr('width', '24')
          .attr('height', '24')
          .attr('viewbox', '0 0 24 24')
          .attr('fill', 'none')
          .attr('stroke', 'white')
          .attr('stroke-width', '2')
          .attr('stroke-line-cap', 'round')
          .attr('stroke-linejoin', 'round')
          .style('id', '')
        resetBtn.append('polyline').attr('points', '23 4 23 10 17 10')
        resetBtn.append('polyline').attr('points', '1 20 1 14 7 14')
        resetBtn
          .append('path')
          .attr(
            'd',
            'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'
          )
        this.toolbar
          .on('click', () => {
            this.resetDiagram()
          })
          .on('mouseover', d => {
            d3.select(d.target).style('cursor', 'pointer')
          })
      }
    },
    updateLegend(groups) {
      // reset
      this.svg.select('.legend').remove()

      this.legend = this.svg
        .append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(0,0)')

      if (Object.keys(groups).length > 1) {
        let arr = []
        for (let g in groups) {
          arr[groups[g]] = g
        }
        this.svg
          .select('.legend')
          .append('rect')
          .attr('fill', '#eee')
          .attr('opacity', '0.9')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', arr.length * 20 + 50)
          .attr('width', 150)
        let g = this.svg
          .select('.legend')
          .selectAll('g')
          .data(arr)
          .enter()
          .append('g')
          .attr('x', 15)
          .attr('y', (d, i) => {
            return i * 20 + 50
          })
          .attr('fill', (d, i) => {
            return this.color(i)
          })
        g.append('text')
          .attr('x', 40)
          .attr('y', (d, i) => {
            return i * 20 + 60
          })
          .text(d => (d ? d : 'undefined'))
        g.append('rect')
          .attr('width', 10)
          .attr('height', 10)
          .attr('x', 20)
          .attr('y', (d, i) => {
            return i * 20 + 50
          })
      } else {
        this.svg
          .select('.legend')
          .selectAll('g')
          .remove()
      }
      this.legend
        .append('text')
        .attr('x', 15)
        .attr('y', 25)
        .text(`Services:`)
        .style('font-weight', '600')
      this.legend
        .append('text')
        .attr('id', 'serviceCount')
        .attr('x', 90)
        .attr('y', 25)
        .text(this.diagram.nodes.length)
    },
    updateDiagram(nodes, links) {
      const old = new Map(this.node.data().map(d => [d.id, d]))
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
                .attr('class', 'serviceNode')
                .attr('r', 20)
                .attr('fill', d => vm.color(d.group))
            })
            .call(vm.drag(vm.simulation))
            .call(node =>
              node
                .append('text')
                .attr('class', 'service-name')
                .attr('x', 22)
                .attr('y', '0.31em')
                .text(d => d.id)
                .clone(true)
                .lower()
                .attr('fill', 'none')
                .attr('class', 'service-name-outline')
                .attr('stroke', 'white')
                .attr('stroke-width', 5)
            ),

        update =>
          update
            .call(node => {
              node.select('circle').attr('fill', d => vm.color(d.group))
            })
            .call(node => {
              node.select('text.service-name').text(d => d.id)
              node.select('text.service-name-outline').text(d => d.id)
            }),
        exit => exit.call(node => node.remove())
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

      this.svg
        .selectAll('circle')
        .on('mouseover', d => {
          d3.select(d.target)
            .transition()
            .duration('100')
            .attr('stroke', '#48AAF9')
            .attr('stroke-width', '3')
            .style('cursor', 'pointer')
        })
        .on('mouseleave', d => {
          d3.select(d.target)
            .transition()
            .duration('100')
            .attr('stroke', 'none')
        })
        .on('click', (d, i) => {
          vm.focusDiagram(i.id)
        })

      this.simulation.nodes(nodes)
      this.simulation.force('link').links(links)
      this.simulation.alpha(1).restart()
    },
    focusDiagram(service) {
      console.log('focusing on ', service)
      let svcs = []
      let edges = []
      let nodes = []
      edges = this.diagram.edges.filter(e => {
        return e.source == service || e.target == service
      })
      edges.forEach(e => {
        if (!svcs.includes(e.source)) {
          svcs.push(e.source)
        }
        if (!svcs.includes(e.target)) {
          svcs.push(e.target)
        }
      })
      nodes = this.diagram.nodes.filter(n => {
        return svcs.includes(n.id)
      })
      console.log(nodes, edges)
      this.updateDiagram(nodes, edges)
      this.updateToolbar(true)
    },
    zoomed({ transform }) {
      this.canvas.attr('transform', transform)
    },
    ticked() {
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
