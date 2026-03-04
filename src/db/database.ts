import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'contracts.db'));

// Enable foreign keys and WAL mode for better performance/concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize schema based on the user's image
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estado_cliente TEXT,
      tipo_servico TEXT,
      hh_estimado TEXT,
      id_ativo TEXT,
      cliente_primavera TEXT,
      cliente_nome TEXT,
      fcm TEXT,
      pago BOOLEAN DEFAULT 0,
      data_inicio_contrato TEXT,
      data_fim_contrato TEXT,
      localizacao_geografica TEXT,
      morada_entrega TEXT,
      localidade TEXT,
      concelho TEXT,
      distrito TEXT,
      local_execucao_consolidado TEXT,
      descricao_servico TEXT,
      visita_pesado TEXT,
      tipo_equipamento TEXT,
      capacidade_ce TEXT,
      num_serie_equipamento TEXT,
      celula_carga TEXT,
      visor TEXT,
      num_serie_visor TEXT,
      ultima_visita_ce TEXT,
      visita_camiao TEXT,
      visita_ligeiro TEXT,
      sugestao_atividade_camiao TEXT,
      proxima_atividade_ligeiro TEXT,
      restricao TEXT,
      observacao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

initDb();

export default db;
