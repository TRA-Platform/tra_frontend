<template>
  <div class="mockups-list">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading mockups...</p>
    </div>
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
    </div>
    <div v-else>
      <div class="mockups-header">
        <h2>Project Mockups</h2>
        <button 
          class="regenerate-all-btn"
          @click="regenerateAllMockups"
          :disabled="isRegenerating"
        >
          {{ isRegenerating ? 'Regenerating...' : 'Regenerate All' }}
        </button>
      </div>
      <div class="mockups-grid">
        <div 
          v-for="mockup in mockups" 
          :key="mockup.id"
          class="mockup-card"
          :class="{ 'needs-regeneration': mockup.needs_regeneration }"
        >
          <div class="mockup-header">
            <h3>{{ mockup.name }}</h3>
            <div class="mockup-actions">
              <button 
                v-if="mockup.needs_regeneration"
                class="regenerate-btn"
                @click="regenerateMockup(mockup)"
                :disabled="mockup.generation_status === 'in_progress'"
              >
                {{ mockup.generation_status === 'in_progress' ? 'Regenerating...' : 'Regenerate' }}
              </button>
              <button 
                class="preview-btn"
                @click="previewMockup(mockup)"
              >
                Preview
              </button>
            </div>
          </div>
          <div class="mockup-info">
            <p v-if="mockup.requirement">Requirement: {{ mockup.requirement }}</p>
            <p v-if="mockup.user_story">User Story: {{ mockup.user_story }}</p>
            <p>Version: {{ mockup.version_number }}</p>
            <p>Status: {{ mockup.generation_status }}</p>
            <p v-if="mockup.needs_regeneration" class="regeneration-needed">
              Needs regeneration
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useMockupStore } from '@/stores/useMockupStore'
import MockupPreviewDialog from './MockupPreviewDialog.vue'

export default {
  name: 'ProjectMockupsList',
  components: {
    MockupPreviewDialog
  },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const mockupStore = useMockupStore()
    const loading = ref(false)
    const error = ref(null)
    const mockups = ref([])
    const isRegenerating = ref(false)
    const selectedMockup = ref(null)

    const loadMockups = async () => {
      loading.value = true
      error.value = null
      try {
        mockups.value = await mockupStore.fetchProjectMockups(props.projectId)
      } catch (err) {
        error.value = 'Failed to load mockups'
        console.error(err)
      } finally {
        loading.value = false
      }
    }

    const regenerateMockup = async (mockup) => {
      try {
        await mockupStore.regenerateMockup(mockup.id)
        await loadMockups() // Reload to get updated status
      } catch (err) {
        error.value = 'Failed to regenerate mockup'
        console.error(err)
      }
    }

    const regenerateAllMockups = async () => {
      isRegenerating.value = true
      try {
        await mockupStore.regenerateAllMockups(props.projectId)
        await loadMockups() // Reload to get updated status
      } catch (err) {
        error.value = 'Failed to regenerate all mockups'
        console.error(err)
      } finally {
        isRegenerating.value = false
      }
    }

    const previewMockup = (mockup) => {
      selectedMockup.value = mockup
    }

    onMounted(loadMockups)

    return {
      loading,
      error,
      mockups,
      isRegenerating,
      selectedMockup,
      regenerateMockup,
      regenerateAllMockups,
      previewMockup
    }
  }
}
</script>

<style scoped>
.mockups-list {
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  color: #e74c3c;
  text-align: center;
  padding: 20px;
}

.mockups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.regenerate-all-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.regenerate-all-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.mockups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.mockup-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mockup-card.needs-regeneration {
  border-color: #e74c3c;
  background-color: #fff5f5;
}

.mockup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.mockup-actions {
  display: flex;
  gap: 8px;
}

.regenerate-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.regenerate-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.preview-btn {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.mockup-info {
  font-size: 0.9em;
  color: #666;
}

.regeneration-needed {
  color: #e74c3c;
  font-weight: bold;
  margin-top: 8px;
}
</style> 