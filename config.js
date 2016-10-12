let mysql = require('promise-mysql');
let connection;

exports.getConnection = () => {
  return new Promise((resolve, reject) => {
    if (connection) {
      resolve(connection);
    } else {
      mysql
        .createConnection({
          host: 'localhost',
          user: 'root',
          password: '54154167q',
          database: 'bd_tp'
        })
        .then(c => {
          connection = c;
          resolve(c);
        })
        .catch(reject);
    }
  });
};
