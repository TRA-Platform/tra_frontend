import { defineStore } from 'pinia'
import instance from "@/services/api"
import { useStorage } from "@vueuse/core"

export const useBaseStore = defineStore ({
  id: 'BaseStore',
  state: () => ({
    profile_settings: useStorage ('profile_settings', {
      user_info_tab: null,
    }),
  }),
})
