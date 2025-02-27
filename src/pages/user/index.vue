<script setup>
import AdminMainInfo from "@/views/user/admin/AdminMainInfo.vue";
import AdminTab1 from "@/views/user/admin/AdminTab1.vue";


import { useBaseStore } from "@/stores/useBaseStore";
import { useAuthStore } from "@/stores/useAuthStore"



const { t } = useI18n ()
const pollingThreshold = ref (120)
const route = useRoute ()
const authStore = useAuthStore ()
const baseStore = useBaseStore ()
const userData = ref (null)

const profileSettings = ref(
  structuredClone (toRaw (baseStore.profile_settings)),
)

watch (
  () => profileSettings.value,
  () => {
    baseStore.profile_settings = structuredClone (toRaw (profileSettings.value))
  },
  { deep: true },
)

const userPolling = ref (null)

const loadMessage = ref ({
  message: t ('data.loading'),
  status: 0,
})

onBeforeMount (
  () => {
    getUser ()
    userPolling.value = setInterval (
      getUser,
      5000,
    )
  },
)
onUnmounted (
  () => {
    clearInterval (userPolling.value)
  },
)






const tabs = computed(
  () => {

    const mainInfoTab = {
      icon: 'tabler-info-circle',
      title: t ('user_info.tabs.main_info'),
    }

    const tab1 = {
      icon: 'tabler-user',
      title: t ('user_info.tabs.tab1'),
    }



    return [
      mainInfoTab,
      tab1,
    ]
  },
)

const getUser = (polling = true) => {
  if (polling && pollingThreshold.value <= 0) {
    return
  } else if (!polling) {
    loadMessage.value = {
      message: t ('data.loading'),
      status: 0,
    }
  }
  pollingThreshold.value -= 1
  authStore.me ().then (
    () => {
      userData.value = authStore.userData
    },
  ).catch (
    err => {
      loadMessage.value = {
        message: t ('data.user.loading_error'),
        status: 2,
      }
    },
  )
}
</script>

<template>
  <VRow v-if="userData">
    <VCol
      cols="12"
    >
      <VTabs
        v-model="profileSettings.user_info_tab"
        class="v-tabs-pill"
        show-arrows
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
          class="me-1"
        >
          <VIcon
            :size="18"
            :icon="tab.icon"
            class="me-1"
          />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VWindow
        v-model="profileSettings.user_info_tab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >
        <template
          v-if="authStore.is_admin()"
        >
          <VWindowItem>
            <AdminMainInfo />
          </VWindowItem>
          <VWindowItem>
            <AdminTab1 />
          </VWindowItem>
        </template>
      </VWindow>
    </VCol>
  </VRow>
  <template v-else>
    <VCardItem>
      <div
        colspan="12"
        class="text-center text-body-1 justify-center align-center"
      >
        {{ loadMessage.message }}
        <VProgressCircular
          v-if="loadMessage.status === 0"
          :width="3"
          color="primary"
          indeterminate
        />
        <VIcon
          v-else-if="loadMessage.status === 1"
          color="success"
          icon="tabler-tick"
        />
        <VIcon
          v-else
          color="error"
          icon="tabler-x"
        />
      </div>
    </VCardItem>
  </template>
</template>
