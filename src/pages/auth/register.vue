<script setup>
import {
  confirmedValidator,
  emailValidator,
  passwordValidator,
  requiredValidator,
} from '@validators'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useAuthStore } from "@/stores/useAuthStore"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const snackbar = ref({
  enabled: false,
  type: 'error',
  message: '',
})

const form = ref({
  username: '',
  email: '',
  password: '',
  password_confirmation: '',
  first_name: '',
  last_name: '',
})

const isLoading = ref(false)
const isPasswordVisible = ref(false)
const isPasswordConfirmationVisible = ref(false)

const router = useRouter()
const authStore = useAuthStore()
const refForm = ref()

const register = async () => {
  let validation = await refForm?.value?.validate()
  if (!validation.valid) {
    snackbar.value = {
      enabled: true,
      type: 'error',
      message: t('validation.required'),
    }
    return
  }

  if (form.value.password !== form.value.password_confirmation) {
    snackbar.value = {
      enabled: true,
      type: 'error',
      message: t('validation.password_mismatch'),
    }
    return
  }

  isLoading.value = true
  try {
    const response = await authStore.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      password2: form.value.password_confirmation,
      first_name: form.value.first_name,
      last_name: form.value.last_name,
    })

    if (response.status === 201) {
      snackbar.value = {
        enabled: true,
        type: 'success',
        message: t('auth.register.messages.success'),
      }
      setTimeout(() => {
        router.push({ name: 'auth-login' })
      }, 1000)
    } else {
      snackbar.value = {
        enabled: true,
        type: 'error',
        message: response.data?.detail || t('auth.register.messages.error'),
      }
    }
  } catch (e) {
    snackbar.value = {
      enabled: true,
      type: 'error',
      message: e.data?.detail || t('auth.register.messages.error'),
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex justify-center align-center pa-md-4">
    <VSnackbar
      v-model="snackbar.enabled"
      location="bottom end"
      variant="flat"
      transition="scroll-y-reverse-transition"
      :color="snackbar.type"
    >
      {{ snackbar.message }}
    </VSnackbar>
    <div class="position-relative">
      <VCard
        class="auth-card pa-4"
        min-width="448"
        max-width="448"
      >
        <VCardItem class="justify-center">
          <template #prepend>
            <div class="d-flex">
              <VNodeRenderer :nodes="themeConfig.app.logo" />
            </div>
          </template>

          <VCardTitle class="font-weight-bold text-h5 py-1">
            {{ themeConfig.app.title }}
          </VCardTitle>
        </VCardItem>

        <VCardText class="pt-1">
          <h5 class="text-h5 font-weight-semibold mb-1">
            {{ t('auth.register.welcome') }}
          </h5>
          <p class="mb-0">
            {{ t('auth.register.slogan') }}
          </p>
        </VCardText>

        <VCardText>
          <VForm
            ref="refForm"
            @submit.prevent="() => {}"
          >
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.username"
                  :label="t('auth.register.username')"
                  type="text"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.email"
                  :label="t('auth.register.email')"
                  type="email"
                  :rules="[requiredValidator, emailValidator]"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.first_name"
                  :label="t('auth.register.first_name')"
                  type="text"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.last_name"
                  :label="t('auth.register.last_name')"
                  type="text"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  :label="t('auth.register.password')"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :rules="[requiredValidator, passwordValidator]"
                  autocomplete="new-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.password_confirmation"
                  :label="t('auth.register.password_confirmation')"
                  :type="isPasswordConfirmationVisible ? 'text' : 'password'"
                  :rules="[requiredValidator, confirmedValidator(form.password_confirmation, form.password)]"
                  autocomplete="new-password"
                  :append-inner-icon="isPasswordConfirmationVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordConfirmationVisible = !isPasswordConfirmationVisible"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  :loading="isLoading"
                  :disabled="isLoading"
                  block
                  type="submit"
                  @click="register"
                >
                  {{ t('auth.register.register_btn') }}
                </VBtn>
              </VCol>

              <VCol cols="12" class="text-center">
                <RouterLink
                  :to="{ name: 'auth-login' }"
                  class="text-decoration-none"
                >
                  {{ t('auth.register.already_have_account') }}
                </RouterLink>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>

<route lang="yaml">
meta:
  title: Register
</route> 