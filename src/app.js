require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors({
  origin: ['https://www.infotux.com.br']
}));
app.use(express.json());

// ─── Rota de Login ───────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { usuario, senha } = req.body;

  const usuarioCorreto = process.env.ADMIN_USER;
  const senhaCorreta   = process.env.ADMIN_PASS;

  if (!usuarioCorreto || !senhaCorreta) {
    return res.status(500).json({ error: 'Credenciais não configuradas no servidor.' });
  }

  const usuarioOk = usuario === usuarioCorreto;
  const senhaOk = senhaCorreta.startsWith('$2')
    ? await bcrypt.compare(senha, senhaCorreta)
    : senha === senhaCorreta;

  if (!usuarioOk || !senhaOk) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  const token = jwt.sign({ usuario }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// ─── Middleware de autenticação ───────────────────────────────
const autenticar = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  try {
    jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// Routes (protegidas)
app.use('/clientes',     autenticar, require('./routes/clientes'));
app.use('/agendamentos', autenticar, require('./routes/agendamentos'));
app.use('/cobrancas',    autenticar, require('./routes/cobrancas'));

app.get('/dashboard', autenticar, async (req, res) => {
    try {
        const db = require('./config/db');
        const pendingQuery = await db.query("SELECT COUNT(*) as count FROM cobrancas WHERE status = 'pendente'");
        
        // Sum total of cobrancas paid this month
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);
        
        const receivedQuery = await db.query(
            "SELECT SUM(total) as recebidos FROM cobrancas WHERE status = 'pago' AND created_at >= $1",
            [thisMonthStart.toISOString()]
        );

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const agendamentosQuery = await db.query(
            "SELECT COUNT(*) as count FROM agendamentos WHERE data_agendada BETWEEN $1 AND $2",
            [todayStart.toISOString(), todayEnd.toISOString()]
        );

        res.json({
            cobrançasPendentes: parseInt(pendingQuery.rows[0].count) || 0,
            recebidosMes: parseFloat(receivedQuery.rows[0].recebidos) || 0,
            agendamentosHoje: parseInt(agendamentosQuery.rows[0].count) || 0
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
