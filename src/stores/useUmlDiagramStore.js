import { defineStore } from 'pinia'
import instance from "@/services/api"

export const useUmlDiagramStore = defineStore({
  id: 'UmlDiagramStore',
  state: () => ({
    diagrams: [],
    currentDiagram: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchDiagrams(projectId = null, diagramType = null) {
      this.loading = true
      try {
        let url = '/service/uml-diagrams/'
        const params = {}

        if (projectId) {
          params.project = projectId
        }

        if (diagramType) {
          params.diagram_type = diagramType
        }

        const response = await instance.get(url, { params })

        if (response.status === 200) {
          this.diagrams = response.data
          return { data: response.data, error: null }
        }
        return { data: [], error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch UML diagrams'
        return { data: [], error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchDiagramById(id) {
      this.loading = true
      try {
        const response = await instance.get(`/service/uml-diagrams/${id}/`)
        if (response.status === 200) {
          this.currentDiagram = response.data
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch UML diagram'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createDiagram(diagramData) {
      this.loading = true
      try {
        const response = await instance.post('/service/uml-diagrams/', diagramData)
        if (response.status === 201) {
          if (this.diagrams.length) {
            this.diagrams.push(response.data)
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create UML diagram'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateDiagram(id, diagramData) {
      this.loading = true
      try {
        const response = await instance.put(`/service/uml-diagrams/${id}/`, diagramData)
        if (response.status === 200) {
          if (this.diagrams.length) {
            const index = this.diagrams.findIndex(d => d.id === id)
            if (index !== -1) {
              this.diagrams[index] = response.data
            }
          }
          if (this.currentDiagram && this.currentDiagram.id === id) {
            this.currentDiagram = response.data
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to update UML diagram'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteDiagram(id) {
      this.loading = true
      try {
        const response = await instance.delete(`/service/uml-diagrams/${id}/`)
        if (response.status === 204) {
          if (this.diagrams.length) {
            this.diagrams = this.diagrams.filter(d => d.id !== id)
          }
          if (this.currentDiagram && this.currentDiagram.id === id) {
            this.currentDiagram = null
          }
          return { success: true, error: null }
        }
        return { success: false, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to delete UML diagram'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async regenerateDiagram(id) {
      this.loading = true
      try {
        const response = await instance.post(`/service/uml-diagrams/${id}/regenerate/`)

        if (response.status === 202) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to regenerate UML diagram'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async generateDiagrams(projectId, diagramType = "class") {
      this.loading = true
      try {
        const response = await instance.post(`/service/projects/${projectId}/generate_uml_diagrams/`, {
          diagram_type: diagramType
        })

        if (response.status === 202) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to generate UML diagrams'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})
