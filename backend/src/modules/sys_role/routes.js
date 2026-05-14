const express = require('express');
const router = express.Router();
const controller = require('../../controller/sys_role.controller');
const { verifyToken } = require('../../middleware/auth');

router.get('/list', verifyToken, controller.list);
router.get('/:roleId/permissions', verifyToken, controller.permissions);
router.get('/:roleId/data-scope', verifyToken, controller.dataScope);

module.exports = router;