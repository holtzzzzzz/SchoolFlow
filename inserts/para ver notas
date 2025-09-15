
-- Inserts para a tabela Turmas
INSERT INTO Turmas (ano, serie) VALUES 
(2025, '7º Ano A'),
(2025, '8º Ano B');

-- Inserts para a tabela Disciplinas
INSERT INTO Disciplinas (nome) VALUES 
('Matemática'),
('Português'),
('História'),
('Ciências'),
('Geografia');

-- Inserts para a tabela Professores
INSERT INTO Professores (nome, email, senha) VALUES 
('Marcos Silva', 'marcos@escola.com', 'senha123'),
('Ana Paula', 'ana@escola.com', 'senha123'),
('Carlos Mendes', 'carlos@escola.com', 'senha123');

-- Inserts para a tabela Professores_Disciplinas_Turmas
INSERT INTO Professores_Disciplinas_Turmas (id_professor, id_disciplina, id_turma) VALUES 
(1, 1, 1),
(2, 2, 1),
(2, 3, 1),
(3, 4, 2),
(1, 5, 2);

-- Inserts para a tabela Alunos
INSERT INTO Alunos (nome, email, senha, id_turma) VALUES 
('Lucas Pereira', 'lucas@aluno.com', 'senha123', 1),
('Beatriz Rocha', 'beatriz@aluno.com', 'senha123', 1),
('João Lima', 'joao@aluno.com', 'senha123', 2);

-- Inserts para a tabela Notas
-- Lucas Pereira (id_aluno = 1)
INSERT INTO Notas (id_aluno, id_disciplina, i1, i2, epa, n2, n3, rec, faltas) VALUES
(1, 1, 6.5, 7.0, 8.0, 7.5, 6.8, NULL, 3),
(1, 2, 8.0, 6.5, 7.5, 7.0, 7.2, NULL, 2),
(1, 3, 7.0, 7.5, 6.5, 7.0, 6.9, NULL, 1),
(1, 5, 6.2, 7.1, 6.8, 6.9, 6.5, NULL, 2),
(1, 4, 7.5, 8.0, 8.2, 8.1, 7.9, NULL, 1);

-- Beatriz Rocha (id_aluno = 2)
INSERT INTO Notas (id_aluno, id_disciplina, i1, i2, epa, n2, n3, rec, faltas) VALUES
(2, 1, 5.0, 6.0, 6.0, 6.0, 5.5, 6.5, 4),
(2, 2, 7.0, 7.0, 7.5, 7.0, 6.8, NULL, 2),
(2, 3, 6.5, 6.0, 6.5, 6.8, 6.4, NULL, 3),
(2, 4, 5.8, 6.2, 6.0, 6.1, 5.9, 6.3, 5),
(2, 5, 6.5, 6.5, 6.5, 6.5, 6.5, NULL, 2);

-- João Lima (id_aluno = 3)
INSERT INTO Notas (id_aluno, id_disciplina, i1, i2, epa, n2, n3, rec, faltas) VALUES
(3, 4, 4.0, 5.5, 5.0, 5.0, 5.2, 6.0, 6),
(3, 5, 6.0, 6.0, 6.5, 6.0, 6.2, NULL, 3),
(3, 1, 5.0, 5.0, 5.5, 5.2, 5.1, 6.0, 4),
(3, 2, 5.8, 6.2, 6.0, 6.1, 6.0, NULL, 2),
(3, 3, 6.3, 6.1, 6.4, 6.3, 6.2, NULL, 1);

-- Inserts para a tabela Responsaveis
INSERT INTO Responsaveis (nome, email, senha) VALUES 
('Fernanda Pereira', 'fernanda@responsavel.com', 'senha123'),
('Carlos Rocha', 'carlos.rocha@responsavel.com', 'senha123'),
('Maria Lima', 'maria.lima@responsavel.com', 'senha123');

-- Inserts para a tabela Alunos_Responsaveis
INSERT INTO Alunos_Responsaveis (id_aluno, id_responsavel) VALUES 
(1, 1),
(2, 2),
(3, 3);

-- Inserts para a tabela Coordenacao
INSERT INTO Coordenacao (nome, email, senha, codigo) VALUES 
('Luciana Gomes', 'luciana@escola.com', 'senha123', 'COORD2025');
