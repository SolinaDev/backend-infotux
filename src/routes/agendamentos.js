const express = require('express');
const router = express.Router();
const agendamentosController = require('../controllers/agendamentosController');

router.get('/relatorio', agendamentosController.relatorio);
router.get('/', agendamentosController.listar);
router.post('/', agendamentosController.criar);
router.patch('/:id/status', agendamentosController.atualizarStatus);
router.put('/:id', agendamentosController.atualizar);
router.delete('/:id', agendamentosController.deletar);

module.exports = router;
