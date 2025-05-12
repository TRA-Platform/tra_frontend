<script setup>
import { capitalize, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getStatusChipColor } from "@core/utils/formatters";

const { t } = useI18n()

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
  <VCard
    class="project-card h-100"
         @click="emit('view', project.id)"
  >
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
          :color="getStatusChipColor(project.status)"
          size="small"
          label
        >
          {{ capitalize(project.status) }}
        </VChip>
      </VCardTitle>

      <template #append>
        <MoreBtn :menu-list="[
          { title: t('projects.list.actions.view_details'), value: 'view', props: { prependIcon: 'tabler-eye' } },
        ]" @click="name => emit(name, project.id)" />
      </template>
    </VCardItem>

    <VCardText>
      <p class="mb-2">{{ truncateDescription(project.short_description) }}</p>

      <div class="d-flex mt-4 pt-1">
        <div class="me-2">
          <VIcon icon="tabler-calendar" size="16" class="me-1" />
          <span class="text-caption">{{ t('projects.list.details.created_at') }}: {{ formattedDate }}</span>
        </div>

        <div class="me-2">
          <VIcon icon="tabler-code" size="16" class="me-1" />
          <span class="text-caption">{{ t('projects.list.details.type') }}: {{ project.type_of_application }}</span>
        </div>

        <div v-if="project.language">
          <VIcon icon="tabler-language" size="16" class="me-1" />
          <span class="text-caption">{{ t('projects.list.details.language') }}: {{ project.language }}</span>
        </div>
      </div>
    </VCardText>

    <VCardActions>
      <VBtn
        variant="tonal"
        color="primary"
      >
        {{ t('projects.list.actions.view_details') }}
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
