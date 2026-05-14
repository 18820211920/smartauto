const express = require('express');
const router = express.Router();
const controller = require('../../controller/sys_tenant.controller');
const { verifyToken, verifyTenant } = require('../../middleware/auth');

router.get('/info', verifyToken, verifyTenant, controller.getInfo);
router.put('/', verifyToken, verifyTenant, controller.update);
router.get('/list', verifyToken, controller.list);
router.post('/', verifyToken, controller.create);
router.post('/freeze', verifyToken, controller.freeze);

module.exports = router;