<template>
  <div
    class="canvas"
    ref="canvas"
    @wheel.prevent="onWheel"
    @mousedown="startPan"
  >
    <!-- Управление -->
    <button class="add-btn" @click="addDevice">Добавить устройство</button>
    <button class="recommend-btn" @click="generateRecommendations">Рекомендации сети</button>
    <button class="floorplan-btn" @click="triggerFileInput">Загрузить план этажа</button>
    <input ref="fileInput" type="file" accept="image/*" @change="onFloorPlanChange" style="display:none;" />
    <button class="floorplan-reset-btn" @click="resetFloorPlan">Сбросить план</button>
    <button class="calibrate-btn" @click="startCalibration">Калибровать масштаб</button>
    <button @click="saveToFile">Сохранить схему</button>
    <input type="file" ref="importFile" style="display:none" @change="importFromFile"/>
    <button @click="() => $refs.importFile.click()">Загрузить схему</button>

    <label class="device-filter" style="position:absolute;top:80px;right:10px;z-index:20;">
      Фильтр устройств:
      <select v-model="deviceFilter">
        <option value="all">Все</option>
        <option value="PC">PC</option>
        <option value="Switch">Switch</option>
        <option value="Router">Router</option>
        <option value="Server">Server</option>
      </select>
    </label>

    <label style="position:absolute;top:50px;right:10px;z-index:20;">
      Масштаб: <input v-model.number="scaleMeters" style="width:40px"/> м/клетка
    </label>

    <!-- Масштабируемая область -->
    <div class="canvas-inner" :style="innerStyle" @click="onCanvasClick">
      <img
        v-if="floorPlanImg"
        :src="floorPlanImg"
        class="floorplan-img"
        alt="План этажа"
      />
      <svg class="svg-overlay" width="100%" height="100%">
        <!-- Существующие соединения -->
        <line
          v-for="(conn, i) in connections"
          :key="i"
          :x1="devices.find(d => d.id === conn.from).x + deviceWidth/2"
          :y1="devices.find(d => d.id === conn.from).y + deviceHeight/2"
          :x2="devices.find(d => d.id === conn.to).x + deviceWidth/2"
          :y2="devices.find(d => d.id === conn.to).y + deviceHeight/2"
          :stroke="badConnections.includes(`${conn.from}-${conn.to}`) ? 'red' : 'black'"
          stroke-width="2"
          @click.stop="removeConnection(i)"
          class="connection-line"
        />
        <!-- Preview линии -->
        <line
          v-if="previewLine !== null && selectedDevice !== null"
          :x1="devices[selectedDevice].x + deviceWidth/2"
          :y1="devices[selectedDevice].y + deviceHeight/2"
          :x2="previewLine.x"
          :y2="previewLine.y"
          stroke="blue"
          stroke-width="2"
        />
        <!-- Линия калибровки -->
      <line
        v-if="calibrationPoints.length === 2"
        :x1="calibrationPoints[0].x"
        :y1="calibrationPoints[0].y"
        :x2="calibrationPoints[1].x"
        :y2="calibrationPoints[1].y"
        stroke="orange"
        stroke-width="3"
        stroke-dasharray="6,4"
      />
      <!-- Маркеры точек -->
      <circle
        v-for="(pt, i) in calibrationPoints"
        :key="i"
        :cx="pt.x"
        :cy="pt.y"
        r="6"
        fill="orange"
      />
      </svg>

      <!-- Ввод длины после выбора двух точек -->
        <div v-if="showCalibrationInput" class="calibration-input">
          <label>
            Введите реальную длину между точками (м):
            <input type="number" v-model.number="calibrationLength" min="0.01" step="any" />
          </label>
          <button @click="confirmCalibration">Применить масштаб</button>
          <button @click="cancelCalibration">Отмена</button>
        </div>


      <!-- Устройства -->
      <NetworkDevice
        v-for="device in filteredDevices"
        :key="device.id"
        :id="device.id"
        :x="device.x"
        :y="device.y"
        :name="device.name"
        :selected="device.id === selectedDevice"
        :scale="scale"
        @device-click="handleDeviceClick"
        @mousedown="startDeviceDrag(device, $event)"
        @dblclick="editDevice(device.id)"
        @save="onDeviceSave"
      />
    </div>

    <!-- Рекомендации -->
    <div v-if="recommendations.length" class="recommendations">
      <h3>Рекомендации:</h3>
      <ul>
        <li v-for="(rec, i) in recommendations" :key="i">{{ rec }}</li>
      </ul>
      <button @click="applyRecommendations">Применить все рекомендации</button>
    </div>

      <DeviceDetails
        :device="selectedDeviceObject"
        :devices="devices"
        :connections="connections"
        @edit="editDevice"
        @save="onDeviceSave"
        @close="selectedDevice = null"
        @update-type="updateDeviceType"
        @delete="onDeviceDelete"
      />

  </div>
