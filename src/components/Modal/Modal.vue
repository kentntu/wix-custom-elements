<template>
  <transition name="modal" appear>
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all"
      tabindex="0">
      <div class="bg-white shadow-xl max-w-lg w-full p-6 relative" @click.stop>
        <button class="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-lg hover:scale-110 transition-all"
          @click="close" aria-label="Close">
          ✕
        </button>

        <h2 v-if="title" class="text-md text-sm mb-4 pr-10 font-bold">
          {{ title }}
        </h2>

        <slot />
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: String,
})
const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>