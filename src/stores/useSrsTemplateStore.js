import { defineStore } from 'pinia'
import instance from "@/services/api"

export const useSrsTemplateStore = defineStore({
  id: 'SrsTemplateStore',
  state: () => ({
    templates: [],
    currentTemplate: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchTemplates() {
      this.loading = true
      try {
        const response = await instance.get('/service/srs-templates/')
        if (response.status === 200) {
          this.templates = response.data
          return { data: response.data, error: null }
        }
        return { data: [], error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch SRS templates'
        return { data: [], error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchTemplateById(id) {
      this.loading = true
      try {
        const response = await instance.get(`/service/srs-templates/${id}/`)
        if (response.status === 200) {
          this.currentTemplate = response.data
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch SRS template'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createTemplate(templateData) {
      this.loading = true
      try {
        const response = await instance.post('/service/srs-templates/', templateData)
        if (response.status === 201) {
          if (this.templates.length) {
            this.templates.push(response.data)
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create SRS template'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})
