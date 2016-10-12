const moment = require('moment');
const logger = require('koa-logger');

const mysql = require('../config');

const clear = function *() {
  let connection = yield mysql.getConnection();

  yield connection.query('delete from Posts;');
  yield connection.query('delete from Subscriptions;');
  yield connection.query('delete from Followers;');
  yield connection.query('delete from Forums;');
  yield connection.query('delete from Users;');
  yield connection.query('delete from Threads;');

  this.body = {
    code: 0,
    response: "OK"
  };
};

const status = function *() {
  let connection = yield mysql.getConnection();

  let [countUsers, countThreads, countForums, countPosts] = yield [
    connection.query('select count(id) from Users;'),
    connection.query('select count(id) from Threads;'),
    connection.query('select count(id) from Forums;'),
    connection.query('select count(id) from Posts;')
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
