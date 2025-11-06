const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');

const app = express();

/* =================== BANCO DE DADOS =================== */
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Alunos',
  password: '1903',
  port: 5432,
});

/* =================== MIDDLEWARES =================== */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'gremio1903',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // mudar para true em produção (HTTPS)
}));

// Servir arquivos estáticos
app.use(express.static(__dirname));

/* =================== FUNÇÕES DE APOIO =================== */
async function userByEmail(email) {
  const tabelas = [
    { nome: 'Professores', funcao: 'professor', id: 'id_professor' },
    { nome: 'Alunos', funcao: 'aluno', id: 'id_aluno' },
    { nome: 'Responsaveis', funcao: 'responsavel', id: 'id_responsavel' },
    { nome: 'Coordenacao', funcao: 'coordenacao', id: 'id_coordenacao' }
  ];
  for (const tabela of tabelas) {
    const result = await pool.query(`SELECT * FROM ${tabela.nome} WHERE email = $1`, [email]);
    if (result.rows.length > 0) {
      return { user: result.rows[0], tabela };
    }
  }
  return null;
}

// Função para calcular média e desvio padrão
function calcularEstatisticas(notas) {
    if (!notas || notas.length === 0) {
        return { media: 0, desvioPadrao: 0 };
    }
    const n = notas.length;
    // Converte todas as notas para número
    const notasNumericas = notas.map(Number);
    // Calcula a média
    const media = notasNumericas.reduce((a, b) => a + b, 0) / n;
    // Calcula a variância da amostra (n-1 no denominador)
    const variancia = notasNumericas.reduce((a, b) => a + Math.pow(b - media, 2), 0) / (n > 1 ? n - 1 : 1);
    // Calcula o desvio padrão
    const desvioPadrao = Math.sqrt(variancia);
    return { media: parseFloat(media.toFixed(2)), desvioPadrao: parseFloat(desvioPadrao.toFixed(2)) };
}

/* =================== PÁGINA INICIAL =================== */
app.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login.html');
  }

  switch (req.session.funcao) {
    case 'coordenacao': return res.redirect('/indexCoordenador.html');
    case 'professor': return res.redirect('/indexProfessor.html');
    case 'aluno': return res.redirect('/indexAluno.html');
    case 'responsavel': return res.redirect('/indexResponsavel.html');
    default: return res.send(`<h1>Bem-vindo, ${req.session.email}!</h1><a href="/logout">Sair</a>`);
  }
});

