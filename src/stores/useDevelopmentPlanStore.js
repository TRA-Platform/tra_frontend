import { defineStore } from 'pinia'
import instance from "@/services/api"

export const useDevelopmentPlanStore = defineStore({
  id: 'DevelopmentPlanStore',
  state: () => ({
    plans: [],
    currentPlan: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchDevelopmentPlans(projectId = null) {
      this.loading = true
      try {
        let url = '/service/development-plans/'
        if (projectId) {
          url += `?project=${projectId}`
        }

        const response = await instance.get(url)
        if (response.status === 200) {
          this.plans = response.data
          return { data: response.data, error: null }
        }
        return { data: [], error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch development plans'
        return { data: [], error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchDevelopmentPlanById(id) {
      this.loading = true
      try {
        const response = await instance.get(`/service/development-plans/${id}/`)
        if (response.status === 200) {
          this.currentPlan = response.data
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch development plan'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createDevelopmentPlan(projectId) {
      this.loading = true
      try {
        const response = await instance.post('/service/development-plans/', {
          project: projectId,
          status: 'draft'
        })

        if (response.status === 201) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create development plan'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateDevelopmentPlan(id, planData) {
      this.loading = true
      try {
        const response = await instance.put(`/service/development-plans/${id}/`, planData)
        if (response.status === 200) {
          if (this.currentPlan && this.currentPlan.id === id) {
            this.currentPlan = response.data
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to update development plan'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createPlanVersion(planId, versionData) {
      this.loading = true
      try {
        const response = await instance.post(`/service/development-plans/${planId}/new_version/`, versionData)

        if (response.status === 201) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create plan version'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchPlanVersionById(id) {
      this.loading = true
      try {
        const response = await instance.get(`/service/development-plan-versions/${id}/`)
        if (response.status === 200) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch plan version'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updatePlanVersion(id, versionData) {
      this.loading = true
      try {
        const response = await instance.put(`/service/development-plan-versions/${id}/`, versionData)
        if (response.status === 200) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to update plan version'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async setCurrentPlanVersion(planId, versionId) {
      this.loading = true
      try {
        const plan = await this.fetchDevelopmentPlanById(planId)
        if (!plan.data) {
          return { data: null, error: 'Plan not found' }
        }

        const version = await this.fetchPlanVersionById(versionId)
        if (!version.data) {
          return { data: null, error: 'Version not found' }
        }

        const response = await this.updateDevelopmentPlan(planId, {
          current_version_number: version.data.version_number,
          status: plan.data.status
        })

        return response
      } catch (error) {
        this.error = error.message || 'Failed to set current plan version'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})
