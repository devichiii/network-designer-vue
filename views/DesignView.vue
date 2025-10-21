<template>
  <div class="design-view">
    <h1>Управление сетями</h1>

    <form @submit.prevent="handleCreate" class="network-form">
    </form>

    <div class="network-tools">
      <NetworkCanvas ref="networkCanvas" :devices="devices" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NetworkCanvas from '@/components/NetworkCanvas.vue';

const newNetwork = ref({ name: '', description: '' });
const devices = ref([]);
const networkCanvas = ref(null);

const handleCreate = async () => {
  if (newNetwork.value.name.trim()) {
    newNetwork.value = { name: '', description: '' };
  }
};
</script>

<style scoped>
.network-tools {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.button-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-bottom: 20px;
}

.tool-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.tool-btn:hover {
  background-color: #45a049;
}
</style>
