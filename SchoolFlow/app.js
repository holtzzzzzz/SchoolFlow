const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Alunos',
  password: '1903',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'gremio1903',
  resave: false,
  saveUninitialized: true,
}));

app.use(express.static(__dirname));

/* =================== PÁGINA INICIAL =================== */
app.get('/', (req, res) => {
  if (req.session.userId) {
    const funcao = req.session.funcao;
    switch (funcao) {
      case 'coordenacao':
        return res.redirect('/indexCoordenador.html');
      case 'professor':
        return res.redirect('/indexProfessor.html');
      case 'aluno':
        return res.redirect('/indexAluno.html');
      case 'responsavel':
        return res.redirect('/indexResponsavel.html');
      default:
        res.send(`<h1>Bem-vindo, ${req.session.email}!</h1><a href="/logout">Sair</a>`);
    }
  } else {
    res.redirect('/login.html');
  }
});

/* =================== LOGIN =================== */
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = null;
    let funcao = null;

    const tabelas = [
      { nome: 'Professores', funcao: 'professor', id: 'id_professor' },
      { nome: 'Alunos', funcao: 'aluno', id: 'id_aluno' },
      { nome: 'Responsaveis', funcao: 'responsavel', id: 'id_responsavel' },
      { nome: 'Coordenacao', funcao: 'coordenacao', id: 'id_coordenacao' }
    ];

    for (const tabela of tabelas) {
      const result = await pool.query(`SELECT * FROM ${tabela.nome} WHERE email = $1`, [email]);
      if (result.rows.length > 0) {
        user = result.rows[0];
        funcao = tabela.funcao;
        req.session.userIdField = tabela.id;
        break;
      }
    }

    if (user) {
      const validPassword = await bcrypt.compare(password, user.senha);
      if (validPassword) {
        req.session.userId = user[req.session.userIdField];
        req.session.email = user.email;
        req.session.funcao = funcao;
        req.session.nome = user.nome;
        return res.status(200).json({ 
          message: 'Login bem-sucedido', 
          funcao,
          id: req.session.userId 
        });
      }
    }
    return res.status(401).json({ message: 'Usuário ou senha inválidos' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
  }
});

