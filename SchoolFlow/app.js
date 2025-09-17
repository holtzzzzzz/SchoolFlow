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
  password: '123456',
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
      case 'aluno': {
        if (!id_turma) return res.status(400).json({ message: 'Turma é obrigatória para alunos.' });

        const alunoRes = await pool.query(
          `INSERT INTO Alunos (nome, email, senha, id_turma)
           VALUES ($1, $2, $3, $4) RETURNING id_aluno`,
          [nome, email, hashedPassword, id_turma]
        );
        const alunoId = alunoRes.rows[0].id_aluno;

        // cria notas em branco
        const disciplinas = await pool.query('SELECT id_disciplina FROM Disciplinas');
        for (const d of disciplinas.rows) {
          await pool.query(
            `INSERT INTO Notas (id_aluno, id_disciplina) VALUES ($1, $2)`,
            [alunoId, d.id_disciplina]
          );
        }
        break;
      }

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

      case 'responsavel':
        await pool.query(
          `INSERT INTO Responsaveis (nome, email, senha) VALUES ($1, $2, $3)`,
          [nome, email, hashedPassword]
        );
        break;

      case 'coordenacao':
        await pool.query(
          `INSERT INTO Coordenacao (nome, email, senha, codigo) VALUES ($1, $2, $3, $4)`,
          [nome, email, hashedPassword, codigo || null]
        );
        break;
    }

    res.status(200).json({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error("Erro no registro:", err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Este email já está cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
});

/* =================== BOLETIM DO ALUNO =================== */
app.get('/api/boletim', async (req, res) => {
  if (req.session.funcao !== 'aluno') {
    return res.status(403).json({ message: 'Apenas alunos podem ver o boletim.' });
  }
  const alunoId = req.session.userId;
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
      `SELECT d.nome AS materia, n.i1, n.i2, n.epa, n.n2, n.n3, n.rec, n.faltas
       FROM Notas n
       JOIN Disciplinas d ON n.id_disciplina = d.id_disciplina
       WHERE n.id_aluno = $1
       ORDER BY d.nome`,
      [alunoId]
    );

    res.json({
      nome: aluno.rows[0].nome,
      turma: turma.rows[0] ? `${turma.rows[0].ano}º ${turma.rows[0].serie}` : '',
      id_aluno: aluno.rows[0].id_aluno,
      notas: notas.rows
    });
  } catch (err) {
    console.error("Erro no /api/boletim:", err);
    res.status(500).json({ message: 'Erro ao buscar boletim.' });
  }
});

/* =================== ROTAS EXTRAS =================== */
// Buscar alunos de uma turma e disciplina (para o professor lançar notas)
// Buscar alunos de uma turma (disciplina do professor é automática)
app.get('/api/professor/alunos', async (req, res) => {
  if (req.session.funcao !== 'professor') {
    return res.status(403).json({ message: 'Apenas professores podem acessar.' });
  }

  const { id_turma } = req.query;
  if (!id_turma) return res.status(400).json({ message: 'Turma obrigatória.' });

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

    // Buscar alunos e notas
    const alunos = await pool.query(
      `SELECT a.id_aluno, a.nome, n.i1, n.i2, n.epa, n.n2, n.n3, n.rec, n.faltas
       FROM Alunos a
       LEFT JOIN Notas n 
         ON a.id_aluno = n.id_aluno 
        AND n.id_disciplina = $1
       WHERE a.id_turma = $2
       ORDER BY a.nome`,
      [id_disciplina, id_turma]
    );

    res.json({ id_disciplina, alunos: alunos.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar alunos.' });
  }
});


app.get('/api/turmas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_turma, ano, serie FROM Turmas ORDER BY ano, serie');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar turmas' });
  }
});

app.get('/api/disciplinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_disciplina, nome FROM Disciplinas ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar disciplinas' });
  }
});
// Atualizar notas de um aluno (apenas professor)
app.post('/api/notas', async (req, res) => {
  if (req.session.funcao !== 'professor') {
    return res.status(403).json({ message: 'Apenas professores podem lançar notas.' });
  }

  const { id_aluno, id_disciplina, i1, i2, epa, n2, n3, rec, faltas } = req.body;

  if (!id_aluno || !id_disciplina) {
    return res.status(400).json({ message: 'Aluno e disciplina são obrigatórios.' });
  }

  try {
    // Atualiza a tabela Notas
    await pool.query(
      `UPDATE Notas
       SET i1 = $1, i2 = $2, epa = $3, n2 = $4, n3 = $5, rec = $6, faltas = $7
       WHERE id_aluno = $8 AND id_disciplina = $9`,
      [
        i1 || null,
        i2 || null,
        epa || null,
        n2 || null,
        n3 || null,
        rec || null,
        faltas || null,
        id_aluno,
        id_disciplina
      ]
    );

    res.json({ message: 'Notas e faltas atualizadas com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar notas:', err);
    res.status(500).json({ message: 'Erro ao atualizar notas.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

/* =================== START SERVER =================== */
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
