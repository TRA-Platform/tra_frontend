<template>
  <div v-if="modelValue" class="mockup-preview-dialog">
    <div class="dialog-overlay" @click="close"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>{{ mockup.name }}</h2>
        <div class="dialog-actions">
          <button 
            v-if="mockup.needs_regeneration"
            class="regenerate-btn"
            @click="regenerateMockup"
            :disabled="mockup.generation_status === 'in_progress'"
          >
            {{ mockup.generation_status === 'in_progress' ? 'Regenerating...' : 'Regenerate' }}
          </button>
          <button class="close-btn" @click="close">Close</button>
        </div>
      </div>
      <div class="dialog-body">
        <div v-if="mockup.generation_status === 'in_progress'" class="generation-status">
          <div class="loading-spinner"></div>
          <p>Generating mockup...</p>
        </div>
        <div v-else-if="mockup.generation_status === 'error'" class="error-status">
          <p class="error-message">{{ mockup.generation_error || 'Failed to generate mockup' }}</p>
        </div>
        <div v-else class="mockup-content">
          <div v-if="mockup.needs_regeneration" class="regeneration-warning">
            <p>This mockup needs to be regenerated due to changes in its associated requirement or user story.</p>
          </div>
          <div v-html="mockup.html_content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useMockupStore } from '@/stores/useMockupStore'

export default {
  name: 'MockupPreviewDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    mockup: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const mockupStore = useMockupStore()
    const error = ref(null)

    const close = () => {
      emit('update:modelValue', false)
    }

    const regenerateMockup = async () => {
      try {
        await mockupStore.regenerateMockup(props.mockup.id)
      } catch (err) {
        error.value = 'Failed to regenerate mockup'
        console.error(err)
      }
    }

    // Watch for changes in the mockup's generation status
    watch(() => props.mockup.generation_status, (newStatus) => {
      if (newStatus === 'completed') {
        // Refresh the mockup data
        mockupStore.fetchMockup(props.mockup.id)
      }
    })

    return {
      error,
      close,
      regenerateMockup
    }
  }
}
</script>

<style scoped>
.mockup-preview-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  position: relative;
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  z-index: 1001;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ddd;
}

.dialog-actions {
  display: flex;
  gap: 8px;
}

.regenerate-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.regenerate-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.close-btn {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.generation-status {
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

.error-status {
  color: #e74c3c;
  text-align: center;
  padding: 20px;
}

.regeneration-warning {
  background-color: #fff5f5;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  color: #e74c3c;
}

.mockup-content {
  background-color: white;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style> 