<template>
  <div id="app" class="flex min-h-screen bg-gray-900">
    <!-- Боковая панель -->
    <AppSidebar />
    
    <div class="flex-1 flex flex-col ml-60"> <!-- Отступ для боковой панели -->
      <!-- Основной контент -->
      <router-view class="flex-1 p-4" />
    </div>
  </div>
</template>

<script>
import AppSidebar from './components/AppSidebar.vue'; 
export default {
  components: {
    AppSidebar,
  },
};
</script>

<style scoped>
#app {
  font-family: 'Inter', sans-serif;
  display: flex;
  height: 100vh;
}

.flex-1 {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.ml-60 {
  margin-left: 240px; /* Отступ для боковой панели */
}
</style>
