// Banco de dados temporário para testes sem PostgreSQL
const memory = {
  clientes: [
    { id: 1, nome: 'Thiago Exemplo', telefone: '(11) 99999-9999', email: 'thiago@exemplo.com' },
    { id: 2, nome: 'Raphael Teste', telefone: '(21) 88888-8888', email: 'raphael@teste.com' }
  ],
  agendamentos: [],
  cobrancas: []
};

module.exports = {
  query: async (text, params) => {
    // Simulação básica de SQL Queries (apenas para manter o front funcionando)
    const lower = text.toLowerCase();
    
    // LOGIN / CONNECT TEST
    if (lower.includes('select now()')) return { rows: [{ now: new Date() }] };

    // CLIENTES
    if (lower.includes('select * from clientes')) {
      if (lower.includes('ilike')) {
        const q = params[0].replace(/%/g, '').toLowerCase();
        return { rows: memory.clientes.filter(c => c.nome.toLowerCase().includes(q)) };
      }
      return { rows: memory.clientes };
    }
    if (lower.includes('insert into clientes')) {
      const novo = { id: Date.now(), nome: params[0], telefone: params[1], email: params[2] };
      memory.clientes.push(novo);
      return { rows: [novo] };
    }

    // AGENDAMENTOS
    if (lower.includes('insert into agendamentos')) {
      const novo = { id: Date.now(), cliente_id: params[0], titulo: params[1], descricao: params[2], status: params[3], data_agendada: params[4] };
      memory.agendamentos.push(novo);
      return { rows: [novo] };
    }
    if (lower.includes('select * from agendamentos')) {
      let rows = memory.agendamentos;
      if (lower.includes('cliente_id =')) {
        rows = rows.filter(a => a.cliente_id == params[0]);
      }
      return { rows };
    }

    // COBRANCAS
    if (lower.includes('insert into cobrancas')) {
      const novo = { 
        id: Date.now(), cliente_id: params[0], agendamento_id: params[1],
        servico_descricao: params[2], servico_valor: params[3],
        peca_descricao: params[4], peca_valor: params[5],
        total: (parseFloat(params[3]) || 0) + (parseFloat(params[5]) || 0),
        data_servico: params[6], status: 'pendente'
      };
      memory.cobrancas.push(novo);
      return { rows: [novo] };
    }
    // DELETE OPERATIONS
    if (lower.includes('delete from')) {
      const table = lower.includes('clientes') ? 'clientes' : lower.includes('agendamentos') ? 'agendamentos' : 'cobrancas';
      const id = params[0];
      memory[table] = memory[table].filter(item => item.id != id);
      return { rows: [] };
    }

    // UPDATE CLIENTES
    if (lower.includes('update clientes')) {
      const id = params[3];
      const index = memory.clientes.findIndex(c => c.id == id);
      if (index !== -1) {
        memory.clientes[index] = { ...memory.clientes[index], nome: params[0], telefone: params[1], email: params[2] };
        return { rows: [memory.clientes[index]] };
      }
    }

    // UPDATE AGENDAMENTOS
    if (lower.includes('update agendamentos')) {
      if (lower.includes('set status')) {
        const id = params[1];
        const index = memory.agendamentos.findIndex(a => a.id == id);
        if (index !== -1) {
          memory.agendamentos[index].status = params[0];
          return { rows: [memory.agendamentos[index]] };
        }
      } else {
        const id = params[3];
        const index = memory.agendamentos.findIndex(a => a.id == id);
        if (index !== -1) {
          memory.agendamentos[index] = { ...memory.agendamentos[index], titulo: params[0], descricao: params[1], data_agendada: params[2] };
          return { rows: [memory.agendamentos[index]] };
        }
      }
    }

    // UPDATE COBRANCAS
    if (lower.includes('update cobrancas')) {
      if (lower.includes('status = \'pago\'')) {
        const id = params[0];
        const cob = memory.cobrancas.find(c => c.id == id);
        if (cob) cob.status = 'pago';
        return { rows: [cob] };
      } else {
        const id = params[6];
        const index = memory.cobrancas.findIndex(c => c.id == id);
        if (index !== -1) {
          memory.cobrancas[index] = { 
            ...memory.cobrancas[index], 
            servico_descricao: params[0], servico_valor: params[1], 
            peca_descricao: params[2], peca_valor: params[3], total: params[4], data_servico: params[5] 
          };
          return { rows: [memory.cobrancas[index]] };
        }
      }
    }

    if (lower.includes('select c.*, cl.nome as cliente_nome from cobrancas')) {
      let rows = memory.cobrancas;
      if (lower.includes('cliente_id =')) {
        rows = rows.filter(c => c.cliente_id == params[0]);
      }
      // Join manual
      const joined = rows.map(c => {
        const cl = memory.clientes.find(cli => cli.id == c.cliente_id);
        return { ...c, cliente_nome: cl ? cl.nome : 'Desconhecido' };
      });
      return { rows: joined };
    }
    
    // DASHBOARD & REPORTS (Simplified)
    if (lower.includes('count(*)')) {
      let count = 0;
      if (lower.includes('cobrancas')) count = memory.cobrancas.length;
      if (lower.includes('agendamentos')) count = memory.agendamentos.length;
      return { rows: [{ count }] };
    }
    if (lower.includes('relatorio')) {
      return { rows: memory.cobrancas, rowCount: memory.cobrancas.length };
    }

    if (lower.includes('sum(total)')) {
      const sum = memory.cobrancas
        .filter(c => c.status === 'pago')
        .reduce((acc, c) => acc + (parseFloat(c.total) || 0), 0);
      return { rows: [{ recebidos: sum }] };
    }

    return { rows: [] };
  }
};
