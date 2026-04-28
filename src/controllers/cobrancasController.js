const db = require('../config/db');
const ExcelJS = require('exceljs');

// POST /cobrancas
exports.criar = async (req, res) => {
  try {
    const { 
      cliente_id, agendamento_id, servico_descricao, 
      servico_valor, peca_descricao, peca_valor, data_servico, tempo_servico
    } = req.body;

    if (!cliente_id || !data_servico) {
      return res.status(400).json({ error: 'Cliente e Data do Serviço são obrigatórios' });
    }

    const sVal = parseFloat(servico_valor) || 0;
    const pVal = parseFloat(peca_valor) || 0;
    
    if (sVal === 0 && pVal === 0) {
      return res.status(400).json({ error: 'Pelo menos o serviço ou a peça deve ter um valor preenchido' });
    }

    const total = sVal + pVal;

    const result = await db.query(
      `INSERT INTO cobrancas 
        (cliente_id, agendamento_id, servico_descricao, servico_valor, peca_descricao, peca_valor, total, status, data_servico, tempo_servico) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        cliente_id, 
        agendamento_id || null, 
        servico_descricao, 
        sVal > 0 ? sVal : null, 
        peca_descricao, 
        pVal > 0 ? pVal : null, 
        total, 
        'pendente',
        data_servico,
        tempo_servico || 90
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar cobrança' });
  }
};

// PATCH /cobrancas/:id/baixa
exports.darBaixa = async (req, res) => {
  try {
    const { id } = req.params;
    
    const check = await db.query("SELECT status FROM cobrancas WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }
    if (check.rows[0].status === 'pago') {
      return res.status(400).json({ error: 'Cobrança já está paga' });
    }

    const result = await db.query(
      "UPDATE cobrancas SET status = 'pago', paid_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao dar baixa na cobrança' });
  }
};

// GET /cobrancas/relatorio?inicio=&fim=&status=
exports.relatorio = async (req, res) => {
  try {
    const { inicio, fim, status } = req.query;
    
    let query = `
      SELECT c.*, cl.nome as cliente_nome 
      FROM cobrancas c 
      JOIN clientes cl ON c.cliente_id = cl.id 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (inicio && fim) {
      query += ` AND c.data_servico BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(inicio, fim);
    }
    
    if (status && status !== 'Todos') {
      query += ` AND c.status = $${paramIndex++}`;
      const dbStatus = status === 'Pendentes' ? 'pendente' : 'pago';
      params.push(dbStatus);
    }

    query += " ORDER BY c.data_servico DESC, c.id DESC";

    const result = await db.query(query, params);
    const cobrancasRows = result.rows;

    const pendenteQuery = await db.query("SELECT SUM(total) as soma FROM cobrancas WHERE status = 'pendente'");
    const recebidaQuery = await db.query("SELECT SUM(total) as soma FROM cobrancas WHERE status = 'pago'");

    res.json({
      cobrancas: cobrancasRows,
      summary: {
        somaPendente: parseFloat(pendenteQuery.rows[0].soma) || 0,
        somaRecebida: parseFloat(recebidaQuery.rows[0].soma) || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// GET /cobrancas
exports.listar = async (req, res) => {
  try {
    const { clienteId } = req.query;
    let query = `
      SELECT c.*, cl.nome as cliente_nome 
      FROM cobrancas c 
      JOIN clientes cl ON c.cliente_id = cl.id
    `;
    const params = [];
    if (clienteId) {
      query += " WHERE c.cliente_id = $1";
      params.push(clienteId);
    }
    query += " ORDER BY c.data_servico DESC, c.id DESC";
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar cobranças' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { servico_descricao, servico_valor, peca_descricao, peca_valor, data_servico, tempo_servico } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID da cobrança é obrigatório' });
    }
    
    const sVal = parseFloat(servico_valor) || 0;
    const pVal = parseFloat(peca_valor) || 0;
    
    if (sVal === 0 && pVal === 0) {
      return res.status(400).json({ error: 'Pelo menos o serviço ou a peça deve ter um valor preenchido' });
    }
    
    const total = sVal + pVal;

    const result = await db.query(
      "UPDATE cobrancas SET servico_descricao = $1, servico_valor = $2, peca_descricao = $3, peca_valor = $4, total = $5, data_servico = $6, tempo_servico = $7 WHERE id = $8 RETURNING *",
      [servico_descricao, sVal > 0 ? sVal : null, peca_descricao, pVal > 0 ? pVal : null, total, data_servico, tempo_servico || 90, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cobrança não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cobrança:', error);
    res.status(500).json({ error: 'Erro ao atualizar cobrança: ' + error.message });
  }
};

exports.darBaixa = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    await db.query(
      "UPDATE cobrancas SET status = 'pago', paid_at = $1 WHERE id = $2",
      [now, id]
    );
    res.json({ message: 'Baixa efetuada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao dar baixa' });
  }
};

exports.deletar = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM cobrancas WHERE id = $1", [id]);
    res.json({ message: 'Cobrança removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover cobrança' });
  }
};

exports.exportarExcel = async (req, res) => {
  try {
    const query = `
      SELECT c.*, cl.nome as cliente_nome 
      FROM cobrancas c 
      JOIN clientes cl ON c.cliente_id = cl.id 
      ORDER BY c.data_servico DESC
    `;
    const result = await db.query(query);
    const cobrancas = result.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Fechamento');

    worksheet.columns = [
      { header: 'Data', key: 'data_servico', width: 15 },
      { header: 'Cliente', key: 'cliente_nome', width: 30 },
      { header: 'Serviço', key: 'servico_descricao', width: 30 },
      { header: 'Valor Serviço', key: 'servico_valor', width: 15 },
      { header: 'Peça', key: 'peca_descricao', width: 30 },
      { header: 'Valor Peça', key: 'peca_valor', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    cobrancas.forEach(c => {
      worksheet.addRow({
        data_servico: c.data_servico,
        cliente_nome: c.cliente_nome,
        servico_descricao: c.servico_descricao,
        servico_valor: parseFloat(c.servico_valor) || 0,
        peca_descricao: c.peca_descricao || '—',
        peca_valor: parseFloat(c.peca_valor) || 0,
        total: parseFloat(c.total) || 0,
        status: c.status.toUpperCase()
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getColumn('servico_valor').numFmt = '"R$ "#,##0.00';
    worksheet.getColumn('peca_valor').numFmt = '"R$ "#,##0.00';
    worksheet.getColumn('total').numFmt = '"R$ "#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Fechamento_Mensal.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar Excel' });
  }
};