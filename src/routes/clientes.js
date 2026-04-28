const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

router.get('/buscar', clientesController.buscar);
router.post('/get-or-create', clientesController.getOrCreate);
router.get('/', clientesController.listar);
router.post('/', clientesController.criar);
router.put('/:id', clientesController.atualizar);
router.delete('/:id', clientesController.deletar);

module.exports = router;
