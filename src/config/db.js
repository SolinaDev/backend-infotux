require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      descricao TEXT,
      data_agendada TEXT NOT NULL,
      status TEXT DEFAULT 'agendado',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cobrancas (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
      agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
      servico_descricao TEXT,
      servico_valor NUMERIC,
      peca_descricao TEXT,
      peca_valor NUMERIC,
      total NUMERIC NOT NULL,
      status TEXT DEFAULT 'pendente',
      data_servico TEXT NOT NULL,
      tempo_servico INTEGER DEFAULT 90,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ PostgreSQL conectado e tabelas verificadas.');
};

initDB().catch(err => {
  console.error('❌ Erro ao conectar no banco:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