/* =================== REGISTRO =================== */
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.post('/register', async (req, res) => {
  const { email, password, nome, funcao, id_turma, codigo } = req.body;
  try {
    const funcoesValidas = ['aluno', 'professor', 'coordenacao', 'responsavel'];
    if (!funcoesValidas.includes(funcao)) {
      return res.status(400).json({ message: 'Função inválida.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let query = '';
    let params = [];
    let alunoId = null;

    switch (funcao) {
      case 'aluno':
        if (!id_turma) {
          return res.status(400).json({ message: 'Turma é obrigatória para alunos.' });
        }
        query = 'INSERT INTO Alunos (nome, email, senha, id_turma) VALUES ($1, $2, $3, $4) RETURNING id_aluno';
        params = [nome, email, hashedPassword, id_turma];
        const alunoRes = await pool.query(query, params);
        alunoId = alunoRes.rows[0].id_aluno;

        // cria notas em branco para todas as disciplinas
        const disciplinas = await pool.query('SELECT id_disciplina FROM Disciplinas');
        for (const d of disciplinas.rows) {
          await pool.query(
            `INSERT INTO Notas (id_aluno, id_disciplina) VALUES ($1, $2)`,
            [alunoId, d.id_disciplina]
          );
        }
        break;

      case 'professor':
        query = 'INSERT INTO Professores (nome, email, senha) VALUES ($1, $2, $3)';
        params = [nome, email, hashedPassword];
        await pool.query(query, params);
        break;

      case 'responsavel':
        query = 'INSERT INTO Responsaveis (nome, email, senha) VALUES ($1, $2, $3)';
        params = [nome, email, hashedPassword];
        await pool.query(query, params);
        break;

      case 'coordenacao':
        query = 'INSERT INTO Coordenacao (nome, email, senha, codigo) VALUES ($1, $2, $3, $4)';
        params = [nome, email, hashedPassword, codigo || null];
        await pool.query(query, params);
        break;
    }

    res.status(200).json({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { 
      return res.status(400).json({ message: 'Este email já está cadastrado.' });
    }
    return res.status(500).json({ message: 'Erro ao registrar usuário. Tente novamente.' });
  }
});

/* =================== BOLETIM DO ALUNO =================== */
app.get('/api/boletim', async (req, res) => {
  if (!req.session.userId || req.session.funcao !== 'aluno') {
    return res.status(403).json({ message: 'Acesso negado. Apenas alunos podem ver boletim.' });
  }
  const alunoId = req.session.userId;
  try {
    const alunoResult = await pool.query(
      `SELECT nome, id_aluno, id_turma FROM Alunos WHERE id_aluno = $1`,
      [alunoId]
    );
    if (alunoResult.rows.length === 0) return res.status(404).json({ message: 'Aluno não encontrado.' });
    const aluno = alunoResult.rows[0];

    const turmaResult = await pool.query(
      `SELECT ano, serie FROM Turmas WHERE id_turma = $1`,
      [aluno.id_turma]
    );
    const turma = turmaResult.rows[0];
    const turmaStr = turma ? `${turma.ano}º ${turma.serie}` : '';

    const notasResult = await pool.query(
      `SELECT d.nome AS materia, n.i1, n.i2, n.epa, n.n2, n.n3, n.rec, n.faltas
       FROM Notas n
       JOIN Disciplinas d ON n.id_disciplina = d.id_disciplina
       WHERE n.id_aluno = $1
       ORDER BY d.nome`,
      [alunoId]
    );

    res.json({
      nome: aluno.nome,
      turma: turmaStr,
      id_aluno: aluno.id_aluno,
      notas: notasResult.rows
    });
  } catch (err) {
    console.error("Erro no /api/boletim:", err);
    res.status(500).json({ message: 'Erro ao buscar boletim.' });
  }
});

/* =================== ROTAS DO PROFESSOR =================== */
// listar alunos de uma turma/disciplina do professor
app.get('/api/professor/alunos/:id_disciplina/:id_turma', async (req, res) => {
  if (!req.session.userId || req.session.funcao !== 'professor') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  const { id_disciplina, id_turma } = req.params;
  const id_professor = req.session.userId;

  try {
    // valida se o professor está vinculado
    const check = await pool.query(
      `SELECT 1 FROM Professores_Disciplinas_Turmas
       WHERE id_professor=$1 AND id_disciplina=$2 AND id_turma=$3`,
      [id_professor, id_disciplina, id_turma]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Você não tem acesso a essa turma/disciplina.' });
    }

    const alunos = await pool.query(
      `SELECT a.id_aluno, a.nome, n.i1, n.i2, n.epa, n.n2, n.n3, n.rec, n.faltas
       FROM Alunos a
       JOIN Notas n ON a.id_aluno = n.id_aluno
       WHERE a.id_turma=$1 AND n.id_disciplina=$2
       ORDER BY a.nome`,
      [id_turma, id_disciplina]
    );
    res.json(alunos.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar alunos.' });
  }
});

// atualizar notas
app.post('/api/professor/notas', async (req, res) => {
  if (!req.session.userId || req.session.funcao !== 'professor') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  const id_professor = req.session.userId;
  const { id_aluno, id_disciplina, id_turma, notas } = req.body;

  try {
    // valida se o professor pode lançar notas nessa turma/disciplina
    const check = await pool.query(
      `SELECT 1 FROM Professores_Disciplinas_Turmas
       WHERE id_professor=$1 AND id_disciplina=$2 AND id_turma=$3`,
      [id_professor, id_disciplina, id_turma]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Você não pode lançar notas nessa turma/disciplina.' });
    }

    await pool.query(
      `UPDATE Notas
       SET i1=$1, i2=$2, epa=$3, n2=$4, n3=$5, rec=$6, faltas=$7
       WHERE id_aluno=$8 AND id_disciplina=$9`,
      [
        notas.i1, notas.i2, notas.epa, notas.n2, notas.n3,
        notas.rec, notas.faltas,
        id_aluno, id_disciplina
      ]
    );

    res.json({ message: 'Notas atualizadas com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar notas.' });
  }
});
app.get('/api/turma/:id/alunos', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.id_aluno, a.nome, n.i1, n.i2, n.epa, n.n2, n.n3, n.rec, n.faltas
      FROM Alunos a
      LEFT JOIN Notas n ON a.id_aluno = n.id_aluno
      WHERE a.id_turma = $1
      ORDER BY a.nome
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar alunos da turma' });
  }
});
app.post('/api/notas', async (req, res) => {
  if (!req.session.userId || req.session.funcao !== 'professor') {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  const id_professor = req.session.userId;
  const { id_aluno, id_disciplina, i1, i2, epa, n2, n3, rec, faltas } = req.body;

  try {
    // descobrir a turma do aluno
    const alunoRes = await pool.query(
      `SELECT id_turma FROM Alunos WHERE id_aluno=$1`,
      [id_aluno]
    );
    if (alunoRes.rows.length === 0) {
      return res.status(404).json({ message: 'Aluno não encontrado.' });
    }
    const id_turma = alunoRes.rows[0].id_turma;

    // validar vínculo professor-disciplina-turma
    const check = await pool.query(
      `SELECT 1 FROM Professores_Disciplinas_Turmas
       WHERE id_professor=$1 AND id_disciplina=$2 AND id_turma=$3`,
      [id_professor, id_disciplina, id_turma]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Você não pode lançar notas nessa turma/disciplina.' });
    }

    // atualizar notas
    await pool.query(
      `UPDATE Notas
       SET i1=$1, i2=$2, epa=$3, n2=$4, n3=$5, rec=$6, faltas=$7
       WHERE id_aluno=$8 AND id_disciplina=$9`,
      [i1, i2, epa, n2, n3, rec, faltas, id_aluno, id_disciplina]
    );

    res.json({ message: 'Notas atualizadas com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar notas.' });
  }
});

/* =================== OUTRAS =================== */
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

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

/* =================== START SERVER =================== */
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
