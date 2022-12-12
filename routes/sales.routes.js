const { Router } = require('express');

const { check } = require('express-validator');

const { getSales, 
        createSale,
        clearSale,
        updateSale  } = require('../controllers/sales.controller');

const {
    validateFields,
    jwtValidate,
    isRole,
} = require('../middlewares');


const router = Router();

router.use( jwtValidate );

router.get('/:term', [
    isRole('ADMIN_ROLE', 'MODERATOR_ROLE'),
    validateFields
], getSales);

router.post('/clear/:email/:something', [
    check('email', 'email is required.').not().isEmpty(),
    validateFields
], clearSale);

router.post('/', [
    validateFields
], createSale);

router.put('/:id', [
    isRole('ADMIN_ROLE', 'MODERATOR_ROLE'),
    check('id', 'id is required.').not().isEmpty(),
    validateFields
], updateSale);

module.exports = router;