const moment = require('moment');
const logger = require('koa-logger');

const mysql = require('../config');

const create = function *() {
  let newPost = this.request.body;
  let connection = yield mysql.getConnection();

  yield connection.query(`INSERT into Posts (isApproved, user, date, message, isSpam, isHighlighted, thread, forum,
    isDeleted, isEdited, parent) values (?,?,?,?,?,?,?,?,?,?,?);`,
    [newPost.isApproved, newPost.user, newPost.date, newPost.message, newPost.isSpam,
      newPost.isHighlighted, newPost.thread, newPost.forum,
      newPost.isDeleted, newPost.isEdited, newPost.parent]);

  let id = yield connection.query(
    'SELECT id FROM Posts WHERE user = ? and thread = ? and forum = ? and message = ? and date = ?',
    [newPost.user, newPost.thread, newPost.forum, newPost.message, newPost.date]
  );

  let sorter = '';
  let sorter_date = '';
  let sort;

  if (newPost.parent > 0) {
    sort = yield connection.query('SELECT sorter FROM Posts WHERE id = ?;', [newPost.parent]);
    sorter = sort[0].sorter + '.';

    let num = sorter.indexOf('.');
    sorter_date = sorter.slice(0, num);
  } else {
    sorter_date = '00' + id[0].id;
  }

  let buffer = '' + id[0].id;
  let nu = '';
  for (let i = 0; i < 6 - buffer.length; ++i) {
    nu = nu + '0';
  }

  yield connection.query('update Posts set sorter = ?, sorter_date = ? WHERE id = ?',
    [sorter + nu + id[0].id, sorter_date, id[0].id]);

  let numOfPost = yield connection.query('SELECT posts FROM Threads WHERE id = ?', newPost.thread);
  ++numOfPost[0].posts;

  yield connection.query('update Threads set posts = ? WHERE id = ?;', [numOfPost[0].posts, newPost.thread]);

  const responce = yield connection.query('SELECT date, forum,	id,	isApproved, isDeleted, isEdited, isHighlighted, ' +
    'isSpam, message, parent, thread, user FROM Posts WHERE message = ? and date = ?', [newPost.message, newPost.date]);

  this.body = {
    code: 0,
    response: responce
  };
};

