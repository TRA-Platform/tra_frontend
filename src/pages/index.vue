<script setup>
const router = useRouter ()

onMounted (
  () => {
    console.log ('mounted')
  },
)
</script>

<template>
  <div>
    <VCard
      class="mx-auto"
      style="max-width: 400px"
    >
      <VCardTitle>
        <VAvatar
          size="50"
          variant="text"
          color="primary"
          icon="tabler-info-circle"
        />
        {{ $t ('index.under_construction') }}
      </VCardTitle>
    </VCard>
  </div>
</template>
