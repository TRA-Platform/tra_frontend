
import { defineStore } from 'pinia'
import instance from "@/services/api"

export const useMockupStore = defineStore({
  id: 'MockupStore',
  state: () => ({
    mockups: [],
    currentMockup: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchMockups(projectId = null) {
      this.loading = true
      try {
        let url = '/service/mockups/'
        if (projectId) {
          url += `?project=${projectId}`
        }

        const response = await instance.get(url)
        if (response.status === 200) {
          this.mockups = response.data
          return { data: response.data, error: null }
        }
        return { data: [], error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch mockups'
        return { data: [], error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchMockupById(id) {
      this.loading = true
      try {
        const response = await instance.get(`/service/mockups/${id}/`)
        if (response.status === 200) {
          this.currentMockup = response.data
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch mockup'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createMockup(mockupData) {
      this.loading = true
      try {
        const response = await instance.post('/service/mockups/', mockupData)
        if (response.status === 201) {
          if (this.mockups.length) {
            this.mockups.push(response.data)
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create mockup'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateMockup(id, mockupData) {
      this.loading = true
      try {
        const response = await instance.put(`/service/mockups/${id}/`, mockupData)
        if (response.status === 200) {
          if (this.mockups.length) {
            const index = this.mockups.findIndex(m => m.id === id)
            if (index !== -1) {
              this.mockups[index] = response.data
            }
          }
          if (this.currentMockup && this.currentMockup.id === id) {
            this.currentMockup = response.data
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to update mockup'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteMockup(id) {
      this.loading = true
      try {
        const response = await instance.delete(`/service/mockups/${id}/`)
        if (response.status === 204) {
          if (this.mockups.length) {
            this.mockups = this.mockups.filter(m => m.id !== id)
          }
          if (this.currentMockup && this.currentMockup.id === id) {
            this.currentMockup = null
          }
          return { success: true, error: null }
        }
        return { success: false, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to delete mockup'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})
