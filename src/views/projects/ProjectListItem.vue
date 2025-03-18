<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view', 'edit', 'delete'])

const statusColor = computed(() => {
  switch (props.project.status) {
    case 'draft': return 'warning'
    case 'active': return 'success'
    case 'archived': return 'secondary'
    case 'completed': return 'info'
    default: return 'primary'
  }
})

const formattedDate = computed(() => {
  const date = new Date(parseInt(props.project.created_at))
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const truncateDescription = (text, length = 100) => {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<template>
  <VCard class="project-card h-100">
    <VCardItem>
      <template #prepend>
        <VAvatar
          color="primary"
          variant="tonal"
          rounded
          size="42"
          class="me-3"
        >
          <VIcon
            v-if="project.type_of_application === 'website'"
            icon="tabler-world-www"
          />
          <VIcon
            v-else-if="project.type_of_application === 'mobile'"
            icon="tabler-device-mobile"
          />
          <VIcon
            v-else-if="project.type_of_application === 'desktop'"
            icon="tabler-device-desktop"
          />
          <VIcon
            v-else-if="project.type_of_application === 'api'"
            icon="tabler-api"
          />
          <VIcon
            v-else
            icon="tabler-code"
          />
        </VAvatar>
      </template>

      <VCardTitle>
        {{ project.name }}
        <VChip
          size="small"
          :color="statusColor"
          class="ms-2"
          label
        >
          {{ project.status }}
        </VChip>
      </VCardTitle>

      <template #append>
        <MoreBtn :menu-list="[
          { title: 'View Details', value: 'view', props: { prependIcon: 'tabler-eye' } },
          { title: 'Edit', value: 'edit', props: { prependIcon: 'tabler-edit' } },
          { title: 'Delete', value: 'delete', props: { prependIcon: 'tabler-trash', color: 'error' } },
        ]" @click="name => emit(name, project.id)" />
      </template>
    </VCardItem>

    <VCardText>
      <p class="mb-2">{{ truncateDescription(project.short_description) }}</p>

      <div class="d-flex mt-4 pt-1">
        <div class="me-2">
          <VIcon icon="tabler-calendar" size="16" class="me-1" />
          <span class="text-caption">{{ formattedDate }}</span>
        </div>

        <div class="me-2">
          <VIcon icon="tabler-code" size="16" class="me-1" />
          <span class="text-caption">{{ project.type_of_application }}</span>
        </div>

        <div v-if="project.language">
          <VIcon icon="tabler-language" size="16" class="me-1" />
          <span class="text-caption">{{ project.language }}</span>
        </div>
      </div>
    </VCardText>

    <VCardActions>
      <VBtn
        variant="tonal"
        color="primary"
        @click="emit('view', project.id)"
      >
        View Details
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<style scoped>
.project-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(var(--v-theme-on-surface), 0.1) !important;
}
</style>
