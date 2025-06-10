CREATE TABLE turma (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    ano_letivo INT NOT NULL CHECK (ano_letivo >= 2000), -- ano válido
    id_user INT,  -- professor responsável
    CONSTRAINT fk_turma_professor FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    funcao VARCHAR(20) NOT NULL CHECK (funcao IN ('aluno', 'professor', 'secretaria', 'responsavel')),
    nome_completo VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE,
    id_turma INT,
    CONSTRAINT fk_users_turma FOREIGN KEY (id_turma) REFERENCES turma(id) ON DELETE SET NULL
);


CREATE INDEX idx_users_email ON users(email);

CREATE TABLE responsavel (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(150) UNIQUE
);

CREATE TABLE aluno_responsavel (
    id_aluno INT NOT NULL,
    id_responsavel INT NOT NULL,
    PRIMARY KEY (id_aluno, id_responsavel),
    CONSTRAINT fk_aluno_responsavel_aluno FOREIGN KEY (id_aluno) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_aluno_responsavel_responsavel FOREIGN KEY (id_responsavel) REFERENCES responsavel(id) ON DELETE CASCADE
);

CREATE TABLE avaliacao (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL,
    data DATE NOT NULL CHECK (data <= CURRENT_DATE),
    id_turma INT NOT NULL,
    peso DECIMAL(3,2) DEFAULT 1.0 CHECK (peso > 0),
    CONSTRAINT fk_avaliacao_turma FOREIGN KEY (id_turma) REFERENCES turma(id) ON DELETE CASCADE
);

CREATE TABLE boletim (
    id SERIAL PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_avaliacao INT NOT NULL,
    nota DECIMAL(5,2) CHECK (nota >= 0 AND nota <= 10),
    CONSTRAINT fk_boletim_aluno FOREIGN KEY (id_aluno) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_boletim_avaliacao FOREIGN KEY (id_avaliacao) REFERENCES avaliacao(id) ON DELETE CASCADE,
    UNIQUE (id_aluno, id_avaliacao) -- evita duplicidade de notas para mesma avaliação
);
