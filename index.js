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

app.use(logger());
app.use(koaBody);
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 4000;
app.listen(PORT , () => console.log(`Сервер начал работу ${PORT}`));
