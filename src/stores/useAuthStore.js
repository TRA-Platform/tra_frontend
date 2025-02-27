import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import instance from "@/services/api"
import EventBus from "@/services/EventBus"

export const useAuthStore = defineStore ({
  id: 'AuthStore',
  state: () => ({
    userData: useStorage ('userData', {
      username: "",
      first_name: "",
      email: "",
      role: 0,
    }),
    authData: useStorage ('authData', {
      'maintenance': false,
      'access': '',
      'refresh': '',
      'nextUrl': 'index',
      'nextParams': {},
    }),
  }),
  actions: {
    is_authenticated () {
      return !!this.authData.access
    },
    is_admin () {
      return this.userData.role === 9
    },
    login (params) {
      return instance.post ('/auth/login/', params)
    },
    async me (params) {
      let response = await instance.get ('/auth/me/', { params })
      if (response.status !== 200) {
        localStorage.removeItem ('userData')
      } else {
        this.userData = {
          ...response.data,
        }
      }

      return { data: this.userData }
    },
    async changePassword (params) {
      const response = await instance.post (`/auth/change-password/`, params)
      if (response.status === 200) {
        return {
          data: response.data,
          error: null,
        }
      }

      return {
        data: [],
        error: response.data,
      }
    },
    register (params) {
      return instance.post ('/auth/register/', params)
    },
    refresh (params) {
      return instance.post ('/auth/login/refresh/', params)
    },
    logout (params) {
      localStorage.removeItem ('userData')
      localStorage.removeItem ('authData')
      this.$reset ()
    },
    async registerTrader (params) {
      const response = await instance.post (`/auth/register-trader/`, params)
      if (response.status === 201) {
        return {
          data: response.data,
          error: null,
        }
      }

      return {
        data: [],
        error: response.data,
      }
    },
    async registerMerchant (params) {
      const response = await instance.post (`/auth/register-merchant/`, params)
      if (response.status === 201) {
        return {
          data: response.data,
          error: null,
        }
      }

      return {
        data: [],
        error: response.data,
      }
    },
    async registerSubMerchant (params) {
      const response = await instance.post (`/auth/register-submerchant/`, params)
      if (response.status === 201) {
        return {
          data: response.data,
          error: null,
        }
      }

      return {
        data: [],
        error: response.data,
      }
    },
    async registerTeamLead (params) {
      const response = await instance.post (`/auth/register-teamlead/`, params)
      if (response.status === 201) {
        return {
          data: response.data,
          error: null,
        }
      }

      return {
        data: [],
        error: response.data,
      }
    },
    async updateUser (params, id) {
      const response = await instance.patch (`/auth/update-user/${id}/`, params)
      if (response.status === 200) {
        return {
          data: response.data,
          error: null,
        }
      }

      return {
        data: [],
        error: response.data,
      }
    },
    async registerSupport (params) {
      const response = await instance.post (`/auth/register-support/`, params)
      if (response.status === 201) {
        return {
          data: response.data,
          error: null,
        }
      }

      return {
        data: [],
        error: response.data,
      }
    },
  },
})
