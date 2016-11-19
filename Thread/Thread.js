const moment = require('moment');
const logger = require('koa-logger');

const mysql = require('../config');

const close = function *() {
  let closeThread = this.request.body;
  
  let connection = yield mysql.getConnection();
  
  yield connection.query('UPDATE Threads SET isClosed = true WHERE id = ?;', [closeThread.thread]);
  
  let fromThread = yield connection.query('SELECT id FROM Threads WHERE id = ?', [closeThread.thread]);
  
  this.body = {
    code: 0,
    response: fromThread[0].id
  };
};

const create = function *() {
  let newThread = this.request.body;
  
  let connection = yield mysql.getConnection();
  
  yield connection.query('insert into Threads (forum, title, isClosed, user, date, message, slug, isDeleted) values (?,?,?,?,?,?,?,?);',
    [newThread.forum, newThread.title, newThread.isClosed, newThread.user, newThread.date,
      newThread.message, newThread.slug, newThread.isDeleted]);
  
  let fromThread = yield connection.query(`SELECT  date, forum, id, isClosed, isDeleted, message, slug,
    title,user FROM Threads WHERE title = ? and date = ? and message = ?`,
    [newThread.title, newThread.date, newThread.message]);
 
  this.body = {
    code: 0,
    response: fromThread[0]
  };
};

