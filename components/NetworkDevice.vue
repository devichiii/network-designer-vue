<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  id: Number,
  name: String,
  x: Number,
  y: Number,
  selected: Boolean,
  scale: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['device-click', 'update-position']);

let offsetX = 0;
let offsetY = 0;

function handleMouseDown(e) {
  e.stopPropagation();
  // Получаем границы элемента в экранных координатах
  const rect = e.target.getBoundingClientRect();
  // Запоминаем смещение курсора внутри элемента с учётом масштаба
  offsetX = (e.clientX - rect.left) / props.scale;
  offsetY = (e.clientY - rect.top) / props.scale;
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e) {
  // Получаем границы канваса, на котором рисуем
  const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
  // Вычисляем новые координаты внутри канваса, компенсируя масштаб и начальное смещение
  const rawX = (e.clientX - canvasRect.left) / props.scale;
  const rawY = (e.clientY - canvasRect.top) / props.scale;
  const newX = rawX - offsetX;
  const newY = rawY - offsetY;
  emit('update-position', { id: props.id, x: newX, y: newY });
}

function handleMouseUp() {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
}

function handleClick(e) {
  e.stopPropagation();
  emit('device-click', props.id);
}
</script>

<template>
  <div
    class="device"
    :class="{ selected: props.selected }"
    :style="{ left: props.x + 'px', top: props.y + 'px' }"
    @mousedown="handleMouseDown"
    @click="handleClick"
  >
    {{ props.name }}
  </div>
</template>

<style scoped>
.device {
  position: absolute;
  padding: 8px 12px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 6px;
  user-select: none;
  cursor: grab;
}
.device.selected {
  border-color: blue;
}
</style>
