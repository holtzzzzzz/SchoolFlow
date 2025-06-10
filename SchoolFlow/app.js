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
app.use(session({
  secret: 'gremio1903',
  resave: false,
  saveUninitialized: true,
}));

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  if (req.session.userId) {
    const funcao = req.session.funcao;
    if (funcao === 'responsavel') {
      return res.redirect('/index.html');
    } else if (funcao === 'professor') {
      return res.redirect('/indexProfessor.html');
    } else if (funcao === 'secretaria') {
      return res.redirect('/indexSecretaria.html');
    } else if (funcao === 'aluno') {
      return res.redirect('/indexAluno.html');
    } else {
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
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length > 0) {
      const validPassword = await bcrypt.compare(password, user.rows[0].password);
      if (validPassword) {
        req.session.userId = user.rows[0].id;
        req.session.email = user.rows[0].email;
        req.session.funcao = user.rows[0].funcao;

        return res.status(200).json({ message: 'Login bem-sucedido', funcao: user.rows[0].funcao });
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

app.post('/register', async (req, res) => {
  const { email, password, nome_completo, data_nascimento, funcao, telefone, id_turma } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (email, password, nome_completo, data_nascimento, funcao, telefone, id_turma)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [email, hashedPassword, nome_completo, data_nascimento, funcao, telefone || null, id_turma || null]
    );
    res.status(200).json({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error(err);
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
