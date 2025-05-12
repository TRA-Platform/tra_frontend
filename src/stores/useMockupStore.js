import { defineStore } from 'pinia'
import { ref } from 'vue'
import instance from "@/services/api"

export const useMockupStore = defineStore('mockup', () => {
  const mockups = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchProjectMockups = async (projectId) => {
    loading.value = true
    error.value = null
    try {
      const response = await instance.get(`/service/projects/${projectId}/mockups/`)
      mockups.value = response.data
      return response.data
    } catch (err) {
      error.value = 'Failed to fetch mockups'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMockup = async (mockupId) => {
    loading.value = true
    error.value = null
    try {
      const response = await instance.get(`/service/mockups/${mockupId}/`)
      const index = mockups.value.findIndex(m => m.id === mockupId)
      if (index !== -1) {
        mockups.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Failed to fetch mockup'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const regenerateMockup = async (mockupId) => {
    loading.value = true
    error.value = null
    try {
      const response = await instance.post(`/service/mockups/${mockupId}/regenerate/`)
      const index = mockups.value.findIndex(m => m.id === mockupId)
      if (index !== -1) {
        mockups.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Failed to regenerate mockup'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const regenerateAllMockups = async (projectId) => {
    loading.value = true
    error.value = null
    try {
      const response = await instance.post(`/service/projects/${projectId}/regenerate-mockups/`)
      mockups.value = response.data
      return response.data
    } catch (err) {
      error.value = 'Failed to regenerate all mockups'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    mockups,
    loading,
    error,
    fetchProjectMockups,
    fetchMockup,
    regenerateMockup,
    regenerateAllMockups
  }
})
