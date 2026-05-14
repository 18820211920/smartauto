const express = require('express');
const router = express.Router();
const controller = require('../../controller/sys_user.controller');
const { verifyToken, verifyTenant } = require('../../middleware/auth');

router.post('/login', controller.login);
router.get('/list', verifyToken, verifyTenant, controller.list);
router.get('/count', verifyToken, verifyTenant, controller.count);
router.post('/', verifyToken, verifyTenant, controller.create);
router.get('/info', verifyToken, verifyTenant, controller.getInfo);
router.put('/password', verifyToken, controller.changePwd);
router.post('/:id/freeze', verifyToken, verifyTenant, controller.freeze);

module.exports = router;