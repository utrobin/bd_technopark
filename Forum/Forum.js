const moment = require('moment');
const logger = require('koa-logger');

const mysql = require('../config');

const create = function *() {
  let newForum = this.request.body;

  let connection = yield mysql.getConnection();

  yield connection.query(
    'INSERT INTO Forums (name, short_name, user) values (?,?,?);',
    [newForum.name, newForum.short_name, newForum.user]
  );

  let fromForum = yield connection.query('select * from Forums where short_name = ?;', [newForum.short_name]);

  this.body = {
    code: 0,
    response: fromForum[0]
  };
};

const details = function *() {
  let { forum, related = '' } = this.query;

  let connection = yield mysql.getConnection();
  let forumId = yield connection.query('select * from Forums WHERE short_name = ?;', [forum]);

  if (related === 'user') {
    let user = yield connection.query('SELECT * FROM Users WHERE email = ?;', [forumId[0].user]);
    let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [forumId[0].user]);
    let followee = yield  connection.query('SELECT followee FROM Followers WHERE follower = ?;', [forumId[0].user]);
    let subcriptions = yield connection.query('SELECT * FROM Subscriptions WHERE user = ?;', [forumId[0].user]);

    follower.forEach((item, i) => {
      user[0].followers[i] = item.follower;
    });
    followee.forEach((item, i) => {
      user[0].following[i] = item.followee;
    });
    subcriptions.forEach((item, i) => {
      user[0].subscriptions[i] = item.thread;
    });
    forumId[0].user = user[0];
  }

  this.body = {
    code: 0,
    response: forumId[0]
  };
};

const listPosts = function *() {
  let { forum, since = '0000-00-00 00:00:00', order = 'desc', limit = -1, related = []} = this.query;

  if (typeof related === 'string') {
    related = related.split();
  }

  let connection = yield mysql.getConnection();
  let threadInfo = {};
  let userInfo = {};
  let forumInfo = {};
  let postInfo;

  if (limit === -1) {
    if (order === 'desc') {
      postInfo = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted,isEdited, isHighlighted, 
        isSpam, likes , message, parent, likes - dislikes as points, thread, user FROM Posts WHERE forum = ?
        and date >= ? ORDER BY date desc ;`, [forum, since]);
    } else {
      postInfo = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted,isEdited, isHighlighted, 
        isSpam, likes , message, parent, likes - dislikes as points, thread, user FROM Posts WHERE forum = ?
        and date >= ? ORDER BY date asc ;`, [forum, since]);
    }
  } else {
    if (order === 'desc') {
      postInfo = yield connection.query('SELECT date, dislikes, forum, id, isApproved, isDeleted,isEdited, isHighlighted, ' +
        'isSpam, likes , message, parent, likes - dislikes as points, thread, user FROM Posts WHERE forum = ?' +
        'and date >= ? ORDER BY date desc limit ?;', [forum, since, +limit]);
    } else {
      postInfo = yield connection.query('SELECT date, dislikes, forum, id, isApproved, isDeleted,isEdited, isHighlighted, ' +
        'isSpam, likes , message, parent, likes - dislikes as points, thread, user FROM Posts WHERE forum = ?' +
        'and date >= ? ORDER BY date asc limit ?;', [forum, since, +limit]);
    }
  }

  postInfo = postInfo.map(() => {
    postInfo[j].date = moment(postInfo[j].date).format('YYYY-MM-DD HH:mm:ss').toString();
  });

  related.forEach((el) => {
    switch (el) {
      case 'thread':
        postInfo.forEach((el) => {
          threadInfo = yield connection.query(`SELECT date, dislikes, forum, id, isClosed, isDeleted, likes, 
            message, likes - dislikes as points, posts, slug, title, user FROM Threads WHERE id = ?;`,
            [el.thread]);

          threadInfo[0].date = moment(threadInfo[0].date).format('YYYY-MM-DD HH:mm:ss').toString();
          el.thread = threadInfo[0];
        });

        break;
      case 'user':
        postInfo.forEach((el) => {
          userInfo = yield connection.query('SELECT * FROM Users WHERE email = ?;', [el.user]);
          el.user = userInfo[0];
        });

        break;
      case 'forum':
        postInfo.forEach((el) => {
          forumInfo = yield connection.query('SELECT * FROM Forums WHERE short_name = ?;', [el.forum]);
          el.forum = forumInfo[0];
        });

        break;
    }
  });

  this.body = {
    code: 0,
    response: postInfo
  };
};

