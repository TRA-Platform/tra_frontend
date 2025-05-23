<script setup>
import { useBaseStore } from '@/stores/useBaseStore'
import { useAuthStore } from '@/stores/useAuthStore'

const baseStore = useBaseStore ()
const authStore = useAuthStore ()
const userData = ref (JSON.parse (JSON.stringify (authStore.userData)))

const isOldPasswordVisible = ref (false)
const isNewPasswordVisible = ref (false)
const isConfirmPasswordVisible = ref (false)
const isTwoFADialogVisible = ref (false)

const oldPassword = ref ("")
const newPassword = ref ("")
const confirmPassword = ref ("")

const snackbar = ref ({
  enabled: false,
  type: 'error',
  message: 'Permission denied!',
})

const updatePassword = () => {
  authStore.changePassword ({
    old_password: oldPassword.value,
    password: newPassword.value,
    password2: confirmPassword.value,
  }).then (
    response => {
      if (response.error) {
        throw response.error
      }
      snackbar.value = {
        enabled: true,
        type: 'success',
        message: "Successfully changed password!",
      }
    },
  ).catch (
    error => {
      snackbar.value = {
        enabled: true,
        type: 'error',
        message: error,
      }
    },
  )
}

const updateUserInfo = async () => {
  baseStore.updateSupportMemberById ({
    telegram: userData.value.telegram,
    phone: userData.value.phone,
  }, userData.value.object_id).then (
    response => {
      if (response.error) {
        throw response.error
      }
      snackbar.value = {
        enabled: true,
        type: 'success',
        message: "Successfully updated!",
      }
    },
  ).catch (
    error => {
      snackbar.value = {
        enabled: true,
        type: 'error',
        message: error,
      }
    },
  )

  console.log ("updateUserInfo", userData.value)
}
</script>

<template>
  <div>
    <VSnackbar
      v-model="snackbar.enabled"
      :color="snackbar.type"
      :timeout="3000"
      top
    >
      {{ snackbar.message }}
    </VSnackbar>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="mt-2 ms-2">
            <VAvatar
              size="50"
              variant="text"
              color="primary"
              icon="tabler-info-circle"
            />
            {{ $t ('user_info.tabs.main_info') }}
          </VCardTitle>
          <VCol cols="12">
            <VCard :title="$t('user_info.main_info.base_info.title')">
              <VCardText>
                <VForm @submit.prevent="() => {}">
                  <VRow class="pt-1">
                    <VCol
                      cols="12"
                      sm="6"
                      md="6"
                    >
                      <VTextField
                        v-model="userData.first_name"
                        :label="$t('user_info.main_info.base_info.fields.name')"
                        outlined
                        dense
                        readonly
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      sm="6"
                      md="6"
                    >
                      <VTextField
                        v-model="userData.email"
                        :label="$t('user_info.main_info.base_info.fields.email')"
                        outlined
                        dense
                        readonly
                      />
                    </VCol>
                  </VRow>
                </VForm>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12">
            <VCard :title="$t('user_info.main_info.change_password.title')">
              <VCardText>
                <VAlert
                  variant="tonal"
                  color="warning"
                  class="mb-4"
                >
                  <VAlertTitle class="mb-1">
                    {{ $t ('user_info.main_info.alerts.password.title') }}
                  </VAlertTitle>
                  <span>{{ $t ('user_info.main_info.alerts.password.description') }}</span>
                </VAlert>

                <VForm @submit.prevent="() => {}">
                  <VRow>
                    <VCol
                      cols="12"
                      sm="6"
                    >
                      <VTextField
                        v-model="oldPassword"
                        :label="$t('user_info.main_info.change_password.fields.old_password')"
                        :type="isOldPasswordVisible ? 'text' : 'password'"
                        :append-inner-icon="isOldPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                        @click:append-inner="isOldPasswordVisible = !isOldPasswordVisible"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      sm="6"
                    >
                      <VTextField
                        v-model="newPassword"
                        :label="$t('user_info.main_info.change_password.fields.new_password')"
                        :type="isNewPasswordVisible ? 'text' : 'password'"
                        :append-inner-icon="isNewPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                        @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      sm="6"
                    >
                      <VTextField
                        v-model="confirmPassword"
                        :label="$t('user_info.main_info.change_password.fields.confirm_password')"
                        :type="isConfirmPasswordVisible ? 'text' : 'password'"
                        :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                        @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                      />
                    </VCol>
                    <VCol
                      cols="6"
                      sm="4"
                    >
                      <VBtn
                        color="primary"
                        type="submit"
                        @click="updatePassword"
                      >
                        {{ $t ('user_info.main_info.change_password.update_button') }}
                      </VBtn>
                    </VCol>
                  </VRow>
                </VForm>
              </VCardText>
            </VCard>
          </VCol>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
