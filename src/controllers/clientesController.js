const db = require('../config/db');

// GET /clientes/buscar?q=
exports.buscar = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const result = await db.query(
      "SELECT * FROM clientes WHERE nome ILIKE $1 ORDER BY nome LIMIT 10",
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
};

// POST /clientes
exports.criar = async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    const result = await db.query(
      "INSERT INTO clientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING *",
      [nome, telefone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};

// GET /clientes
exports.listar = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM clientes ORDER BY nome");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
};

// POST /clientes/get-or-create
exports.getOrCreate = async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    
    // Check if exists
    const check = await db.query("SELECT * FROM clientes WHERE nome ILIKE $1", [nome]);
    if (check.rows.length > 0) {
      return res.json({ client: check.rows[0], created: false });
    }
    
    // Create if not
    const result = await db.query(
      "INSERT INTO clientes (nome) VALUES ($1) RETURNING *",
      [nome]
    );
    res.status(201).json({ client: result.rows[0], created: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar get-or-create' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, email } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do cliente é obrigatório' });
    }
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    const result = await db.query(
      "UPDATE clientes SET nome = $1, telefone = $2, email = $3 WHERE id = $4 RETURNING *",
      [nome, telefone, email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente: ' + error.message });
  }
};

exports.deletar = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM clientes WHERE id = $1", [id]);
    res.json({ message: 'Cliente removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover cliente' });
  }
};
