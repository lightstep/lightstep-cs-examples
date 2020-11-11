<template>
  <div class="card">
    <div class="card-header border-0">
      <div class="row align-items-center">
        <div class="col">
          <h3 class="mb-0">Trace Diffs</h3>
        </div>
        <div class="col text-right">
          <!-- <base-button size="sm" type="primary">See all</base-button> -->
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <base-table thead-classes="thead-light" :data="diffs" type="hover">
        <template slot="columns">
          <th>Status</th>
          <th>Query</th>
          <th>Calculated</th>
          <th>Previous Snapshot</th>
          <th>Recent Snapshot</th>
          <!-- <th></th> -->
        </template>

        <template slot-scope="{ row }">
          <td>
            <base-button
              outline
              size="sm"
              type="secondary"
              style="border: 0"
              :icon="row.diffs | diffStatus"
              @click="openDiff(row)"
            >
            </base-button>
          </td>
          <th scope="row">
            {{ row.query }}
          </th>
          <td>{{ row.calculatedAt | unixTime }}</td>
          <td>
            <a target="_blank" rel="noopener noreferrer" :href="row.linkA">
              Link
            </a>
          </td>
          <td>
            <a target="_blank" rel="noopener noreferrer" :href="row.linkB">
              Link
            </a>
          </td>

          <!-- <td class="text-right">
            <base-button
              size="sm"
              outline
              type="danger"
              style="border: 0"
              icon="ni ni-fat-remove"
              @click="deleteDiff(row._id)"
            >
            </base-button>
          </td> -->
        </template>
      </base-table>
    </div>

    <!-- View Modal -->
    <modal id="viewModal" :show.sync="viewModalShow">
      <template slot="header">
        <h2 class="modal-title">
          Diff Report
        </h2>
      </template>
      <div v-if="viewDiff" class="row">
        <div class="col-sm-12">
          <div class="row">
            <div class="col-sm-3">
              <p>
                <strong>Query: <br />Calculated: </strong>
              </p>
            </div>
            <div class="col-sm-9">
              <p>
                <span class="mark">{{ viewDiff.query }}</span>
                <br />
                {{ viewDiff.calculatedAt | unixTime }}
              </p>
            </div>
          </div>
        </div>
        <div v-for="(d, idx) in viewDiff.diffs" :key="idx" class="col-sm-12">
          <div>
            <div class="row">
              <div class="col-sm-3">
                <strong>Group By: </strong>
              </div>
              <div class="col-sm-9">
                <span class="mark">{{ d.key }}</span>
              </div>
            </div>
            <div class="row">
              <div class="col-sm-3">
                <strong>Snapshot Links:</strong>
              </div>
              <div class="col-sm-9">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  :href="
                    `${viewDiff.linkA}&group_by_key=${
                      d.key == 'service' ? 'component' : d.key
                    }&group_by_type=${findGroupByType(d.key)}`
                  "
                  >Previous</a
                >, &nbsp;
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  :href="
                    `${viewDiff.linkB}&group_by_key=${
                      d.key == 'service' ? 'component' : d.key
                    }&group_by_type=${findGroupByType(d.key)}`
                  "
                  >Recent</a
                >
              </div>
            </div>
            <div v-if="d.missing.length > 0" class="row">
              <div class="col-sm-3">
                <strong>Missing Values: </strong>
              </div>
              <div class="col-sm-9">
                <span class="text-danger">{{ d.missing.join(', ') }}</span>
              </div>
            </div>
            <div v-if="d.new.length > 0" class="row">
              <div class="col-sm-3">
                <strong>New Values: </strong>
              </div>
              <div class="col-sm-9">
                <span class="text-success">{{ d.new.join(', ') }}</span>
              </div>
            </div>
          </div>

          <base-table thead-classes="thead-light" :data="d.diffs" class="mt-2">
            <template slot="columns">
              <th>Value</th>
              <th class="text-right">Average Latency</th>
              <th class="text-right">Error %</th>
              <th class="text-right">Occurrences</th>
            </template>

            <template slot-scope="{ row }">
              <th scope="row">{{ row.value }}</th>
              <td
                class="text-right"
                :class="{
                  'text-danger': row.avg_latency > 0
                }"
              >
                {{ row.avg_latency | latency }}
              </td>
              <td
                class="text-right"
                :class="{
                  'text-danger': row.error_ratio > 0
                }"
              >
                {{ row.error_ratio | errorRatio }}
              </td>
              <td class="text-right">{{ row.occurrence | occurrences }}</td>
            </template>
          </base-table>
        </div>
      </div>

      <template slot="footer">
        <base-button type="link" class="ml-auto" @click="closeModal">
          Close
        </base-button>
      </template>
    </modal>
  </div>
</template>
<script>
import moment from 'moment'

const MICROS_PER_MILLIS = 1000
const MICROS_PER_SECOND = MICROS_PER_MILLIS * 1000
const MICROS_PER_MINUTE = MICROS_PER_SECOND * 60

function microsToMillis(micros) {
  return micros / MICROS_PER_MILLIS
}
function microsToSeconds(micros) {
  return micros / MICROS_PER_SECOND
}
function microsToMinute(micros) {
  return micros / MICROS_PER_MINUTE
}

export default {
  name: 'DiffsTable',
  filters: {
    unixTime(timestamp) {
      return moment.unix(timestamp).format('LLL')
    },
    diffStatus(diffs) {
      let warningStatus = false
      diffs.forEach(d => {
        if (d.new.length > 0 || d.missing.length > 0) {
          warningStatus = true
        }
      })
      return warningStatus
        ? 'ni ni-sound-wave text-warning'
        : 'ni ni-check-bold text-success'
    },
    latency(value) {
      let abs = Math.abs(value)
      let mag = abs
      let unit = 'us'
      if (Math.round(microsToMillis(abs)) > 0) {
        mag = microsToMillis(abs)
        unit = 'ms'
      }
      if (Math.round(microsToSeconds(abs)) > 0) {
        mag = microsToSeconds(abs)
        unit = 's'
      }
      if (Math.round(microsToMinute(abs)) > 0) {
        mag = microsToMinute(abs)
        unit = 'm'
      }
      return `${value < 0 ? '- ' : '+ '}${Math.round(mag)} ${unit}`
    },
    errorRatio(value) {
      if (value == 0) {
        return ''
      } else {
        return `${value < 0 ? '- ' : '+ '}${Math.abs(value) * 100} %`
      }
    },
    occurrences(value) {
      if (value == 0) {
        return ''
      } else {
        return `${value < 0 ? '- ' : '+ '}${Math.abs(value)}`
      }
    }
  },
  data() {
    return {
      viewDiff: null, // set back to null
      viewModalShow: false // set back to false
    }
  },
  computed: {
    diffs() {
      return this.$store.state.diffs
    }
  },
  mounted() {
    this.$store.dispatch('fetchDiffs')
  },
  methods: {
    deleteDiff(id) {
      this.$store.dispatch('deleteDiff', id)
    },
    openDiff(d) {
      this.viewDiff = d
      this.viewModalShow = true
    },
    findGroupByType(key) {
      if (key == 'component' || key == 'service' || key == 'operation') {
        return 'built-in'
      } else {
        return 'tag'
      }
    },
    closeModal() {
      this.viewDiff = null
      this.viewModalShow = false
    }
  }
}
</script>
<style>
#viewModal > .modal-dialog {
  max-width: 80vw;
}
.ni {
  font-size: 20px;
}
</style>
