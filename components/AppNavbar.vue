<template>
  <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
    <div class="text-lg">Network Planner</div>
    <div class="space-x-4">
      <router-link to="/home" class="hover:text-gray-400">Главная</router-link>
      <router-link to="/design" class="hover:text-gray-400">Проектирование</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppNavbar',
};
</script>

<style scoped>
</style>