</template>

<script>
import DeviceDetails from './DeviceDetails.vue';
import NetworkDevice from './NetworkDevice.vue';

export default {
  components: { NetworkDevice, DeviceDetails },
  data() {
    return {
      gridSize: 20,
      deviceWidth: 100,
      deviceHeight: 40,
      devices: [],
      deviceIdCounter: 0,
      connections: [],
      selectedDevice: null,
      previewLine: null,

      isCalibrating: false,
      calibrationPoints: [],
      calibrationLength: 0,
      showCalibrationInput: false,

      floorPlanImg: null,
      scaleMeters: 1, // по умолчанию 1 клетка = 1 метр

      deviceFilter: 'all',

      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isPanning: false,
      panStart: { x: 0, y: 0 },
      initialOffset: { x: 0, y: 0 },

      recommendations: [],
      draggingDevice: null,
      dragOffset: { x: 0, y: 0 },
    };
  },
  computed: {
    innerStyle() {
      return {
        transform: `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`,
        transformOrigin: '0 0',
      };
    },
    selectedDeviceObject() {
      return this.devices.find(d => d.id === this.selectedDevice);
    },
     validConnections() {
        // Оставляем только те соединения, где оба устройства существуют
        return this.connections.filter(
          c =>
            this.devices.find(d => d.id === c.from && (this.deviceFilter === 'all' || d.type === this.deviceFilter)) &&
            this.devices.find(d => d.id === c.to && (this.deviceFilter === 'all' || d.type === this.deviceFilter))
        );
     },
      badConnections() {
      const масштаб = this.scaleMeters;
      return this.connections
        .filter(conn => {
          const a = this.devices.find(d => d.id === conn.from);
          const b = this.devices.find(d => d.id === conn.to);
          if (!a || !b) return false;
          const dx = (a.x - b.x) * масштаб;
          const dy = (a.y - b.y) * масштаб;
          const meters = Math.sqrt(dx * dx + dy * dy);
          return meters > 90;
        })
        .map(conn => `${conn.from}-${conn.to}`);
    },
      filteredDevices() {
        if (this.deviceFilter === 'all') return this.devices;
        return this.devices.filter(d => d.type === this.deviceFilter);
    },
  },
  methods: {
    startCalibration() {
      this.isCalibrating = true;
      this.calibrationPoints = [];
      this.calibrationLength = 0;
      this.showCalibrationInput = false;
    },
      onCanvasClick(e) {
      if (!this.isCalibrating) return;
      // Определяем координаты относительно canvas
      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.offsetX) / this.scale;
      const y = (e.clientY - rect.top - this.offsetY) / this.scale;
      this.calibrationPoints.push({ x, y });

      if (this.calibrationPoints.length === 2) {
        // После выбора двух точек показываем ввод длины
        this.showCalibrationInput = true;
      }
    },
    confirmCalibration() {
      if (this.calibrationPoints.length !== 2 || !this.calibrationLength) return;

      const [p1, p2] = this.calibrationPoints;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);

      // Новый масштаб: 1 клетка = X метров
      this.scaleMeters = this.calibrationLength / pixelDist;

      // Пересчитываем координаты всех устройств
      this.devices.forEach(device => {
        device.x = device.x * this.scaleMeters;
        device.y = device.y * this.scaleMeters;
      });

      // Пересчитываем соединения
      this.connections.forEach(conn => {
        const a = this.devices.find(d => d.id === conn.from);
        const b = this.devices.find(d => d.id === conn.to);
        if (a && b) {
          const dx = (a.x - b.x) * this.scaleMeters;
          const dy = (a.y - b.y) * this.scaleMeters;
          conn.distance = Math.sqrt(dx * dx + dy * dy);
        }
      });

      // Завершаем калибровку
      this.isCalibrating = false;
      this.showCalibrationInput = false;
      this.calibrationPoints = [];
      this.calibrationLength = 0;
    },
    resetCalibration() {
      this.scaleMeters = 1; // сброс к стандартному масштабу
      this.devices.forEach(device => {
        device.x /= this.scaleMeters; // пересчитываем устройства
        device.y /= this.scaleMeters;
      });
      this.calibrationPoints = [];
      this.calibrationLength = 0;
      this.isCalibrating = false;
      this.showCalibrationInput = false;
    },
    cancelCalibration() {
      this.isCalibrating = false;
      this.showCalibrationInput = false;
      this.calibrationPoints = [];
      this.calibrationLength = 0;
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    onFloorPlanChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.floorPlanImg = evt.target.result;
      };
      reader.readAsDataURL(file);
    },
    resetFloorPlan() {
      this.floorPlanImg = null;
    },
    // Панорамирование
    startPan(e) {
      if (e.button !== 0) return;
      // не начинаем пан, если кликнули по устройству или кнопке
      if (e.target.closest('.device') || e.target.closest('button')) return;

      this.isPanning = true;
      this.panStart = { x: e.clientX, y: e.clientY };
      this.initialOffset = { x: this.offsetX, y: this.offsetY };

      window.addEventListener('mousemove', this.panMove);
      window.addEventListener('mouseup',   this.onPanEnd);
    },
    panMove(e) {
      if (!this.isPanning) return;
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      this.offsetX = this.initialOffset.x + dx;
      this.offsetY = this.initialOffset.y + dy;
    },
    onPanEnd() {
      this.isPanning = false;
      window.removeEventListener('mousemove', this.panMove);
      window.removeEventListener('mouseup',   this.onPanEnd);
    },
    // Завершение любого взаимодействия (перетаскивание устройства или панорамирование)
    endInteraction() {
      this.isPanning = false;
      this.draggingDevice = null;
      this.previewLine = null;

      window.removeEventListener('mousemove', this.panMove);
      window.removeEventListener('mousemove', this.deviceDragMove);
      window.removeEventListener('mouseup', this.endInteraction);
    },
    // Drag устройств
    startDeviceDrag(device, e) {
      if (e.button !== 0) return;
      e.stopPropagation();

      const rect = this.$refs.canvas.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - this.offsetX) / this.scale;
      const rawY = (e.clientY - rect.top - this.offsetY) / this.scale;

      this.draggingDevice = device.id;
      this.dragOffset = { x: rawX - device.x, y: rawY - device.y };

      window.addEventListener('mousemove', this.deviceDragMove);
      window.addEventListener('mouseup', this.endInteraction);
    },
    // Движение устройства за курсором
    deviceDragMove(e) {
      if (this.draggingDevice === null) return;

      const rect = this.$refs.canvas.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - this.offsetX) / this.scale;
      const rawY = (e.clientY - rect.top - this.offsetY) / this.scale;

      const dev = this.devices.find(d => d.id === this.draggingDevice);
      if (dev) {
        dev.x = rawX - this.dragOffset.x;
        dev.y = rawY - this.dragOffset.y;
      }
    },
    // MouseMove на холсте
    onCanvasMouseMove(e) {
          if (this.isPanning || this.draggingDevice !== null) return;
          if (this.selectedDevice === null) return;
          const rect = this.$refs.canvas.getBoundingClientRect();
          const rawX = (e.clientX - rect.left - this.offsetX) / this.scale;
          const rawY = (e.clientY - rect.top - this.offsetY) / this.scale;
          const cx = Math.max(0, Math.min(rawX, rect.width / this.scale));
          const cy = Math.max(0, Math.min(rawY, rect.height / this.scale));
          this.previewLine = {
            x: Math.round(cx / this.gridSize) * this.gridSize,
            y: Math.round(cy / this.gridSize) * this.gridSize
          };
        },

    // Preview линия
    updatePreviewLine(e) {
      if (this.selectedDevice === null) return;
      const rect = this.$refs.canvas.getBoundingClientRect();
      const rawX = (e.clientX - rect.left  - this.offsetX) / this.scale;
      const rawY = (e.clientY - rect.top   - this.offsetY) / this.scale;
      const maxX = rect.width  / this.scale;
      const maxY = rect.height / this.scale;
      const cx   = Math.max(0, Math.min(rawX, maxX));
      const cy   = Math.max(0, Math.min(rawY, maxY));
      this.previewLine = {
        x: Math.round(cx / this.gridSize) * this.gridSize,
        y: Math.round(cy / this.gridSize) * this.gridSize,
      };
    },

    updateDeviceType({ id, type }) {
      const dev = this.devices.find(d => d.id === id);
      if (dev) dev.type = type;
    },

    onDeviceSave(updatedDevice) {
      const i = this.devices.findIndex(d => d.id === updatedDevice.id);
      if (i !== -1) this.devices[i] = { ...updatedDevice };
      this.selectedDevice = null;
    },
    onDeviceDelete(id) {
      this.devices = this.devices.filter(d => d.id !== id);
      this.connections = this.connections.filter(
        c =>
          this.devices.find(d => d.id === c.from) &&
          this.devices.find(d => d.id === c.to)
      );
      this.selectedDevice = null;
    },
    cleanConnections() {
      this.connections = this.connections.filter(
        c =>
          this.devices.find(d => d.id === c.from) &&
          this.devices.find(d => d.id === c.to)
      );
    },
    // Добавление сети в localStorage
    saveScheme() {
      const data = { devices: this.devices, connections: this.connections, deviceIdCounter: this.deviceIdCounter };
      localStorage.setItem('network-scheme', JSON.stringify(data));
    },
    // CRUD сети
    addDevice({ name, type }) {
      this.devices.push({
        id: this.deviceIdCounter++,
        name,
        type,
        x: 150,
        y: 150,
        ip: '',
        mac: '',
      })
    },
    handleDeviceClick(id) {
      if (this.selectedDevice === null) {
        this.selectedDevice = id;
      } else if (this.selectedDevice !== id) {
        // Проверяем наличие уже существующего соединения
        const exists = this.connections.some(c =>
          (c.from === this.selectedDevice && c.to === id) ||
          (c.from === id && c.to === this.selectedDevice)
        );
        if (!exists) {
          this.connections.push({ from: this.selectedDevice, to: id });
        }
        this.selectedDevice = null;
        this.previewLine   = null;
      } else {
        this.selectedDevice = null;
        this.previewLine   = null;
      }
    },
    removeConnection(i) {
      this.connections.splice(i, 1);
    },
    editDevice(id) {
      this.selectedDevice = id;
    },

    // Рекомендации: IP и MST
    generateRecommendations() {
      this.recommendations = [];
      const масштаб = this.scaleMeters || 1;

      // IP-адреса
      let counter = 10, base = '192.168.0.';
      const ipSet = new Set(this.devices.map(d => d.ip).filter(Boolean));
      this.devices.forEach(d => {
        if (!d.ip) {
          while (ipSet.has(base + counter)) counter++;
          d.ip = base + counter++;
          this.recommendations.push(`Назначить ${d.name} IP ${d.ip}`);
        }
      });

      // MST (без изменений)
      const edges = [];
      for (let i = 0; i < this.devices.length; i++) {
        for (let j = i + 1; j < this.devices.length; j++) {
          const a = this.devices[i];
          const b = this.devices[j];
          const dx = (a.x - b.x) * масштаб;
          const dy = (a.y - b.y) * масштаб;
          const meters = Math.sqrt(dx * dx + dy * dy);

          edges.push({ from: a.id, to: b.id, weight: meters });

           if (meters > 90) {
            this.recommendations.push(
              `Длина кабеля между ${a.name} и ${b.name} составляет ${meters.toFixed(1)} м — превышает лимит 90 м!`
            );
          }
        }
      }

    // Рекомендации по длине кабелей
      this.connections.forEach(conn => {
        const a = this.devices.find(d => d.id === conn.from);
        const b = this.devices.find(d => d.id === conn.to);
        if (a && b) {
          const dx = (a.x - b.x) * масштаб;
          const dy = (a.y - b.y) * масштаб;
          const meters = Math.sqrt(dx * dx + dy * dy);
          if (meters > 90) {
            this.recommendations.push(
              `Проведённое соединение между ${a.name} и ${b.name}: длина кабеля ${meters.toFixed(1)} м — превышает лимит 90 м!`
            );
          }
        }
      });

      edges.sort((a,b)=>a.weight-b.weight);
      const parent = {};
      const find   = id => parent[id]===id? id:parent[id]=find(parent[id]);
      const union  = (u,v) => parent[find(u)]=find(v);
      this.devices.forEach(d => parent[d.id]=d.id);
      edges.forEach(e => {
        if(find(e.from)!==find(e.to)) {
          union(e.from,e.to);
          const exists = this.connections.some(c=>
            (c.from===e.from&&c.to===e.to)||(c.from===e.to&&c.to===e.from)
          );
          if(!exists){
            this.recommendations.push(`Рекомендовано соединить ${e.from} ↔ ${e.to}`);
          }
        }
      });

      // Проверка количества устройств на коммутаторах
      this.devices.filter(d => d.type === 'Switch').forEach(switchDevice => {
        const connectedCount = this.connections.filter(c => c.from === switchDevice.id || c.to === switchDevice.id).length;
        if (connectedCount > 24) {
          this.recommendations.push(`У ${switchDevice.name} подключено слишком много устройств (${connectedCount}), рекомендуется до 24.`);
        }
      });

      // ПК должны быть подключены к коммутаторам
      this.devices.filter(d => d.type === 'PC').forEach(pc => {
        const connectedToSwitch = this.connections.some(c => {
          const otherId = c.from === pc.id ? c.to : c.from;
          return this.devices.find(d => d.id === otherId).type === 'Switch';
        });
        if (!connectedToSwitch) {
          this.recommendations.push(`ПК ${pc.name} рекомендуется подключить через коммутатор.`);
        }
      });

      // Проверка дубликатов IP
      const ipCount = {};
      this.devices.forEach(d => {
        if (d.ip) ipCount[d.ip] = (ipCount[d.ip] || 0) + 1;
      });
      Object.entries(ipCount).forEach(([ip, count]) => {
        if (count > 1) this.recommendations.push(`Обнаружен повтор IP ${ip} (${count} устройства).`);
      });
    },
    applyRecommendations() {
      this.recommendations.forEach(r=>{
        if(r.startsWith('Назначить')) return;
        const m = r.match(/(\d+)\s↔\s(\d+)/);
        if(m) this.connections.push({ from:+m[1],to:+m[2] });
      });
      this.recommendations = [];
    },

    // Зум
    onWheel(e) {
      const d = e.deltaY>0? -0.1:0.1;
      this.scale = Math.min(3, Math.max(0.5, this.scale + d));
    },
      saveToFile() {
      const data = {
        devices: this.devices,
        connections: this.connections,
        scaleMeters: this.scaleMeters,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'network-scheme.json';
      link.click();
      URL.revokeObjectURL(url);
    },
    importFromFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const data = JSON.parse(evt.target.result);
          this.devices = data.devices || [];
          this.connections = data.connections || [];
          this.scaleMeters = data.scaleMeters || 1;
        } catch (err) {
          alert('Ошибка загрузки схемы!');
        }
      };
      reader.readAsText(file);
    },
  },

  // Автосохранение
  watch: {
    devices: { handler:'saveScheme', deep:true },
    connections: { handler:'saveScheme', deep:true },
  },
};

