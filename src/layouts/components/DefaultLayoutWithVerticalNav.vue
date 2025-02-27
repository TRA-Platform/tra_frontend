<script setup>
import navItems from '@/navigation/vertical'
import { useThemeConfig } from '@core/composable/useThemeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavBarI18n from '@/layouts/components/NavBarI18n.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import { isNavLinkActive } from "@layouts/utils"
import { useAuthStore } from "@/stores/useAuthStore"

const authStore = useAuthStore ()

// @layouts plugin
import { VerticalNavLayout } from '@layouts'

const { appRouteTransition, isLessThanOverlayNavBreakpoint } = useThemeConfig()
const { width: windowWidth } = useWindowSize()

let navItemsFiltered = ref([])

watchEffect(
  () => {
    navItemsFiltered.value = navItems.filter (navItem => (
      !navItem.role ||
        (Number.isInteger(navItem.role) && authStore.userData.role >= navItem.role) ||
        (Array.isArray(navItem.role) && navItem.role.includes(authStore.userData.role))
    ),
    )
  },
)
</script>

<template>
  <VerticalNavLayout :nav-items="navItemsFiltered">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          v-if="isLessThanOverlayNavBreakpoint(windowWidth)"
          id="vertical-nav-toggle-btn"
          class="ms-n3"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
          />
        </IconBtn>

        <VSpacer />
        <NavBarI18n />
        <template
          v-if="isNavLinkActive({to: 'auth-login'}, $router) || isNavLinkActive({to: 'auth-register'}, $router)"
        />
        <template v-else-if="!authStore.userData.role">
          <VBtn
            rounded="lg"
            class="mr-4"
            color="primary"
            :to="{ name: 'auth-login' }"
          >
            {{$t('auth.login.login_btn')}}
          </VBtn>
        </template>
        <template v-else>
          <UserProfile />
        </template>
      </div>
    </template>

    <!-- 👉 Pages -->
    <RouterView v-slot="{ Component }">
      <Transition
        :name="appRouteTransition"
        mode="out-in"
      >
        <Component :is="Component" />
      </Transition>
    </RouterView>

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <TheCustomizer />
  </VerticalNavLayout>
</template>
