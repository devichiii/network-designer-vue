const express = require('express');
const Network = require('../models/network');  // подключаем модель
const router = express.Router();

router.get('/networks', async (req, res) => {
  try {
    const networks = await Network.findAll();
    res.json(networks);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении данных' });
  }
});

router.post('/networks', async (req, res) => {
  const { name, description } = req.body;
  try {
    const newNetwork = await Network.create({ name, description });
    res.status(201).json(newNetwork);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании сети' });
  }
});

router.put('/networks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const network = await Network.findByPk(id);

    if (!network) {
      return res.status(404).json({ message: 'Сеть не найдена' });
    }

    network.name = name;
    network.description = description;
    await network.save();

    res.json(network);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении сети', error });
  }
});

router.delete('/networks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const network = await Network.findByPk(id);

    if (!network) {
      return res.status(404).json({ message: 'Сеть не найдена' });
    }

    await network.destroy();

    res.json({ message: 'Сеть удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении сети', error });
  }
});

module.exports = router;
