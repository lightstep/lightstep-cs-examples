<template>
  <div class="home">
    <ServiceDiagram :data="diagramData" />
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
      diagramData: {
        nodes: [
          {
            id: 'iOS',
            group: 1
          },
          {
            id: 'krakend-api-gateway',
            group: 1
          },
          {
            id: 'auth',
            group: 1
          },
          {
            id: 'inventory',
            group: 1
          },
          {
            id: 'memcached',
            group: 1
          },
          {
            id: 'inventory-db',
            group: 1
          },
          {
            id: 'store-server',
            group: 1
          },
          {
            id: 'transaction',
            group: 2
          },
          {
            id: 'transaction-db',
            group: 1
          },
          {
            id: 'store-db',
            group: 3
          },
          {
            id: 'web',
            group: 1
          },
          {
            id: 'apache',
            group: 1
          },
          {
            id: 'payment-processor',
            group: 1
          },
          {
            id: 'warehouse',
            group: 1
          },
          {
            id: 'warehouse-db',
            group: 1
          },
          {
            id: 'profile',
            group: 1
          },
          {
            id: 'android',
            group: 3
          },
          {
            id: 'profile-db',
            group: 1
          }
        ],
        edges: [
          {
            target: 'krakend-api-gateway',
            source: 'iOS',
            type: 'one'
          },
          {
            target: 'auth',
            source: 'krakend-api-gateway',
            type: 'one'
          },
          {
            target: 'inventory',
            source: 'krakend-api-gateway',
            type: 'one'
          },
          {
            target: 'memcached',
            source: 'inventory',
            type: 'one'
          },
          {
            target: 'inventory-db',
            source: 'inventory',
            type: 'one'
          },
          {
            target: 'store-server',
            source: 'krakend-api-gateway',
            type: 'one'
          },
          {
            target: 'transaction',
            source: 'krakend-api-gateway',
            type: 'one'
          },
          {
            target: 'transaction-db',
            source: 'transaction',
            type: 'one'
          },
          {
            target: 'store-db',
            source: 'store-server',
            type: 'one'
          },
          {
            target: 'apache',
            source: 'web',
            type: 'one'
          },
          {
            target: 'krakend-api-gateway',
            source: 'web',
            type: 'one'
          },
          {
            target: 'payment-processor',
            source: 'krakend-api-gateway',
            type: 'one'
          },
          {
            target: 'transaction',
            source: 'payment-processor',
            type: 'one'
          },
          {
            target: 'warehouse',
            source: 'krakend-api-gateway',
            type: 'one'
          },
          {
            target: 'memcached',
            source: 'warehouse',
            type: 'one'
          },
          {
            target: 'warehouse-db',
            source: 'warehouse',
            type: 'one'
          },
          {
            target: 'profile',
            source: 'krakend-api-gateway',
            type: 'one'
          },
          {
            target: 'krakend-api-gateway',
            source: 'android',
            type: 'one'
          },
          {
            target: 'profile-db',
            source: 'profile',
            type: 'one'
          }
        ]
      }
    }
  }
}
</script>
