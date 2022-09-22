const { Router } = require('express');

const {
    getNotifications,
    updateNotification } = require('../controllers/notifications.controller');

const {
    validateFields,
    jwtValidate } = require('../middlewares');


const router = Router();

router.get('/', [
    jwtValidate,
    validateFields
], getNotifications);

router.put('/:id', [
    jwtValidate,
    validateFields
], updateNotification)

module.exports = router;