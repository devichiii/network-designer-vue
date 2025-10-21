<template>
  <div class="device-details" v-if="formDevice">
    <h3>
      <i v-if="formDevice.type === 'Router'" class="fa-solid fa-router"></i>
      <i v-else-if="formDevice.type === 'Switch'" class="fa-solid fa-server"></i>
      <i v-else class="fa-solid fa-desktop"></i>
      {{ formDevice.name }} ({{ formDevice.type }})
    </h3>
    <label>
      Имя:
      <input v-model="formDevice.name" />
    </label>
    <label>
      Тип:
      <select v-model="formDevice.type">
        <option value="Router">Router</option>
        <option value="Switch">Switch</option>
        <option value="PC">PC</option>
      </select>
    </label>
    <label>
      IP: <input v-model="formDevice.ip" />
    </label>
    <label>
      MAC: <input v-model="formDevice.mac" />
    </label>
    <p><strong>Позиция:</strong> X: {{ formDevice.x }}, Y: {{ formDevice.y }}</p>

    <div v-if="formDevice.type === 'Switch' || formDevice.type === 'Router'">
      <p><strong>Подключенные устройства ({{ connectedDevices.length }}):</strong></p>
      <ul>
        <li v-for="dev in connectedDevices" :key="dev.id">
          <i v-if="dev.type === 'Router'" class="fa-solid fa-router"></i>
          <i v-else-if="dev.type === 'Switch'" class="fa-solid fa-server"></i>
          <i v-else class="fa-solid fa-desktop"></i>
          {{ dev.name }} ({{ dev.type }})
        </li>
      </ul>
    </div>

    <button @click="save">Сохранить</button>
    <button @click="deleteDevice">Удалить</button>
    <button @click="close">Закрыть</button>
  </div>
</template>

<script setup>
import { ref, watch, defineEmits, defineProps, computed } from 'vue';

const props = defineProps(['device', 'devices', 'connections']);
const emit = defineEmits(['save', 'close', 'delete']);

// Локальная копия для редактирования, чтобы не мутировать props
const formDevice = ref(null);
watch(() => props.device, (val) => {
  if (val) {
    formDevice.value = { ...val };
  } else {
    formDevice.value = null;
  }
}, { immediate: true });

// Список подключённых устройств
const connectedDevices = computed(() => {
  if (!props.device) return [];
  return props.connections
    .filter(c => c.from === props.device.id || c.to === props.device.id)
    .map(c => {
      const connectedId = c.from === props.device.id ? c.to : c.from;
      return props.devices.find(d => d.id === connectedId);
    })
    .filter(Boolean);
});

function save() {
  emit('save', { ...formDevice.value });
}
function close() {
  emit('close');
}
function deleteDevice() {
  emit('delete', props.device.id);
}
</script>

<style scoped>
.device-details {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
label { display: block; margin: 8px 0; }
input, select { margin-left: 8px; }
button { margin-right: 10px; padding: 4px 8px; }
</style>
