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

  let [COUNTUsers, COUNTThreads, COUNTForums, COUNTPosts] = yield [
    connection.query('SELECT COUNT(id) FROM Users;'),
    connection.query('SELECT COUNT(id) FROM Threads;'),
    connection.query('SELECT COUNT(id) FROM Forums;'),
    connection.query('SELECT COUNT(id) FROM Posts;')
  ];

  this.body = {
    code: 0,
    response: {
      users: COUNTUsers[0]['COUNT(id)'],
      forums: COUNTForums[0]['COUNT(id)'],
      threads: COUNTThreads[0]['COUNT(id)'],
      posts: COUNTPosts[0]['COUNT(id)']
    }
  };
};

module.exports.clear = clear;
module.exports.status = status;