const details = function *() {
  let { post, related = []} = this.query;
  
  if (typeof related === 'string') {
    related = related.split();
  }
  
  if (post <= 0) {
    this.body = {
      code: 1,
      response: {}
    };
  } else {
    let connection = yield mysql.getConnection();
    
    let post = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited,
      isHighlighted, isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE id = ?`, [post]);
    post[0].date = moment(post[0].date).format('YYYY-MM-DD HH:mm:ss').toString();

    related.forEach((el) => {
      switch (el) {
        case 'thread':
          threadInfo = yield connection.query(`SELECT date, dislikes, forum, id, isClosed, isDeleted, likes, 
            message, likes - dislikes as points, posts, slug, title, user FROM Threads WHERE id = ?;`,
            [post[0].thread]);
          threadInfo[0].date = moment(threadInfo[0].date).format('YYYY-MM-DD HH:mm:ss').toString();
          post[0].thread = threadInfo[0];

          break;
        case 'user':
          userInfo = yield connection.query('SELECT * FROM Users WHERE email = ?;', [post[0].user]);
          post[0].user = userInfo[0];

          break;
        case 'forum':
          forumInfo = yield connection.query('SELECT * FROM Forums WHERE short_name = ?;', [post[0].forum]);
          post[0].forum = forumInfo[0];

          break;
      }
    });
    
    this.body = {
      code: 0,
      response: post[0]
    };
  }
};

const list = function *() {
  let { forum = '', thread = '', sort = 'desc', limit = -1, since = '0000-00-00 00:00:00' } = this.query;

  let connection = yield mysql.getConnection();

  let postList = {};

  if (thread === '') {
    if (limit === -1) {
      postList = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited,
        isHighlighted, isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts where
        forum = ? and date >= ? order by date  ${sort};`, [forum, since]);
    } else {
      postList = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited, 
        isHighlighted, isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE 
        forum = ? and date >= ? order by date ${sort} limit ?;`, [forum, since, +limit]);
    }
  } else {
    if (limit === -1) {
      postList = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited, 
        isHighlighted, isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE 
        thread = ? and date >= ? order by date ${sort};`, [thread, since]);
    } else {
      postList = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited, 
        isHighlighted, isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE 
        thread = ? and date >= ? order by date ${sort} limit ?;`, [thread, since, +limit]);
    }
  }

  postList.forEach((el, i) => {
    el.date = moment(postList[i].date).format('YYYY-MM-DD HH:mm:ss').toString();
  });


  this.body = {
    code: 0,
    response: postList
  };
};

const remove = function *() {
  let post = this.request.body;

  let connection = yield mysql.getConnection();

  yield connection.query('update Posts set isDeleted = ? WHERE id = ?;', [true, post.post]);

  let thread = yield connection.query('SELECT thread FROM Posts WHERE id = ?', [post.post]);

  let numOfPost = yield connection.query('SELECT posts FROM Threads WHERE id = ?', [thread[0].thread]);
  --numOfPost[0].posts;

  yield connection.query('update Threads set posts = ? WHERE id = ?;', [numOfPost[0].posts, thread[0].thread]);

  this.body = {
      code: 0,
      response: post
  };
};

const restore = function *() {
  let post = this.request.body;

  let connection = yield mysql.getConnection();

  yield connection.query('update Posts set isDeleted = ? WHERE id = ?;', [false, post.post]);

  let thread = yield connection.query('SELECT thread FROM Posts WHERE id = ?', [post.post]);

  let numOfPost = yield connection.query('SELECT posts FROM Threads WHERE id = ?', [thread[0].thread]);

  ++numOfPost[0].posts;

  yield connection.query('update Threads set posts = ? WHERE id = ?;', [numOfPost[0].posts, thread[0].thread]);

  this.body = {
    code: 0,
    response: post
  };
};

const update = function *() {
  let post = this.request.body;

  let connection = yield mysql.getConnection();

  yield connection.query('update Posts set message = ? WHERE id = ?', [post.message, post.post]);

  let postInfo = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited, 
    isHighlighted, isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE id = ?`,
    [post.post]);

  this.body = {
    code: 0,
    response: postInfo
  };
};

const vote = function *() {
  let info = this.request.body;

  let connection = yield mysql.getConnection();
  
  let code, response;
  if (info.vote === 1) {
    let likes = yield connection.query('SELECT likes FROM Posts WHERE id = ?;', [info.post]);
    
    if (likes.length === 0) {
      code = 1;
      response = {};
    } else {
      ++likes[0].likes;
      yield connection.query('update Posts set likes = ? WHERE id = ?;', [likes[0].likes, info.post]);
      code = 0;
      response = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited, isHighlighted
        isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE id = ?;`,
        [info.post]);
    }
  } else {
    let dislikes = yield connection.query('SELECT dislikes FROM Posts WHERE id = ?;', [info.post]);
    
    if (dislikes.length === 0) {
      code = 1;
      response = {};
    } else {
      ++dislikes[0].dislikes;
      yield connection.query('update Posts set dislikes = ? WHERE id = ?;', [dislikes[0].dislikes, info.post]);
      code = 0;
      response = yield connection.query(`SELECT date, dislikes, forum, id, isApproved, isDeleted, isEdited, isHighlighted
        isSpam, likes, message, parent, likes - dislikes as points, thread, user FROM Posts WHERE id = ?;`, [info.post]);
    }
  }

  this.body = {
    code: code,
    response: response
  };
};

module.exports.create = create;
module.exports.details = details;
module.exports.list = list;
module.exports.remove = remove;
module.exports.restore = restore;
module.exports.update = update;
module.exports.vote = vote;
