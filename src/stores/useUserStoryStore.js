import { defineStore } from 'pinia'
import instance from "@/services/api"

export const useUserStoryStore = defineStore({
  id: 'UserStoryStore',
  state: () => ({
    userStories: [],
    currentUserStory: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchUserStories(requirementId = null) {
      this.loading = true
      try {
        let url = '/service/user-stories/'
        if (requirementId) {
          url += `?requirement=${requirementId}`
        }

        const response = await instance.get(url)
        if (response.status === 200) {
          this.userStories = response.data
          return { data: response.data, error: null }
        }
        return { data: [], error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch user stories'
        return { data: [], error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchUserStoryById(id) {
      this.loading = true
      try {
        const response = await instance.get(`/service/user-stories/${id}/`)
        if (response.status === 200) {
          this.currentUserStory = response.data
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to fetch user story'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createUserStory(storyData) {
      this.loading = true
      try {
        const response = await instance.post('/service/user-stories/', storyData)
        if (response.status === 201) {
          if (this.userStories.length) {
            this.userStories.push(response.data)
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create user story'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateUserStory(id, storyData) {
      this.loading = true
      try {
        const response = await instance.put(`/service/user-stories/${id}/`, storyData)
        if (response.status === 200) {
          if (this.userStories.length) {
            const index = this.userStories.findIndex(s => s.id === id)
            if (index !== -1) {
              this.userStories[index] = response.data
            }
          }
          if (this.currentUserStory && this.currentUserStory.id === id) {
            this.currentUserStory = response.data
          }
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to update user story'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteUserStory(id) {
      this.loading = true
      try {
        const response = await instance.delete(`/service/user-stories/${id}/`)
        if (response.status === 204) {
          if (this.userStories.length) {
            this.userStories = this.userStories.filter(s => s.id !== id)
          }
          if (this.currentUserStory && this.currentUserStory.id === id) {
            this.currentUserStory = null
          }
          return { success: true, error: null }
        }
        return { success: false, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to delete user story'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async regenerateUserStory(id, feedback = "") {
      this.loading = true
      try {
        const response = await instance.post(`/service/user-stories/${id}/regenerate/`, {
          feedback: feedback
        })

        if (response.status === 202) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to regenerate user story'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createComment(userStoryId, commentData) {
      this.loading = true
      try {
        const response = await instance.post('/service/user-story-comments/', {
          user_story: userStoryId,
          text: commentData.text,
          status: commentData.status || 'active'
        })

        if (response.status === 201) {
          return { data: response.data, error: null }
        }
        return { data: null, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to create comment'
        return { data: null, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteComment(commentId) {
      this.loading = true
      try {
        const response = await instance.delete(`/service/user-story-comments/${commentId}/`)
        if (response.status === 204) {
          return { success: true, error: null }
        }
        return { success: false, error: response.data }
      } catch (error) {
        this.error = error.message || 'Failed to delete comment'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
  }
})
