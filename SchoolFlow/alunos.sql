CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255),
  data_nascimento DATE,
  funcao VARCHAR(50)
);
