const moment = require('moment');
const logger = require('koa-logger');

const mysql = require('../config');

const create = function *() {
  let newUser = this.request.body;

  let connection = yield mysql.getConnection();

  let result = yield connection.query('SELECT name FROM Users WHERE email = ?', [newUser.email]);

  if (result.length !== 0) {
    this.body = {
      code: 5,
      response: {}
    };
  } else {
    yield connection.query('insert into Users (username, about, isAnonymous, name, email) values (?,?,?,?,?);',
      [newUser.username, newUser.about, newUser.isAnonymous, newUser.name, newUser.email]);

    let FROMPost = yield connection.query('SELECT  about, email, id, isAnonymous, name, username FROM ' +
      'Users WHERE email = ?', [newUser.email]);

    this.body = {
      code: 0,
      response: FROMPost[0]
    };
  }
};

const details = function *() {
  let email = this.query.user;

  let connection = yield mysql.getConnection();

  let user = yield connection.query('SELECT * FROM Users WHERE email = ?;', [email]);
  let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [email]);
  let followee = yield  connection.query('SELECT followee FROM Followers WHERE follower = ?;', [email]);
  let subcriptions = yield connection.query('SELECT thread FROM Subscriptions WHERE user = ?;', [email]);

  user[0].followers = [];
  user[0].following = [];
  user[0].subscriptions = [];

  if (follower !== []) {
    follower.forEach((item, i) => {
      user[0].followers[i] = item.follower;
    });
  }
  if (followee !== []) {
    followee.forEach((item, i) => {
      user[0].following[i] = item.followee;
    });
  }
  if (subcriptions !== []) {
    subcriptions.forEach((item, i) => {
      user[0].subscriptions[i] = item.thread;
    });
  }

  this.body = {
    code: 0,
    response: user[0]
  };
};

const follow = function *() {
  let info = this.request.body;

  let connection = yield mysql.getConnection();

  yield connection.query('insert into Followers (followee, follower) values (?,?);', [info.followee, info.follower]);

  let user = yield connection.query('SELECT * FROM Users WHERE email = ?;', [info.follower]);
  let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [info.follower]);
  let followee = yield  connection.query('SELECT followee FROM Followers WHERE follower = ?;', [info.follower]);
  let subcriptions = yield connection.query('SELECT thread FROM Subscriptions WHERE user = ?;', [info.follower]);

  user[0].followers = [];
  user[0].following = [];
  user[0].subscriptions = [];

  follower.forEach((item, i) => {
    user[0].followers[i] = item.follower;
  });

  followee.forEach((item, i) => {
    user[0].following[i] = item.followee;
  });
  subcriptions.forEach((item, i) => {
    user[0].subscriptions[i] = item.thread;
  });

  this.body = {
    code: 0,
    response: user
  };
};

const listFollowers = function *() {
  let { email, order = 'desc', limit = -1, since_id: since = 0} = this.query;

  let connection = yield mysql.getConnection();

  let users;

  if (order === 'desc') {
    if (limit === -1) {
      users = yield connection.query('SELECT follower FROM Followers join Users on Followers.followee = Users.email' +
        'WHERE followee = ? and id > ? order by follower desc;', [email, since]);
    } else {
      users = yield connection.query('SELECT follower FROM Followers join Users on Followers.followee = Users.email' +
        'WHERE followee = ? and id > ? order by follower desc limit ?;', [email, since, +limit]);
    }
  } else {
    if (limit === -1) {
      users = yield connection.query('SELECT follower FROM Followers join Users on Followers.followee = Users.email' +
        'WHERE followee = ? and id > ? order by follower asc;', [email, since]);
    } else {
      users = yield connection.query('SELECT follower FROM Followers join Users on Followers.followee = Users.email' +
        'WHERE followee = ? and id > ? order by follower asc limit ?;', [email, since, +limit]);
    }
  }

  users.forEach((el, i) => {
    let info = yield connection.query('SELECT * FROM Users WHERE email = ?', [users[i].follower]);
    let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [users[i].follower]);
    let followee = yield connection.query('SELECT followee FROM Followers WHERE follower = ?;', [users[i].follower]);
    let subcriptions = yield connection.query('SELECT thread FROM Subscriptions WHERE user = ?;', [users[i].follower]);

    info[0].followers = [];
    info[0].following = [];
    info[0].subscriptions = [];

    follower.forEach((item, i) => {
      info[0].followers[i] = item.follower;
    });
    followee.forEach((item, i) => {
      info[0].following[i] = item.followee;
    });
    subcriptions.forEach((item, i) => {
      info[0].subscriptions[i] = item.thread;
    });

    users[i] = info[0];
  });

  this.body = {
    code: 0,
    response: users
  };
};