/* =================== LOGIN =================== */
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await userByEmail(email);
    if (!result) return res.status(401).json({ message: 'Usuário ou senha inválidos' });

    const { user, tabela } = result;
    const validPassword = await bcrypt.compare(password, user.senha);

    if (!validPassword) return res.status(401).json({ message: 'Usuário ou senha inválidos' });

    req.session.userId = user[tabela.id];
    req.session.email = user.email;
    req.session.funcao = tabela.funcao;
    req.session.nome = user.nome;

    return res.status(200).json({ 
      message: 'Login bem-sucedido',
      funcao: tabela.funcao,
      id: req.session.userId 
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

/* =================== REGISTRO =================== */
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/register', async (req, res) => {
  const { email, password, nome, funcao, id_turma, codigo, id_disciplina, id_turmas } = req.body;

  try {
    const funcoesValidas = ['aluno', 'professor', 'coordenacao', 'responsavel'];
    if (!funcoesValidas.includes(funcao)) {
      return res.status(400).json({ message: 'Função inválida.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    switch (funcao) {
      // ============================================
      // ALUNO
      // ============================================
      case 'aluno': {
        if (!id_turma) return res.status(400).json({ message: 'Turma é obrigatória para alunos.' });

        // Criar aluno
        const alunoRes = await pool.query(
          `INSERT INTO Alunos (nome, email, senha, id_turma)
           VALUES ($1, $2, $3, $4) RETURNING id_aluno`,
          [nome, email, hashedPassword, id_turma]
        );
        const alunoId = alunoRes.rows[0].id_aluno;

        // Buscar todas as disciplinas associadas à turma
        const turmaDisciplinas = await pool.query(
          'SELECT td.id, td.id_disciplina FROM Turmas_Disciplinas td WHERE td.id_turma = $1',
          [id_turma]
        );

        // Criar notas em branco para cada disciplina da turma e para cada trimestre (1, 2, 3)
        for (const td of turmaDisciplinas.rows) {
          for (let trimestre = 1; trimestre <= 3; trimestre++) {
            await pool.query(
              'INSERT INTO Notas (id_aluno, id_turma_disciplina, id_disciplina, trimestre) VALUES ($1, $2, $3, $4)',
              [alunoId, td.id, td.id_disciplina, trimestre]
            );
          }
        }

        break;
      }

      // ============================================
      // PROFESSOR
      // ============================================
      case 'professor': {
        const profRes = await pool.query(
          `INSERT INTO Professores (nome, email, senha)
           VALUES ($1, $2, $3) RETURNING id_professor`,
          [nome, email, hashedPassword]
        );
        const id_professor = profRes.rows[0].id_professor;

        // Vincular professor a disciplina e turmas
        if (id_disciplina && Array.isArray(id_turmas)) {
          for (const turma of id_turmas) {
            await pool.query(
              `INSERT INTO Professores_Disciplinas_Turmas (id_professor, id_disciplina, id_turma)
               VALUES ($1, $2, $3)`,
              [id_professor, id_disciplina, turma]
            );
          }
        }
        break;
      }

      // ============================================
      // RESPONSÁVEL
      // ============================================
      case 'responsavel':
        await pool.query(
          `INSERT INTO Responsaveis (nome, email, senha)
           VALUES ($1, $2, $3)`,
          [nome, email, hashedPassword]
        );
        break;

      // ============================================
      // COORDENAÇÃO
      // ============================================
      case 'coordenacao':
        await pool.query(
          `INSERT INTO Coordenacao (nome, email, senha, codigo)
           VALUES ($1, $2, $3, $4)`,
          [nome, email, hashedPassword, codigo || null]
        );
        break;
    }

    res.status(200).json({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error('❌ Erro no registro:', err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Este email já está cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
});


/* =================== BOLETIM DO ALUNO (COM FILTRO DE TRIMESTRE) =================== */
app.get('/api/boletim', async (req, res) => {
  if (req.session.funcao !== 'aluno') {
    return res.status(403).json({ message: 'Apenas alunos podem ver o boletim.' });
  }
  
  const alunoId = req.session.userId;
  const { trimestre } = req.query; // Recebe o trimestre da query string
  const trimestreFiltro = trimestre ? parseInt(trimestre) : 1; // Default: 1º trimestre

  try {
    const aluno = await pool.query(
      `SELECT nome, id_aluno, id_turma FROM Alunos WHERE id_aluno = $1`,
      [alunoId]
    );
    if (aluno.rows.length === 0) return res.status(404).json({ message: 'Aluno não encontrado.' });

    const turma = await pool.query(
      `SELECT ano, serie FROM Turmas WHERE id_turma = $1`,
      [aluno.rows[0].id_turma]
    );

    const notas = await pool.query(
      `SELECT d.nome AS materia, n.i1, n.i2, n.epa, n.n2, n.n3, n.rec, n.faltas, n.trimestre
       FROM Notas n
       JOIN Disciplinas d ON n.id_disciplina = d.id_disciplina
       WHERE n.id_aluno = $1 AND n.trimestre = $2
       ORDER BY d.nome`,
      [alunoId, trimestreFiltro]
    );

    res.json({
      nome: aluno.rows[0].nome,
      turma: turma.rows[0] ? `${turma.rows[0].ano}º ${turma.rows[0].serie}` : '',
      id_aluno: aluno.rows[0].id_aluno,
      trimestre: trimestreFiltro,
      notas: notas.rows
    });
  } catch (err) {
    console.error("Erro no /api/boletim:", err);
    res.status(500).json({ message: 'Erro ao buscar boletim.' });
  }
});

/* =================== Criar Turmas =================== */
app.post('/api/turmas', async (req, res) => {
  const { ano, serie, disciplinas } = req.body;

  if (!ano || !serie || !Array.isArray(disciplinas) || disciplinas.length === 0) {
    return res.status(400).json({ message: 'Ano, série e pelo menos uma disciplina são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Criar turma
    const turmaRes = await client.query(
      `INSERT INTO Turmas (ano, serie) VALUES ($1, $2) RETURNING id_turma`,
      [ano, serie]
    );
    const id_turma = turmaRes.rows[0].id_turma;

    // Vincular disciplinas
    for (const id_disciplina of disciplinas) {
      await client.query(
        `INSERT INTO Turmas_Disciplinas (id_turma, id_disciplina) VALUES ($1, $2)`,
        [id_turma, id_disciplina]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Turma criada com sucesso!', id_turma });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Erro ao criar turma:", err);
    res.status(500).json({ message: 'Erro ao criar turma.' });
  } finally {
    client.release();
  }
});

/* =================== PROFESSOR - BUSCAR ALUNOS (COM FILTRO DE TRIMESTRE) =================== */
app.get('/api/professor/alunos', async (req, res) => {
  if (req.session.funcao !== 'professor') {
    return res.status(403).json({ message: 'Apenas professores podem acessar.' });
  }

  const { id_turma, trimestre } = req.query;
  if (!id_turma) return res.status(400).json({ message: 'Turma obrigatória.' });
  
  const trimestreFiltro = trimestre ? parseInt(trimestre) : 1; // Default: 1º trimestre

  try {
    // Pegar a disciplina do professor
    const disciplinaRes = await pool.query(
      `SELECT id_disciplina 
       FROM Professores_Disciplinas_Turmas
       WHERE id_professor = $1
       LIMIT 1`,
      [req.session.userId]
    );

    if (disciplinaRes.rows.length === 0) {
      return res.status(400).json({ message: 'Disciplina do professor não encontrada.' });
    }

    const id_disciplina = disciplinaRes.rows[0].id_disciplina;

    // Buscar alunos e notas do trimestre específico
    const alunos = await pool.query(
      `SELECT a.id_aluno, a.nome, n.i1, n.i2, n.epa, n.n2, n.n3, n.rec, n.faltas, n.trimestre
       FROM Alunos a
       LEFT JOIN Notas n 
         ON a.id_aluno = n.id_aluno 
        AND n.id_disciplina = $1
        AND n.trimestre = $3
       WHERE a.id_turma = $2
       ORDER BY a.nome`,
      [id_disciplina, id_turma, trimestreFiltro]
    );

    res.json({ id_disciplina, trimestre: trimestreFiltro, alunos: alunos.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar alunos.' });
  }
});

/* =================== LISTAR TURMAS =================== */
app.get('/api/turmas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_turma, ano, serie FROM Turmas ORDER BY ano, serie');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar turmas' });
  }
});

/* =================== LISTAR DISCIPLINAS =================== */
app.get('/api/disciplinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_disciplina, nome FROM Disciplinas ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar disciplinas' });
  }
});

/* =================== ATUALIZAR NOTAS (COM TRIMESTRE) =================== */
app.post('/api/notas', async (req, res) => {
  if (req.session.funcao !== 'professor') {
    return res.status(403).json({ message: 'Apenas professores podem lançar notas.' });
  }

  const { id_aluno, id_disciplina, i1, i2, epa, n2, n3, rec, faltas, trimestre } = req.body;

  if (!id_aluno || !id_disciplina) {
    return res.status(400).json({ message: 'Aluno e disciplina são obrigatórios.' });
  }

  const trimestreAtualizar = trimestre || 1; // Default: 1º trimestre

  try {
    // Atualiza a tabela Notas para o trimestre específico
    await pool.query(
      `UPDATE Notas
       SET i1 = $1, i2 = $2, epa = $3, n2 = $4, n3 = $5, rec = $6, faltas = $7
       WHERE id_aluno = $8 AND id_disciplina = $9 AND trimestre = $10`,
      [
        i1 || null,
        i2 || null,
        epa || null,
        n2 || null,
        n3 || null,
        rec || null,
        faltas || null,
        id_aluno,
        id_disciplina,
        trimestreAtualizar
      ]
    );

    res.json({ message: 'Notas e faltas atualizadas com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar notas:', err);
    res.status(500).json({ message: 'Erro ao atualizar notas.' });
  }
});

/* =================== ROTAS PARA GRÁFICOS (COM FILTRO DE TRIMESTRE) =================== */
app.get('/api/graficos/notas-turma', async (req, res) => {
    const { id_turma, id_disciplina, avaliacao, trimestre } = req.query;

    if (!id_turma || !id_disciplina || !avaliacao) {
        return res.status(400).json({ message: 'Turma, disciplina e tipo de avaliação são obrigatórios.' });
    }
    
    const trimestreFiltro = trimestre ? parseInt(trimestre) : 1; // Default: 1º trimestre
    
    // Whitelist para evitar SQL Injection
    const colunasPermitidas = ['i1', 'i2', 'epa', 'n2', 'n3', 'rec'];
    if (!colunasPermitidas.includes(avaliacao)) {
        return res.status(400).json({ message: 'Tipo de avaliação inválida.'});
    }

    try {
        // A coluna é inserida de forma segura após a validação
        const query = `
            SELECT
                a.nome,
                n.${avaliacao} AS nota
            FROM Notas n
            JOIN Alunos a ON n.id_aluno = a.id_aluno
            WHERE a.id_turma = $1 AND n.id_disciplina = $2 AND n.trimestre = $3 AND n.${avaliacao} IS NOT NULL
            ORDER BY a.nome`;
            
        const result = await pool.query(query, [id_turma, id_disciplina, trimestreFiltro]);

        const labels = result.rows.map(row => row.nome);
        const data = result.rows.map(row => parseFloat(row.nota));

        res.json({ labels, data, trimestre: trimestreFiltro });
    } catch (err) {
        console.error('Erro ao buscar dados para o gráfico:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});
app.get('/api/graficos/notas-comparativo-turmas', async (req, res) => {
  const { id_disciplina, avaliacao, trimestre } = req.query;

  if (!id_disciplina || !avaliacao) {
      return res.status(400).json({ message: 'Disciplina e tipo de avaliação são obrigatórios.' });
  }
  
  // Define o trimestre padrão como 1, igual às suas outras rotas
  const trimestreFiltro = trimestre ? parseInt(trimestre) : 1; 
  
  // Reutiliza sua whitelist de colunas para segurança
  const colunasPermitidas = ['i1', 'i2', 'epa', 'n2', 'n3', 'rec'];
  if (!colunasPermitidas.includes(avaliacao)) {
      return res.status(400).json({ message: 'Tipo de avaliação inválida.'});
  }

  try {
      // Query para calcular a MÉDIA da nota por turma
      const query = `
          SELECT
              t.ano,
              t.serie,
              AVG(n.${avaliacao}) AS media_nota
          FROM Notas n
          JOIN Alunos a ON n.id_aluno = a.id_aluno
          JOIN Turmas t ON a.id_turma = t.id_turma
          WHERE n.id_disciplina = $1 
            AND n.trimestre = $2 
            AND n.${avaliacao} IS NOT NULL
          GROUP BY t.id_turma, t.ano, t.serie
          ORDER BY t.ano, t.serie`;
          
      const result = await pool.query(query, [id_disciplina, trimestreFiltro]);

      // Formata os dados para o Chart.js
      const labels = result.rows.map(row => `${row.ano}º ${row.serie}`);
      const data = result.rows.map(row => parseFloat(parseFloat(row.media_nota).toFixed(2))); // Arredonda a média

      res.json({ labels, data, trimestre: trimestreFiltro });

  } catch (err) {
      console.error('Erro ao buscar dados para o gráfico comparativo:', err);
      res.status(500).json({ message: 'Erro no servidor.' });
  }
});
/* =================== LOGOUT =================== */
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

/* =================== START SERVER =================== */
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
