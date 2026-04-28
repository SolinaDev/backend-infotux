const express = require('express');
const router = express.Router();
const cobrancasController = require('../controllers/cobrancasController');

router.get('/', cobrancasController.listar);
router.post('/', cobrancasController.criar);
router.get('/relatorio', cobrancasController.relatorio);
router.get('/exportar', cobrancasController.exportarExcel);
router.patch('/:id/baixa', cobrancasController.darBaixa);
router.put('/:id', cobrancasController.atualizar);
router.delete('/:id', cobrancasController.deletar);

module.exports = router;
