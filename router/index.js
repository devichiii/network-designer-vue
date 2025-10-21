import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import DesignView from '@/views/DesignView.vue';
import DocsView from '../views/DocsView.vue';

const routes = [
  { path: '/home', component: HomeView },
  { path: '/network', component: DesignView },
  { path: '/docs', component: DocsView },
  { path: '/', redirect: '/home' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
