<template>
  <div class="sidebar">
    <!-- Панель с категориями -->
    <ul class="sidebar-links">
      <li>
        <router-link to="/home" class="sidebar-link">Главная</router-link>
      </li>
      <li>
        <router-link to="/network" class="sidebar-link">Проектирование</router-link>
      </li>
      <li>
        <router-link to="/docs" class="sidebar-link">Документация</router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "AppSidebar"
};
</script>

<style scoped>
.sidebar {
  width: 200px;
  background-color: #333;
  color: white;
  padding: 20px;
  border-radius: 10px;
}

.sidebar-links {
  list-style: none;
  padding: 0;
}

.sidebar-link {
  color: white;
  text-decoration: none;
  padding: 10px;
  display: block;
  transition: background-color 0.3s ease;
}

.sidebar-link:hover {
  background-color: #444;
}
</style>
