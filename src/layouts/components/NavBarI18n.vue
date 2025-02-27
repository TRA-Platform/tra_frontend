<script setup>
import NavBarI18n from '@core/components/I18n.vue'
import { useThemeConfig } from '@core/composable/useThemeConfig'

const { isAppRtl } = useThemeConfig()

const i18nCompLanguages = [
  {
    label: 'English',
    i18nLang: 'en',
  },
  {
    label: 'Russian',
    i18nLang: 'ru',
  },
]

const handleLangChange = lang => {
  isAppRtl.value = lang === 'ar'
  localStorage.setItem ('lang', lang)
}
</script>

<template>
  <NavBarI18n
    :languages="i18nCompLanguages"
    @change="handleLangChange"
  />
</template>
