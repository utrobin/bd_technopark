const moment = require('moment');
const logger = require('koa-logger');

const mysql = require('../config');

const clear = function *() {
  let connection = yield mysql.getConnection();

  yield connection.query('DELETE FROM Posts;');
  yield connection.query('DELETE FROM Subscriptions;');
  yield connection.query('DELETE FROM Followers;');
  yield connection.query('DELETE FROM Forums;');
  yield connection.query('DELETE FROM Users;');
  yield connection.query('DELETE FROM Threads;');

  this.body = {
    code: 0,
    response: "OK"
  };
};

const status = function *() {
  let connection = yield mysql.getConnection();

  let [countUsers, countThreads, countForums, countPosts] = yield [
    connection.query('SELECT COUNT(id) FROM Users;'),
    connection.query('SELECT COUNT(id) FROM Threads;'),
    connection.query('SELECT COUNT(id) FROM Forums;'),
    connection.query('SELECT COUNT(id) FROM Posts;')
  ];

  this.body = {
    code: 0,
    response: {
      users: countUsers[0]['count(id)'],
      forums: countForums[0]['count(id)'],
      threads: countThreads[0]['count(id)'],
      posts: countPosts[0]['count(id)']
    }
  };
};

module.exports.clear = clear;
module.exports.status = status;