const listThreads = function *() {
  let { forum, since = '0000-00-00 00:00:00', order = 'desc', limit = -1, related = [] } = this.query;

  if (typeof related === 'string') {
    related = [related];
  }

  let connection = yield mysql.getConnection();

  let forumInfo;
  let threadInfo;

  if (limit === -1) {
    threadInfo = yield connection.query(`SELECT date, dislikes, id, isClosed, isDeleted, likes, message, likes - dislikes as points, ' +
      posts, slug, title, forum, user FROM Threads WHERE forum = ?
      and date >= ? order by date ' + order + ';`, [forum, since]);
  } else {
    threadInfo = yield connection.query(`SELECT date, dislikes, id, isClosed, isDeleted, likes, message, likes - dislikes as points, ' +
      posts, slug, title, forum, user FROM Threads WHERE forum = ?'
      and date >= ? order by date ' + order + '  limit ?;`, [forum, since, +limit]);
  }

  for (let k = 0; k < threadInfo.length; ++k) {
    threadInfo[k].date = moment(threadInfo[k].date).format('YYYY-MM-DD HH:mm:ss').toString();
  }

  for (let i = 0; i < related.length; ++i) {}
  related.forEach((el) => {
    switch (el) {
      case 'user':
        threadInfo.forEach((el) => {
          let userInfo = yield connection.query('SELECT * FROM Users WHERE email = ?;', [threadInfo[j].user]);
          let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [userInfo[0].email]);
          let followee = yield  connection.query('SELECT followee FROM Followers WHERE follower = ?;', [userInfo[0].email]);
          let subcriptions = yield connection.query('SELECT thread FROM Subscriptions WHERE user = ?;', [userInfo[0].email]);

          if (follower.length !== 0) {
            follower.forEach(function (item, j) {
              userInfo[0].followers[j] = item.follower;
            });
          } else {
            userInfo[0].followers = [];
          }

          if (followee.length !== 0) {
            followee.forEach(function (item, j) {
              userInfo[0].following[j] = item.followee;
            });
          } else {
            userInfo[0].following = [];
          }

          userInfo[0].subscriptions = [];
          if (subcriptions.length !== 0) {
            subcriptions.forEach(function (item, j) {
              userInfo[0].subscriptions[j] = item.thread;
            });
          }

          el.user = userInfo[0];
        });

        break;
      case 'forum':
        threadInfo.forEach((el) => {
          forumInfo = yield connection.query('SELECT * FROM Forums WHERE short_name = ?;', [el.forum]);
          el.forum = forumInfo[0];
        });

        break;
    }
  });

  this.body = {
    code: 0,
    response: threadInfo
  };
};

const listUsers = function *() {
  let { forum, order = 'desc', limit = -1, since_id = 0} = this.query;

  let connection = yield mysql.getConnection();

  let user;

  if (limit === -1) {
    if (order === 'asc') {
      user = yield connection.query(`SELECT about, email, Users.id, isAnonymous, Users.name, username FROM Users inner join
        Posts on Users.email = Posts.user WHERE forum = ? and Users.id >= ? group by Posts.user order by Users.name asc;`, [forum, since_id]);
    } else {
      user = yield connection.query(`SELECT about, email, Users.id, isAnonymous, Users.name, username FROM Users inner join 
        Posts on Users.email = Posts.user WHERE forum = ? and Users.id >= ? group by Posts.user order by Users.name desc;`, [forum, since_id]);
    }
  } else {
    if (order === 'asc') {
      user = yield connection.query(`SELECT about, email, Users.id, isAnonymous, Users.name, username FROM Users inner join
        Posts on Users.email = Posts.user WHERE forum = ? and Users.id >= ? group by Posts.user order by Users.name asc limit ?;`,
        [forum, since_id, +limit]);
    } else {
      user = yield connection.query(`SELECT about, email, Users.id, isAnonymous, Users.name, username FROM Users inner join
        Posts on Users.email = Posts.user WHERE forum = ? and Users.id >= ? group by Posts.user order by Users.name desc limit ?;`,
        [forum, since_id, +limit]);
    }
  }

  user.forEach((el) => {
    let follower = yield connection.query('SELECT follower FROM Followers WHERE followee = ?;', [user[i].email]);
    let followee = yield  connection.query('SELECT followee FROM Followers WHERE follower = ?;', [user[i].email]);
    let subcriptions = yield connection.query('SELECT thread FROM Subscriptions WHERE user = ?;', [user[i].email]);

    if (follower.length !== 0) {
      follower.forEach((item, i) => {
        el.followers[i] = item.follower;
      });
    } else {
      el.followers = [];
    }

    if (followee.length !== 0) {
      followee.forEach((item, i) => {
        el.following[i] = item.followee;
      });
    } else {
      el.following = [];
    }

    el.subscriptions = [];
    if (subcriptions.length !== 0) {
      subcriptions.forEach((item, i) => {
        el.subscriptions[i] = item.thread;
      });
    }
  });

  this.body = {
    code: 0,
    response: user
  };
};

module.exports.create = create;
module.exports.details = details;
module.exports.listPosts = listPosts;
module.exports.listThreads = listThreads;
module.exports.listUsers = listUsers;
