const db = require('../config/db');

// POST /agendamentos
exports.criar = async (req, res) => {
  try {
    const { cliente_id, titulo, descricao, status, data_agendada } = req.body;
    if (!cliente_id || !data_agendada) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    const result = await db.query(
      "INSERT INTO agendamentos (cliente_id, titulo, descricao, status, data_agendada) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [cliente_id, titulo, descricao, status || 'agendado', data_agendada]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
};

// GET /agendamentos?clienteId= ou GET /agendamentos
exports.listar = async (req, res) => {
  try {
    const { clienteId } = req.query;
    let query = "SELECT a.*, c.nome as cliente_nome FROM agendamentos a JOIN clientes c ON a.cliente_id = c.id";
    const params = [];
    
    if (clienteId) {
      query += " WHERE a.cliente_id = $1";
      params.push(clienteId);
    }
    
    query += " ORDER BY a.data_agendada ASC";
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
};

// GET /agendamentos/relatorio
exports.relatorio = async (req, res) => {
  try {
    const statusResult = await db.query("SELECT status, count(*) FROM agendamentos GROUP BY status");
    const totalResult = await db.query("SELECT count(*) FROM agendamentos");
    const proximos = await db.query("SELECT a.*, c.nome as cliente_nome FROM agendamentos a JOIN clientes c ON a.cliente_id = c.id WHERE data_agendada >= CURRENT_DATE ORDER BY data_agendada ASC LIMIT 5");
    
    res.json({
      porStatus: statusResult.rows,
      total: parseInt(totalResult.rows[0].count),
      proximos: proximos.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório de agendamentos' });
  }
};

// PATCH /agendamentos/:id/status
exports.atualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Atualizando status:', { id, status });
    
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });
    
    const result = await db.query(
      "UPDATE agendamentos SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    
    console.log('Resultado da atualização:', result);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do agendamento: ' + error.message });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, data_agendada } = req.body;
    
    console.log('Atualizando agendamento:', { id, titulo, descricao, data_agendada, bodyFull: req.body });
    
    if (!id) {
      return res.status(400).json({ error: 'ID do agendamento é obrigatório' });
    }
    
    const result = await db.query(
      "UPDATE agendamentos SET titulo = $1, descricao = $2, data_agendada = $3 WHERE id = $4 RETURNING *",
      [titulo, descricao, data_agendada, id]
    );
    
    console.log('Resultado da atualização:', result);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento: ' + error.message });
  }
};

exports.deletar = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deletando agendamento ID:', id);
    const result = await db.query("DELETE FROM agendamentos WHERE id = $1", [id]);
    console.log('Deletar result:', result);
    res.json({ message: 'Agendamento removido' });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    res.status(500).json({ error: 'Erro ao remover agendamento', details: error.message });
  }
};
