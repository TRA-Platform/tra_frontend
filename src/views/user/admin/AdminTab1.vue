<script setup>
import { useAuthStore } from "@/stores/useAuthStore"
import { formatUUID } from "@core/utils/formatters"

const authStore = useAuthStore ()

const snackbar = ref ({
  enabled: false,
  type: 'error',
  message: 'Permission denied!',
})


const update = () => {
  // console.log ('update')
}


onMounted(
  () => {
    update ()
  },
)
</script>

<template>
  <div>
    <VSnackbar
      v-model="snackbar.enabled"
      :color="snackbar.type"
      :timeout="3000"
      top
    >
      {{ snackbar.message }}
    </VSnackbar>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="mt-2 ms-2">
            <VAvatar
              size="50"
              variant="text"
              color="primary"
              icon="tabler-coin"
            />
            {{ $t('tabs.tab1') }}
            <VBtn
              class="float-end"
              icon="tabler-refresh"
              size="small"
              @click="update"
            />
          </VCardTitle>
          <VCol cols="12">
            <VCard>
              <VCardText>
                Under construction ...
              </VCardText>
            </VCard>
          </VCol>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
