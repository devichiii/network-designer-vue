import { defineStore } from 'pinia';

export const useNetworkStore = defineStore('network', {
  state: () => ({
    networks: [],
    settings: {}, 
    recommendations: [], 
  }),
  actions: {
    async fetchNetworks() {
      // временная заглушка
      this.settings = {
        subnet: '192.168.0.0/24',
        gateway: '192.168.0.1',
        mask: '255.255.255.0',
      };
      this.recommendations = ['Используйте DHCP для автоматической настройки.'];
    },
    async createNetwork(newNetwork) {
      await fetch('http://localhost:3000/api/networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNetwork),
      });
      await this.fetchNetworks();
    },
    async updateNetwork(id, updatedNetwork) {
      await fetch(`http://localhost:3000/api/networks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNetwork),
      });
      await this.fetchNetworks();
    },
    async deleteNetwork(id) {
      await fetch(`http://localhost:3000/api/networks/${id}`, {
        method: 'DELETE',
      });
      await this.fetchNetworks();
    },
  },
});



