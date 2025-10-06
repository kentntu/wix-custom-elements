<template>
  <div>
    <label for="first_name" :class="['block mb-2 text-sm font-medium text-color', required ? 'required-after' : '']">{{ label }}</label>
    <input v-bind="attrs" type="text" :value="modelValue" @change="onChange" @input="$emit('update:modelValue', $event.target.value)"
      :class="['custom-input bg-gray-50 border border-gray-300 text-gray-900 text-sm block w-full p-2.5', isError ? 'border-red-500 ring-red-200' : '']"
      placeholder="" required />
    <p v-if="isError" class="text-red-500 text-sm mt-1">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
const attrs = useAttrs()

const props = defineProps({
  modelValue: String,
  label: String,
  required: Boolean,
  errorMessage: String,
  error: Boolean
})

const emit = defineEmits(['update:modelValue', 'change', 'input'])

const isError = computed(() => {
  return props.errorMessage && props.errorMessage.length > 0
})

function onChange(event) {
  emit('update:modelValue', event.target.value)
  emit('change', event)
}
</script>