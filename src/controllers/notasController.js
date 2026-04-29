const db = require('../config/db');

const listar = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notas ORDER BY fixada DESC, updated_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar notas' });
  }
};

const criar = async (req, res) => {
  try {
    const { titulo, conteudo, cor, fixada, concluida } = req.body;
    const result = await db.query(
      `INSERT INTO notas (titulo, conteudo, cor, fixada, concluida)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [titulo || '', conteudo || '', cor || '#fff9c4', fixada || false, concluida || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar nota' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, conteudo, cor, fixada, concluida } = req.body;
    const result = await db.query(
      `UPDATE notas SET titulo=$1, conteudo=$2, cor=$3, fixada=$4, concluida=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [titulo ?? '', conteudo ?? '', cor ?? '#fff9c4', fixada ?? false, concluida ?? false, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Nota não encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar nota' });
  }
};

const deletar = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM notas WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar nota' });
  }
};

module.exports = { listar, criar, atualizar, deletar };