const listFollowing = function *() {
  let { email, order = 'desc', limit = -1, since_id: since = 0} = this.query;

  let connection = yield mysql.getConnection();

  let users;

  if (order === 'desc') {
    if (limit === -1) {
      users = yield connection.query('SELECT followee FROM Followers join Users on Followers.follower = Users.email' +
        ' WHERE follower = ? and id > ? order by followee desc;', [email, since]);
    } else {
      users = yield connection.query('SELECT followee FROM Followers join Users on Followers.follower = Users.email' +
        ' WHERE follower = ? and id > ? order by followee desc limit ?;', [email, since, +limit]);
    }
  } else {
    if (limit === -1) {
      users = yield connection.query('SELECT followee FROM Followers join Users on Followers.follower = Users.email' +
        ' WHERE follower = ? and id > ? order by followee asc;', [email, since]);
    } else {
      users = yield connection.query('SELECT followee FROM Followers join Users on Followers.follower = Users.email' +
        ' WHERE follower = ? and id > ? order by followee asc limit ?;', [email, since, +limit]);
    }
  }

  users.forEach((el, i) => {
    let info = yield connection.query('SELECT * FROM Users WHERE email = ?', [users[i].followee]);
    let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [users[i].followee]);
    let followee = yield connection.query('SELECT followee FROM Followers WHERE follower = ?;', [users[i].followee]);
    let subcriptions = yield connection.query('SELECT thread FROM Subscriptions WHERE user = ?;', [users[i].followee]);

    info[0].followers = [];
    info[0].following = [];
    info[0].subscriptions = [];

    follower.forEach((item, i) => {
      info[0].followers[i] = item.follower;
    });
    followee.forEach((item, i) => {
      info[0].following[i] = item.followee;
    });
    subcriptions.forEach((item, i) => {
      info[0].subscriptions[i] = item.thread;
    });

    users[i] = info[0];
  });

  this.body = {
    code: 0,
    response: users
  };
};

const listPosts = function *() {
  let { email, order = 'desc', limit = -1, data = '0000-00-00 00:00:00' } = this.query;

  let connection = yield mysql.getConnection();

  let posts;

  if (limit === -1) {
    posts = yield connection.query('SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited, isHighlighted,' +
      ' isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE user = ? and date >= ?' +
      ' order by date ' + order + ';', [email, data]);
  } else {
    posts = yield connection.query('SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited, isHighlighted,' +
      ' isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE user = ? and date >= ?' +
      ' order by date ' + order + ' limit ?;', [email, data, +limit]);
  }
  
  let newPosts = posts.map((el) => {
    el.date = moment(el.date).format('YYYY-MM-DD HH:mm:ss').toString();
  });

  this.body = {
    code: 0,
    response: newPosts
  };
};

const unfollow = function *() {
  let info = this.request.body;
  
  let connection = yield mysql.getConnection();
  
  yield connection.query('DELETE FROM Followers WHERE followee = ? and follower = ?', [info.followee, info.follower]);
  
  let user = yield connection.query('SELECT * FROM Users WHERE email = ?', [info.follower]);
  let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [info.follower]);
  let followee = yield connection.query('SELECT followee FROM Followers WHERE follower = ?;', [info.follower]);
  let subcriptions = yield connection.query('SELECT thread FROM Subscriptions WHERE user = ?;', [info.follower]);
  
  user[0].followers = [];
  user[0].following = [];
  user[0].subscriptions = [];
  
  follower.forEach((item, i) => {
    user[0].followers[i] = item.follower;
  });
  followee.forEach((item, i) => {
    user[0].following[i] = item.followee;
  });
  subcriptions.forEach((item, i) => {
    user[0].subscriptions[i] = item.thread;
  });
 
  this.body = {
    code: 0,
    response: user[0]
  };
};

const updateProfile = function *() {
  let info = this.request.body;
  
  let connection = yield mysql.getConnection();
  
  yield connection.query('UPDATE Users set about = ? WHERE email = ?', [info.about, info.user]);
  yield connection.query('UPDATE Users set name = ? WHERE email = ?', [info.name, info.user]);
  
  let user = yield connection.query('SELECT * FROM Users WHERE email = ?', [info.user]);
  let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [info.user]);
  let followee = yield connection.query('SELECT followee FROM Followers WHERE follower = ?;', [info.user]);
  let subcriptions = yield connection.query('SELECT thread FROM Subscriptions WHERE user = ?;', [info.user]);
  
  user[0].followers = [];
  user[0].following = [];
  user[0].subscriptions = [];
  
  follower.forEach((item, i) => {
    user[0].followers[i] = item.follower;
  });
  followee.forEach((item, i) => {
    user[0].following[i] = item.followee;
  });
  subcriptions.forEach((item, i) => {
    user[0].subscriptions[i] = item.thread;
  });

  this.body = {
    code: 0,
    response: user[0]
  };
};

module.exports.create = create;
module.exports.details = details;
module.exports.follow = follow;
module.exports.listFollowers = listFollowers;
module.exports.unfollow = unfollow;
module.exports.updateProfile = updateProfile;
module.exports.listPosts = listPosts;
module.exports.listFollowing = listFollowing;
