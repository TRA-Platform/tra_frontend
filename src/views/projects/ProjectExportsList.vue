<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
    case 'completed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'in_progress':
      return 'info'
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

const refresh = () => {
  emit('refresh')
}
</script>

<template>
  <VCard>
    <VCardText>
      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-h5">{{ t('projects.exports.title') }}</h2>
        <VBtn
          icon
          variant="text"
          color="primary"
          @click="refresh"
          :loading="loading"
        >
          <VIcon icon="tabler-refresh" />
        </VBtn>
      </div>
      
      <VTable v-if="!loading && exports.length > 0">
        <thead>
          <tr>
            <th>{{ t('projects.exports.table.format') }}</th>
            <th>{{ t('projects.exports.table.status') }}</th>
            <th>{{ t('projects.exports.table.created_by') }}</th>
            <th>{{ t('projects.exports.table.created_at') }}</th>
            <th>{{ t('projects.exports.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exportItem in exports" :key="exportItem.id">
            <td>{{ exportItem.fmt.toUpperCase() }}</td>
            <td>
              <VChip :color="getStatusColor(exportItem.status)" size="small">
                {{ t(`projects.exports.status.${exportItem.status}`) }}
                <VIcon v-if="exportItem.status === 'in_progress'" class="ml-1" icon="tabler-loader" spin />
              </VChip>
            </td>
            <td>{{ exportItem.created_by.username }}</td>
            <td>{{ formatDate(exportItem.created_at) }}</td>
            <td>
              <VBtn
                v-if="exportItem.url && exportItem.status === 'completed'"
                icon
                variant="text"
                color="primary"
                @click="downloadExport(exportItem)"
              >
                <VIcon icon="tabler-download" />
              </VBtn>
              <VBtn
                v-else-if="exportItem.status === 'in_progress'"
                disabled
                icon
                variant="text"
                color="primary"
              >
                <VIcon icon="tabler-hourglass" />
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
        {{ t('projects.exports.empty') }}
      </VAlert>

      <div v-else class="d-flex justify-center align-center" style="min-height: 200px">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>
    </VCardText>
  </VCard>
</template> 
