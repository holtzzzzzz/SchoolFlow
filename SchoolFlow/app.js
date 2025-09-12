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

app.get('/', (req, res) => {
  if (req.session.userId) {
    const funcao = req.session.funcao;
    
    switch (funcao) {
      case 'coordenacao':
        return res.redirect('/indexCoordenador.html');
      case 'professor':
        return res.redirect('/indexProfessor.html');
      case 'secretaria':
        return res.redirect('/indexSecretaria.html');
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
        return res.status(200).json({ message: 'Login bem-sucedido', funcao: funcao });
      }
    }
    
    return res.status(401).json({ message: 'Usuário ou senha inválidos' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
  }
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});
app.get('/api/boletim', async (req, res) => {
  const { alunoId } = req.query;
  if (!alunoId) {
    return res.status(400).json({ message: 'ID do aluno é obrigatório.' });
  }

  try {
    // Buscar dados do aluno
    const alunoResult = await pool.query(
      `SELECT nome, id_turma FROM Alunos WHERE id_aluno = $1`,
      [alunoId]
    );
    if (alunoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aluno não encontrado.' });
    }
    const aluno = alunoResult.rows[0];

    // Buscar dados da turma
    const turmaResult = await pool.query(
      `SELECT ano, serie FROM Turmas WHERE id_turma = $1`,
      [aluno.id_turma]
    );
    const turma = turmaResult.rows[0];
    const turmaStr = turma ? `${turma.ano}º ${turma.serie}` : '';

    // Buscar notas
    const notasResult = await pool.query(
      `SELECT d.nome AS materia, n.i1, n.i2, n.epa, n.n2, n.n3, n.rec, n.faltas
      FROM notas n
      JOIN disciplinas d ON n.id_disciplina = d.id_disciplina
      WHERE n.id_aluno = $1
      ORDER BY d.nome`,
      [alunoId]
    );

    res.json({
      nome: aluno.nome,
      turma: turmaStr,
      matricula: aluno.matricula,
      notas: notasResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar boletim.' });
  }
});

// Rota para buscar turmas
app.get('/api/turmas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_turma, ano, serie FROM Turmas ORDER BY ano, serie');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar turmas' });
  }
});

// Rota para buscar disciplinas
app.get('/api/disciplinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_disciplina, nome FROM Disciplinas ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar disciplinas' });
  }
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
    
    switch (funcao) {
      case 'aluno':
        if (!id_turma) {
          return res.status(400).json({ message: 'Turma é obrigatória para alunos.' });
        }
        query = 'INSERT INTO Alunos (nome, email, senha, id_turma) VALUES ($1, $2, $3, $4)';
        params = [nome, email, hashedPassword, id_turma];
        break;
        
      case 'professor':
        query = 'INSERT INTO Professores (nome, email, senha) VALUES ($1, $2, $3)';
        params = [nome, email, hashedPassword];
        break;
        
      case 'responsavel':
        query = 'INSERT INTO Responsaveis (nome, email, senha) VALUES ($1, $2, $3)';
        params = [nome, email, hashedPassword];
        break;
        
      case 'coordenacao':
        query = 'INSERT INTO Coordenacao (nome, email, senha, codigo) VALUES ($1, $2, $3, $4)';
        params = [nome, email, hashedPassword, codigo || null];
        break;
    }
    
    await pool.query(query, params);
    res.status(200).json({ message: 'Usuário registrado com sucesso!' });
    
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { 
      return res.status(400).json({ message: 'Este email já está cadastrado.' });
    }
    return res.status(500).json({ message: 'Erro ao registrar usuário. Tente novamente.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

