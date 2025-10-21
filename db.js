const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'network_planner_db'
});

connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения: ' + err.stack);
    return;
  }
  console.log('Подключено к базе данных');
});

module.exports = connection;

const { Sequelize } = require('sequelize');

// Создаем подключение к базе данных
const sequelize = new Sequelize('network_planner_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,  // можно отключить логирование запросов
});

// Проверка соединения
sequelize.authenticate()
  .then(() => console.log('Подключение к базе данных успешно!'))
  .catch(err => console.error('Не удалось подключиться к базе данных:', err));

// Синхронизация моделей с БД
sequelize.sync({ force: false })  // { force: true } создаст заново таблицы, если они есть
  .then(() => console.log('Модели синхронизированы с базой данных'))
  .catch(err => console.error('Ошибка синхронизации:', err));

module.exports = sequelize;

