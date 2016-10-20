const koa = require('koa');
const app = koa();
const router = require('koa-router')();
const route = require('koa-route');
const koaBody = require('koa-body')();
const logger = require('koa-logger');

//Common
const Common = require('./Common/Common');

router.post('/db/api/clear/', Common.clear);
router.get('/db/api/status', Common.status);

//User
const User = require('./User/User');

router.post('/db/api/user/create', User.create);
router.post('/db/api/user/follow', User.follow);
router.post('/db/api/user/unfollow', User.unfollow);
router.post('/db/api/user/updateProfile/', User.updateProfile);
router.get('/db/api/user/listFollowers', User.listFollowers);
router.get('/db/api/user/listFollowing', User.listFollowing);
router.get('/db/api/user/listPosts/', User.listPosts);
router.get('/db/api/user/details/', User.details);

app.use(logger());
app.use(koaBody);
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 4000;
app.listen(PORT , () => console.log(`Сервер начал работу ${PORT}`));
