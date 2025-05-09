<script setup>
import { ref } from 'vue'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  exports: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'error'
    default:
      return 'grey'
  }
}

const formatDate = (timestamp) => {
  return new Date(parseInt(timestamp)).toLocaleString()
}

const downloadExport = (exportItem) => {
  if (exportItem.url) {
    window.open(exportItem.url, '_blank')
  }
}
</script>

<template>
  <VCard>
    <VCardText>
      <VTable v-if="!loading && exports.length > 0">
        <thead>
          <tr>
            <th>Template</th>
            <th>Format</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exportItem in exports" :key="exportItem.id">
            <td>{{ exportItem.template.name }}</td>
            <td>{{ exportItem.fmt.toUpperCase() }}</td>
            <td>
              <VChip :color="getStatusColor(exportItem.status)" size="small">
                {{ exportItem.status }}
              </VChip>
            </td>
            <td>{{ exportItem.created_by.username }}</td>
            <td>{{ formatDate(exportItem.created_at) }}</td>
            <td>
              <VBtn
                v-if="exportItem.url"
                icon
                variant="text"
                color="primary"
                @click="downloadExport(exportItem)"
              >
                <VIcon icon="tabler-download" />
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>

      <VAlert
        v-else-if="!loading && exports.length === 0"
        type="info"
        variant="tonal"
        class="mt-4"
      >
        No exports found
      </VAlert>

      <div v-else class="d-flex justify-center align-center" style="min-height: 200px">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>
    </VCardText>
  </VCard>
</template> 