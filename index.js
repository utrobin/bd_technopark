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

//Forum
const Forum = require('./Forum/Forum');

router.post('/db/api/forum/create', Forum.create);
router.get('/db/api/forum/details', Forum.details);
router.get('/db/api/forum/listPosts', Forum.listPosts);
router.get('/db/api/forum/listThreads', Forum.listThreads);
router.get('/db/api/forum/listUsers', Forum.listUsers);

//Post
const Post = require('./Post/Post');

router.post('/db/api/post/create', Post.create)
router.post('/db/api/post/remove/', Post.remove);
router.post('/db/api/post/restore/', Post.restore);
router.post('/db/api/post/update/', Post.update);
router.post('/db/api/post/vote/', Post.vote);
router.get('/db/api/post/details/', Post.details);
router.get('/db/api/post/list/', Post.list);

app.use(logger());
app.use(koaBody);
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 4000;
app.listen(PORT , () => console.log(`Сервер начал работу ${PORT}`));
