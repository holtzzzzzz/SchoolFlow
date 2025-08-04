-- Inserts para a tabela Turmas
INSERT INTO Turmas (ano, serie) VALUES
(2025, '6º ano A'),
(2025, '7º ano B');

-- Inserts para a tabela Disciplinas
INSERT INTO Disciplinas (nome) VALUES
('Matemática'),
('Português'),
('História'),
('Ciências');

-- Inserts para a tabela Professores
INSERT INTO Professores (nome, email, senha) VALUES
('Ana Souza', 'ana.souza@escola.com', 'senha123'),
('Carlos Lima', 'carlos.lima@escola.com', 'senha456');

-- Inserts para a tabela Professores_Disciplinas_Turmas
INSERT INTO Professores_Disciplinas_Turmas (id_professor, id_disciplina, id_turma) VALUES
(1, 1, 1),
(1, 3, 1),
(2, 2, 2);

-- Inserts para a tabela Alunos
INSERT INTO Alunos (nome, email, senha, id_turma) VALUES
('João Silva', 'joao.silva@aluno.com', 'aluno123', 1),
('Maria Oliveira', 'maria.oliveira@aluno.com', 'aluno456', 1),
('Lucas Pereira', 'lucas.pereira@aluno.com', 'aluno789', 2);

-- Inserts para a tabela Notas
INSERT INTO Notas (id_aluno, id_disciplina, i1, i2, epa, n1, n2, n3, rec, faltas) VALUES
(1, 1, 7.5, 8.0, 9.0, 8.2, 7.9, 8.5, NULL, 2),
(2, 1, 6.0, 5.5, 7.0, 6.2, 5.9, 6.8, 7.0, 3),
(3, 2, 9.0, 8.5, 9.5, 9.0, 9.1, 9.2, NULL, 0);

-- Inserts para a tabela Responsaveis
INSERT INTO Responsaveis (nome, email, senha) VALUES
('Fernanda Silva', 'fernanda.silva@responsavel.com', 'resp123'),
('Marcos Oliveira', 'marcos.oliveira@responsavel.com', 'resp456');

-- Inserts para a tabela Alunos_Responsaveis
INSERT INTO Alunos_Responsaveis (id_aluno, id_responsavel) VALUES
(1, 1),
(2, 2);

-- Inserts para a tabela Coordenacao
INSERT INTO Coordenacao (nome, email, senha, codigo) VALUES
('Beatriz Costa', 'beatriz.costa@coordenacao.com', 'coord123', 'COD001');
-- Novas notas para Lucas Pereira (id_aluno = 3)
INSERT INTO Notas (id_aluno, id_disciplina, i1, i2, epa, n1, n2, n3, rec, faltas) VALUES
(3, 1, 8.5, 9.0, 9.2, 8.9, 9.1, 9.3, NULL, 1), -- Matemática
(3, 3, 7.0, 6.5, 7.5, 7.0, 7.2, 7.4, NULL, 2), -- História
(3, 4, 8.0, 8.2, 8.8, 8.3, 8.5, 8.7, NULL, 0); -- Ciências
-- Notas adicionais para Lucas Pereira (id_aluno = 3)
INSERT INTO Notas (id_aluno, id_disciplina, i1, i2, epa, n1, n2, n3, rec, faltas) VALUES
(3, 5, 6.5, 7.0, 7.5, 7.0, 6.8, 7.2, NULL, 1), -- Geografia
(3, 6, 9.0, 8.5, 9.5, 9.0, 9.1, 9.3, NULL, 0), -- Inglês
(3, 7, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, NULL, 0); -- Educação Física
INSERT INTO Disciplinas (nome) VALUES
('Geografia'),
('Inglês'),
('Educação Física');

