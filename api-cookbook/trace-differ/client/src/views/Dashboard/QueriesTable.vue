<template>
  <div class="card">
    <div class="card-header border-0">
      <div class="row align-items-center">
        <div class="col">
          <h3 class="mb-0">Trace Queries</h3>
        </div>
        <div class="col text-right">
          <a href="#!" class="btn btn-sm btn-primary" @click="modalShow = true"
            >Add Query</a
          >
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <base-table thead-classes="thead-light" :data="queries" type="hover">
        <template slot="columns">
          <th>Name</th>
          <th>Query</th>
          <th>Group By Tags</th>
          <th></th>
        </template>

        <template slot-scope="{ row }">
          <td>
            {{ row.name }}
          </td>
          <th scope="row">
            {{ row.query }}
          </th>
          <td>
            {{ row.groupByKeys.join(', ') }}
          </td>
          <td class="text-right">
            <base-button
              size="sm"
              outline
              type="secondary"
              style="border: 0"
              icon="ni ni-fat-remove"
              @click="deleteQuery(row._id)"
            >
            </base-button>
          </td>
        </template>
      </base-table>
    </div>

    <!-- Add Modal -->
    <modal :show.sync="modalShow">
      <template slot="header">
        <h2 class="modal-title">
          Add Query
        </h2>
      </template>
      <div class="row">
        <base-input
          v-model="$v.modalName.$model"
          :valid="
            $v.modalName.$dirty
              ? $v.modalName.$error
                ? false
                : undefined
              : undefined
          "
          :error="$v.modalName.$error ? 'Name is required' : undefined"
          placeholder="Name"
          class="col-sm-12"
          label="Name"
        ></base-input>
        <base-input
          v-model="$v.modalQuery.$model"
          placeholder="Query"
          :valid="
            $v.modalQuery.$dirty
              ? $v.modalQuery.$error
                ? false
                : undefined
              : undefined
          "
          :error="$v.modalQuery.$error ? 'Query is required' : undefined"
          class="col-sm-12"
          label="Query"
        ></base-input>
      </div>
      <h4>
        Tags
        <base-button
          outline
          size="sm"
          type="primary"
          :disabled="modalTags.length == tagLimit || modalTags[0].key == ''"
          icon="ni ni-fat-add"
          style="border: 0"
          @click="addTag"
        ></base-button>
        <base-button
          style="border: 0"
          :disabled="modalTags[0].key == ''"
          outline
          size="sm"
          type="primary"
          icon="ni ni-fat-delete"
          cl
          @click="removeTag"
        ></base-button>
      </h4>

      <div class="row">
        <base-input
          v-for="(t, idx) in modalTags"
          :key="idx"
          v-model="modalTags[idx].key"
          placeholder="Tag (optional)"
          class="col-sm-4"
        ></base-input>
      </div>

      <template slot="footer">
        <base-button type="success" @click="addQuery">Add</base-button>
        <base-button type="link" class="ml-auto" @click="closeModal">
          Cancel
        </base-button>
      </template>
    </modal>
  </div>
</template>
<script>
import { required } from 'vuelidate/lib/validators'
import moment from 'moment'
export default {
  name: 'QueriesTable',
  validations: {
    modalQuery: { required },
    modalName: { required }
  },
  data() {
    return {
      tagLimit: 3,
      modalQuery: '',
      modalName: '',
      modalTags: [
        {
          key: ''
        }
      ],
      modalShow: false
    }
  },
  computed: {
    queries() {
      return this.$store.state.queries
    }
  },
  mounted() {
    this.$store.dispatch('fetchQueries')
  },
  methods: {
    addTag() {
      if (
        this.modalTags[this.modalTags.length - 1].key != '' &&
        this.modalTags.length < this.tagLimit
      ) {
        this.modalTags.push({ key: '' })
      }
    },
    removeTag() {
      if (this.modalTags.length > 1) {
        this.modalTags.pop()
      } else {
        this.modalTags = []
        this.modalTags.push({
          key: ''
        })
      }
    },
    addQuery() {
      if (this.modalQuery && this.modalName) {
        this.modalShow = false
        this.$store.dispatch('addQuery', {
          query: this.modalQuery,
          name: this.modalName,
          createdAt: moment().unix(),
          groupByKeys: this.modalTags
            .map(x => {
              if (x.key != '') {
                return x.key
              }
            })
            .filter(x => {
              return typeof x === 'string'
            })
        })
      } else {
        this.$v.modalQuery.$touch()
        this.$v.modalName.$touch()
      }
    },
    deleteQuery(qid) {
      this.$store.dispatch('deleteQuery', qid)
    },
    closeModal() {
      this.modalQuery = ''
      this.$v.modalQuery.$reset()
      this.modalName = ''
      this.$v.modalName.$reset()
      this.modalShow = false
    }
  }
}
</script>
<style></style>