const details = function *() {
  let { threadId: thread, related = [] } = this.query;
  
  if (typeof related === 'string') {
    related = related.split(' ');
  }
  
  let connection = yield mysql.getConnection();
  
  let threadInfo = yield connection.query(`SELECT date, dislikes, forum, id, isClosed, isDeleted, likes,
    message, likes - dislikes as points, posts, slug ,title,user FROM Threads WHERE id = ?;`, [threadId]);
  let thread = false;
  
  related.forEach((el) => {
    if (el === 'thread') {
      thread = true;
    }
  }); 
  
  if (threadInfo.length === 0 || thread) {
    this.body = {
      code: 3,
      response: {}
    };
  } else {
    threadInfo[0].date = moment(threadInfo[0].date).format('YYYY-MM-DD HH:mm:ss').toString();

    related.forEach((el) => {
      switch (el) {
        case 'user':
          threadInfo.forEach((el) => {
            userInfo = yield connection.query('SELECT * FROM Users WHERE email = ?;', [el.user]);
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
      response: threadInfo[0]
    };
  }
};

const list = function *() {
  let { since = '0000-00-00 00:00:00', order = 'desc', limit = -1, user = false, forum = false } = this.query;
  let threadInfo = {};
  
  let connection = yield mysql.getConnection();
  
  if (!user) {
    if (limit === -1) {
      threadInfo = yield connection.query(`SELECT date, dislikes, forum, id, 
        isClosed, isDeleted, likes, message, likes - dislikes as 
        points, posts, slug, title, user FROM Threads WHERE forum = ? and date >= ? 
        order by date ${order} ;`, [forum, threadData]);
    } else {
      threadInfo = yield connection.query(`SELECT date, dislikes, forum, id, 
        isClosed, isDeleted, likes, message, likes - dislikes as 
        points, posts, slug , title, user FROM Threads WHERE forum = ? and date >= ? 
        order by date ${order} limit ?;`, [forum, threadData, +limit]);
    }
  } else {
    if (limit === -1) {
      threadInfo = yield connection.query(`SELECT date, dislikes, forum, id, isClosed, isDeleted, likes,
        'message,likes - dislikes as points, posts, slug ,title,user FROM Threads WHERE user = ? and date >= ? 
        'order by date ${order};`, [user, threadData]);
    } else {
      threadInfo = yield connection.query(`SELECT date, dislikes, forum, id, isClosed, isDeleted, likes,
        message,likes - dislikes as points, posts, slug ,title,user FROM Threads WHERE user = ? and date >= ? 
        order by date ${order} limit ?;`, [user, threadData, +limit]);
    }
  }

  threadInfo.forEach((el) => {
    el.date = moment(el.date).format('YYYY-MM-DD HH:mm:ss').toString();
  });
  
  this.body = {
    code: 0,
    response: threadInfo
  };
};

const listPosts = function *() {
  let threadData = this.query.since || '0000-00-00 00:00:00';
  let dateTrue = new Date();
  dateTrue.setFullYear(+threadData.substring(0, 4), +threadData.substring(5, 7), +threadData.substring(8, 10));
  dateTrue.setHours(+threadData.substring(11, 13), +threadData.substring(14, 16), +threadData.substring(17, 19));
  let bufdate = Date.parse(threadData);
  let date = new Date();
  date.setTime(bufdate);
  let order = this.query.order || 'desc';
  let sort = this.query.sort || 'flat';
  let threadId = this.query.thread;
  let limit = this.query.limit || -1;
  let threadInfo;
  let connection = yield mysql.getConnection();
  
  switch (sort) {
    case 'flat' :
      if (limit === -1) {
        threadInfo = yield connection.query('SELECT Posts.date, Posts.dislikes, Posts.forum, Posts.id, Posts.isApproved,' +
          ' Posts.isDeleted, Posts.isEdited, Posts.isHighlighted, Posts.isSpam, Posts.likes, Posts.message, ' +
          'Posts.parent, Posts.likes - Posts.dislikes as points, Posts.thread, Posts.user FROM Posts ' +
          'WHERE thread = ? and date >= ? order by date ' +
          order + ';', [threadId, threadData]);

      } else {
        threadInfo = yield connection.query('SELECT Posts.date, Posts.dislikes, Posts.forum, Posts.id, Posts.isApproved,' +
          ' Posts.isDeleted, Posts.isEdited, Posts.isHighlighted, Posts.isSpam, Posts.likes, Posts.message, ' +
          'Posts.parent, Posts.likes - Posts.dislikes as points, Posts.thread, Posts.user FROM Posts ' +
          'WHERE thread = ? and date >= ? order by date ' +
          order + ' limit ?;', [threadId, threadData, +limit]);
      }
      for (let i = 0; i < threadInfo.length; ++i) {
        threadInfo[i].date = moment(threadInfo[i].date).format('YYYY-MM-DD HH:mm:ss').toString();
      }
      
      this.body = {
        code: 0,
        response: threadInfo
      };
      break;
    case 'tree' :
      if (limit === -1) {
        threadInfo = yield connection.query('SELECT date, dislikes, forum, id, isApproved,' +
          ' isDeleted, isEdited, isHighlighted, isSpam, likes, message, ' +
          'parent, likes - dislikes as points, thread, user FROM Posts WHERE thread = ? and ' +
          'date >= ? order by sorter_date' + order + ', sorter asc;',
          [threadId, threadData]);
      } else {
        threadInfo = yield connection.query('SELECT date, dislikes, forum, id, isApproved,' +
          ' isDeleted, isEdited, isHighlighted, isSpam, likes, message, ' +
          'parent, likes - dislikes as points, thread, user FROM Posts WHERE ' +
          'thread = ? and date >= ? order by sorter_date ' + order + ', sorter asc limit ?;',
          [threadId, threadData, +limit]);
      }
      for (let i = 0; i < threadInfo.length; ++i) {
        threadInfo[i].date = moment(threadInfo[i].date).format('YYYY-MM-DD HH:mm:ss').toString();
      }
      
      this.body = {
        code: 0,
        response: threadInfo
      };
      
      break;
    case 'parent_tree' :
      if (limit === -1) {
        threadInfo = yield connection.query('SELECT P.id, P.message, P.date, P.likes, P.dislikes, (P.likes-P.dislikes) as points, ' +
          'P.isApproved, P.isHighlighted, P.isEdited, P.isSpam, P.isDeleted, P.parent, P.thread, P.user, P.forum from' +
          ' Posts P inner JOIN (SELECT distinct sorter_date FROM Posts WHERE thread = ? order by sorter_date ' + order +
          ', sorter asc) A on P.sorter_date = A.sorter_date WHERE P.date >= ? order by P.sorter_date ' + order +
          ', P.sorter asc;', [threadId, date]);
      } else {
        threadInfo = yield connection.query('SELECT P.id, P.message, P.date, P.likes, P.dislikes, (P.likes-P.dislikes) as points, ' +
          'P.isApproved, P.isHighlighted, P.isEdited, P.isSpam, P.isDeleted, P.parent, P.thread, P.user, P.forum from' +
          ' Posts P inner JOIN (SELECT distinct sorter_date FROM Posts WHERE thread = ? order by sorter_date ' + order +
          ', sorter asc limit ? ) A on P.sorter_date = A.sorter_date WHERE P.date >= ? order by P.sorter_date ' + order +
          ', P.sorter asc;', [threadId, +limit, date]);
      }
      for (let i = 0; i < threadInfo.length; ++i) {
        threadInfo[i].date = moment(threadInfo[i].date).format('YYYY-MM-DD HH:mm:ss').toString();
      }
      
      this.body = {
        code: 0,
        response: threadInfo
      };
      
      break;
  }
};

const open = function *() {
  let idThread = this.request.body;
  let connection = yield mysql.getConnection();
  yield connection.query('UPDATE Threads SET isClosed = ? WHERE id = ?;', [false, idThread.thread]);

  this.body = {
    code: 0,
    response: idThread
  };
};

const remove = function *() {
  let idThread = this.request.body;
  let connection = yield mysql.getConnection();
  yield connection.query('UPDATE Threads SET isDeleted = ? WHERE id = ?;', [true, idThread.thread]);
  yield connection.query('UPDATE Threads SET posts = 0 WHERE id = ?;', [idThread.thread]);
  yield connection.query('UPDATE Posts SET isDeleted = ? WHERE thread = ?;', [true, idThread.thread]);
  
  this.body = {
    code: 0,
    response: idThread
  };
};

const restore = function *() {
  let idThread = this.request.body;
  let connection = yield mysql.getConnection();
  yield connection.query('UPDATE Threads SET isDeleted = ? WHERE id = ?;', [false, idThread.thread]);
  let count = yield connection.query('SELECT count(id) FROM Posts WHERE thread = ?', [idThread.thread]);
  yield connection.query('UPDATE Threads SET posts = ? WHERE id = ?', [count[0]['count(id)'], idThread.thread])
  yield connection.query('UPDATE Posts SET isDeleted = ? WHERE thread = ?;', [false, idThread.thread]);
  
  this.body = {
    code: 0,
    response: idThread
  };
};

const subscribe = function *() {
  let info = this.request.body;
  let connection = yield mysql.getConnection();
  let check = yield connection.query('SELECT * FROM Subscriptions WHERE thread = ? and user = ?', [info.thread, info.user]);
  if (check.length === 0) {
    yield connection.query('insert into Subscriptions (thread,user) values (?,?);', [info.thread, info.user]);
    
    this.body =  {
      code: 0,
      response: info
    };
  } else {
    this.body = {
      code: 5,
      response: {}
    };
  }

};

const unsubscribe = function *() {
  let info = this.request.body;
  let connection = yield mysql.getConnection();
  yield connection.query('delete FROM Subscriptions WHERE thread = ? and user = ?;', [info.thread, info.user]);
  
  this.body = {
    code: 0,
    response: info
  };
};

const UPDATE = function *() {
  let info = this.request.body;
  let connection = yield mysql.getConnection();
  yield connection.query('UPDATE Threads SET message = ? WHERE id = ?;', [info.message, info.thread]);
  yield connection.query('UPDATE Threads SET slug = ? WHERE id = ?;', [info.slug, info.thread]);
  
  this.body = {
    code: 0,
    response: yield connection.query('SELECT date, dislikes, forum, id, isClosed, isDeleted, likes,' +
      'message,likes - dislikes as points, posts, slug ,title,user FROM Threads ' +
      'WHERE id = ?;',
      [info.thread])
  };
};

const vote = function *() {
  let info = this.request.body;
  let connection = yield mysql.getConnection();
  if (info.vote === 1) {
    let likes = yield connection.query('SELECT likes FROM Threads WHERE id = ?;', [info.thread]);
    ++likes[0].likes;
    yield connection.query('UPDATE Threads SET likes = ? WHERE id = ?;', [likes[0].likes, info.thread]);
  } else {
    let dislikes = yield connection.query('SELECT dislikes FROM Threads WHERE id = ?;', [info.thread]);
    ++dislikes[0].dislikes;
    yield connection.query('UPDATE Threads SET dislikes = ? WHERE id = ?;', [dislikes[0].dislikes, info.thread]);
  }
  
  this.body = {
    code: 0,
    response: yield connection.query('SELECT date, dislikes, forum, id, isClosed, isDeleted, likes,' +
      'message,likes - dislikes as points, posts, slug ,title,user FROM Threads ' +
      'WHERE id = ?;', [info.thread])
  };
};

module.exports.create = create;
module.exports.details = details;
module.exports.list = list;
module.exports.close = close;
module.exports.vote = vote;
module.exports.unsubscribe = unsubscribe;
module.exports.listPosts = listPosts;
module.exports.restore = restore;
module.exports.subscribe = subscribe;
module.exports.open = open;
module.exports.remove = remove;
module.exports.UPDATE = update;