</script>

<style scoped>
.calibrate-btn {
  position: absolute;
  top: 10px; right: 615px;
  padding: 6px 12px; border: none; border-radius: 4px;
  color: #fff; background: #f88b07; cursor: pointer; z-index: 5;
}
.calibration-input {
  position: fixed;
  top: 80px;
  right: 40px;
  background: #fffbe9;
  border: 1px solid #bbb;
  border-radius: 8px;
  padding: 16px;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.canvas {
  position: relative;
  width: 130vh;
  height: 80vh; 
  border: 2px solid #aaa;
  background:
    linear-gradient(#ccc 1px, transparent 1px),
    linear-gradient(90deg, #ccc 1px, transparent 1px);
  background-size: 20px 20px; /* Размер клеток для сетки */
  overflow: hidden;
  cursor: grab;
  box-sizing: border-box;
}
.canvas-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: 0 0; 
}
.svg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; 
}
.connection-line {pointer-events:all;cursor:pointer;}
.add-btn, .recommend-btn {
  position:absolute;top:10px;
  padding:6px 12px;border:none;border-radius:4px;
  color:#fff;cursor:pointer;z-index:5;
}
.add-btn       {right:5px;background:#4caf50;}
.recommend-btn {right:170px;background:#2196f3;}
.recommendations {
  position:absolute;bottom:10px;left:10px;
  background:rgba(255,255,255,0.9);
  padding:10px;border-radius:6px;
  max-height:200px;overflow-y:auto;z-index:5;
}

.floorplan-img {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: contain;
  z-index: 0;
  pointer-events: none;
}
.floorplan-btn {
  position: absolute;
  top: 10px; right: 325px;
  padding: 6px 12px; border: none; border-radius: 4px;
  color: #fff; background: #b48820; cursor: pointer; z-index: 5;
}
.floorplan-reset-btn {
  position: absolute;
  top: 10px; right: 490px;
  padding: 6px 12px; border: none; border-radius: 4px;
  color: #fff; background: #b23b3b; cursor: pointer; z-index: 5;
}
.add-btn, .recommend-btn, .floorplan-btn, .floorplan-reset-btn, .calibrate-btn {
  z-index: 20;
}

</style>
