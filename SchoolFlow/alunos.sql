-- Tabela: Turmas
CREATE TABLE Turmas (
    id_turma SERIAL PRIMARY KEY,
    ano INTEGER NOT NULL,
    serie VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Disciplinas
CREATE TABLE Disciplinas (
    id_disciplina SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Turmas_Disciplinas (
    id SERIAL PRIMARY KEY,
    id_turma INTEGER NOT NULL REFERENCES Turmas(id_turma) ON DELETE CASCADE,
    id_disciplina INTEGER NOT NULL REFERENCES Disciplinas(id_disciplina) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_turma, id_disciplina) -- evita duplicar a mesma disciplina na turma
);
-- Tabela: Professores
CREATE TABLE Professores (
    id_professor SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Professores_Disciplinas_Turmas
CREATE TABLE Professores_Disciplinas_Turmas (
    id SERIAL PRIMARY KEY,
    id_professor INTEGER NOT NULL REFERENCES Professores(id_professor) ON DELETE CASCADE,
    id_disciplina INTEGER NOT NULL REFERENCES Disciplinas(id_disciplina) ON DELETE CASCADE,
    id_turma INTEGER NOT NULL REFERENCES Turmas(id_turma) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Alunos
CREATE TABLE Alunos (
    id_aluno SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    id_turma INTEGER NOT NULL REFERENCES Turmas(id_turma) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Notas
CREATE TABLE Notas (
    id SERIAL PRIMARY KEY,
    id_aluno INTEGER NOT NULL REFERENCES Alunos(id_aluno) ON DELETE CASCADE,
    id_turma_disciplina INTEGER NOT NULL REFERENCES Turmas_Disciplinas(id) ON DELETE CASCADE,
    i1 NUMERIC(5,2),
    i2 NUMERIC(5,2),
    epa NUMERIC(5,2),
    n2 NUMERIC(5,2),
    n3 NUMERIC(5,2),
    rec NUMERIC(5,2),
    faltas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Tabela: Responsaveis
CREATE TABLE Responsaveis (
    id_responsavel SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Alunos_Responsaveis
CREATE TABLE Alunos_Responsaveis (
    id SERIAL PRIMARY KEY,
    id_aluno INTEGER NOT NULL REFERENCES Alunos(id_aluno) ON DELETE CASCADE,
    id_responsavel INTEGER NOT NULL REFERENCES Responsaveis(id_responsavel) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Coordenacao
CREATE TABLE Coordenacao (
    id_coordenacao SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
