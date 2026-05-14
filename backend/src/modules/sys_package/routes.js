const express = require('express');
const router = express.Router();
const controller = require('../../controller/sys_package.controller');

router.get('/list', controller.list);
router.get('/all', controller.all);
router.get('/:id', controller.get);
router.post('/', controller.create);

module.exports = router;