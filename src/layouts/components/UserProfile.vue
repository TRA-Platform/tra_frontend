<script setup>
import { useAuthStore } from "@/stores/useAuthStore"
import { resolveRole } from '@/@core/utils/formatters'
import EventBus from "@/services/EventBus"

const authStore = useAuthStore ()
const router = useRouter ()

const logout = () => {
  EventBus.dispatch("logout")
}
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    bordered
    color="success"
  >
    <VBtn
      rounded
      class="cursor-pointer text-lowercase"
      color="primary"
      variant="tonal"
      append-icon="tabler-user"
    >
      {{ authStore.userData.email }}

      <!-- SECTION Menu -->
      <VMenu
        open-on-hover
        activator="parent"
        width="300"
        location="bottom end"
        offset="14px"
        style="z-index: 2002 !important;"
      >
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                  bordered
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VIcon
                      icon="tabler-user"
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold text-wrap">
              {{ authStore.userData.email }}
            </VListItemTitle>
            <VListItemSubtitle>
              <VChip
                label
                v-bind="resolveRole(authStore.userData.role).chip"
                size="small"
              >
                {{ resolveRole (authStore.userData.role).status }}
              </VChip>
            </VListItemSubtitle>
          </VListItem>

          <VDivider class="my-2" />

          <!-- 👉 Profile -->
          <VListItem :to="{ name: 'user'}">
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-user"
                size="22"
              />
            </template>

            <VListItemTitle>{{ $t('navigation.user_info.title') }}</VListItemTitle>
          </VListItem>
          <VListItem
            link
            @click="logout"
          >
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-logout"
                size="22"
              />
            </template>

            <VListItemTitle>{{ $t('navigation.user_info.logout') }}</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VBtn>
  </VBadge>
</template>
