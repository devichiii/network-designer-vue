<template>
  <div>
    <NetworkSettingsForm />
    <div class="mt-8 p-4 bg-gray-100 rounded">
      <h3 class="text-lg font-bold mb-2">Текущие настройки:</h3>
      <pre>{{ settings }}</pre>
    </div>

    <div v-if="recommendations.length" class="mt-8 p-4 bg-green-100 rounded">
      <h3 class="text-lg font-bold mb-2">Рекомендации по сети:</h3>
      <ul class="list-disc list-inside">
        <li v-for="(rec, index) in recommendations" :key="index">{{ rec }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { useNetworkStore } from '@/store/network';
import NetworkSettingsForm from '@/components/NetworkSettingsForm.vue';

export default {
  components: {
    NetworkSettingsForm,
  },
  setup() {
    const networkStore = useNetworkStore();
    return {
      settings: networkStore.settings,
      recommendations: networkStore.recommendations,
    };
  },
};
</script>
