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
  message: t('auth.login.messages.error'),
})

const form = ref({
  username: '',
  password: '',
  stay_signed: false,
  code: '',
})

const isLoading = ref(false)
const isPasswordVisible = ref(false)

const router = useRouter()
const authStore = useAuthStore()
const refForm = ref()

const login = async () => {
  let validation = await refForm?.value?.validate()
  if (!validation.valid) {
    snackbar.value = {
      enabled: true,
      type: 'error',
      message: t('validation.required'),
    }
    return
  }
  let response
  isLoading.value = true
  try {
    response = await authStore.login(form.value)

    if (!response.data.access) {
      snackbar.value = {
        enabled: true,
        type: 'error',
        message: response.data,
      }
      isLoading.value = false
      return
    }
  } catch (e) {
    snackbar.value = {
      enabled: true,
      type: 'error',
      message: e.data,
    }
    isLoading.value = false
    return
  }
  authStore.authData = {
    ...authStore.authData,
    access: `${response.data.access}`,
    refresh: `${response.data.refresh}`,
  }
  response = await authStore.me({})
  if (response.data.error) {
    snackbar.value = {
      enabled: true,
      type: 'error',
      message: response.data.error,
    }
    isLoading.value = false
    return
  }
  authStore.userData = response.data
  snackbar.value = {
    enabled: true,
    type: 'success',
    message: t('auth.login.messages.success'),
  }
  isLoading.value = false
  setTimeout(
    () => {
      router.push({
        "name": authStore.authData.nextUrl,
        "params": authStore.authData.nextParams,
      })
    },
    1000,
  )
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
            {{ t('auth.login.welcome') }}
          </h5>
          <p class="mb-0">
            {{ t('auth.login.slogan') }}
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
                  :label="t('auth.login.username')"
                  type="text"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  :label="t('auth.login.password')"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :rules="[requiredValidator]"
                  autocomplete="on"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>
              <VCol cols="12">
                <div class="d-flex align-center justify-space-between flex-wrap mt-2 mb-4">
                  <VCheckbox
                    v-model="form.stay_signed"
                    :label="t('auth.login.remember_me')"
                  />
                </div>

                <VBtn
                  :loading="isLoading"
                  :disabled="isLoading"
                  block
                  type="submit"
                  @click="login"
                >
                  {{ t('auth.login.login_btn') }}
                </VBtn>
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
  title: Login
</route>
