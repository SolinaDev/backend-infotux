const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notasController');

router.get('/', notasController.listar);
router.post('/', notasController.criar);
router.put('/:id', notasController.atualizar);
router.delete('/:id', notasController.deletar);

module.exports = router;
