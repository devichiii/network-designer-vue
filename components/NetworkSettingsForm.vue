<template>
  <div>
    <!-- Можно скрыть форму, если она не используется -->
    <div v-if="false">
      <label>Площадь помещения (м²):</label>
      <input type="number" v-model="area" />
      
      <label>Количество пользователей:</label>
      <input type="number" v-model="usersCount" />
    </div>
  </div>
</template>
  
  <script>
  import { useNetworkStore } from '@/store/network';
  import { ref } from 'vue';

  export default {
    setup() {
      const networkStore = useNetworkStore();
      const areaSize = ref('');
      const userCount = ref('');
      const trafficType = ref('');
  
      function submitSettings() {
        networkStore.setSettings({
          areaSize: Number(areaSize.value),
          userCount: Number(userCount.value),
          trafficType: trafficType.value,
        });
        networkStore.generateRecommendations();
        alert('Настройки сохранены!');
      }
  
      return {
        areaSize,
        userCount,
        trafficType,
        submitSettings,
      };
    },
  };
  </script>
  
  <style scoped>
  </style>
  