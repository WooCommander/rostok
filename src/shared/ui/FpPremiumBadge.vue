<script setup lang="ts">
// Микро-компонент плашки PRO
interface Props {
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: 'PRO'
})
</script>

<template>
  <span class="fp-premium-badge">
    {{ props.text }}
  </span>
</template>

<style scoped lang="scss">
.fp-premium-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #FFB703, #FB8500);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(251, 133, 0, 0.2);
  vertical-align: middle;
  line-height: 1;
}
</style>
