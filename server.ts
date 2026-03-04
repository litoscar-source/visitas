import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./src/db/database.js";
import multer from "multer";
import * as xlsx from "xlsx";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Get all contracts
  app.get("/api/contracts", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC');
      const contracts = stmt.all();
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  // Create a contract
  app.post("/api/contracts", (req, res) => {
    try {
      const columns = [
        'estado_cliente', 'tipo_servico', 'hh_estimado', 'id_ativo', 'cliente_primavera',
        'cliente_nome', 'fcm', 'pago', 'data_inicio_contrato', 'data_fim_contrato',
        'localizacao_geografica', 'morada_entrega', 'localidade', 'concelho', 'distrito',
        'local_execucao_consolidado', 'descricao_servico', 'visita_pesado', 'tipo_equipamento',
        'capacidade_ce', 'num_serie_equipamento', 'celula_carga', 'visor', 'num_serie_visor',
        'ultima_visita_ce', 'visita_camiao', 'visita_ligeiro', 'sugestao_atividade_camiao',
        'proxima_atividade_ligeiro', 'restricao', 'observacao'
      ];

      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO contracts (${columns.join(', ')}) VALUES (${placeholders})`;
      
      const stmt = db.prepare(sql);
      
      const values = columns.map(col => req.body[col] || null);
      const info = stmt.run(...values);
      
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  // Update a contract
  app.put("/api/contracts/:id", (req, res) => {
    try {
      const { id } = req.params;
      const columns = [
        'estado_cliente', 'tipo_servico', 'hh_estimado', 'id_ativo', 'cliente_primavera',
        'cliente_nome', 'fcm', 'pago', 'data_inicio_contrato', 'data_fim_contrato',
        'localizacao_geografica', 'morada_entrega', 'localidade', 'concelho', 'distrito',
        'local_execucao_consolidado', 'descricao_servico', 'visita_pesado', 'tipo_equipamento',
        'capacidade_ce', 'num_serie_equipamento', 'celula_carga', 'visor', 'num_serie_visor',
        'ultima_visita_ce', 'visita_camiao', 'visita_ligeiro', 'sugestao_atividade_camiao',
        'proxima_atividade_ligeiro', 'restricao', 'observacao'
      ];

      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const sql = `UPDATE contracts SET ${setClause} WHERE id = ?`;
      
      const stmt = db.prepare(sql);
      const values = [...columns.map(col => req.body[col] || null), id];
      
      const info = stmt.run(...values);
      
      if (info.changes === 0) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json({ id, ...req.body });
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  // Delete a contract
  app.delete("/api/contracts/:id", (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM contracts WHERE id = ?');
      const info = stmt.run(id);
      
      if (info.changes === 0) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // Export contracts to CSV (Excel compatible)
  app.get("/api/contracts/export", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC');
      const contracts = stmt.all();

      const columns = [
        'id', 'estado_cliente', 'tipo_servico', 'hh_estimado', 'id_ativo', 'cliente_primavera',
        'cliente_nome', 'fcm', 'pago', 'data_inicio_contrato', 'data_fim_contrato',
        'localizacao_geografica', 'morada_entrega', 'localidade', 'concelho', 'distrito',
        'local_execucao_consolidado', 'descricao_servico', 'visita_pesado', 'tipo_equipamento',
        'capacidade_ce', 'num_serie_equipamento', 'celula_carga', 'visor', 'num_serie_visor',
        'ultima_visita_ce', 'visita_camiao', 'visita_ligeiro', 'sugestao_atividade_camiao',
        'proxima_atividade_ligeiro', 'restricao', 'observacao', 'created_at'
      ];

      // Get headers from the first object or use default columns
      const headers = contracts.length > 0 ? Object.keys(contracts[0]) : columns;
      // Use semicolon for Excel compatibility in many regions
      const csvHeaderRow = headers.join(';');
      
      // Convert rows to CSV
      const csvRows = contracts.map(row => {
        return headers.map(header => {
          const value = row[header];
          const stringValue = value === null ? '' : String(value);
          // Escape quotes and wrap in quotes if contains delimiter or newline
          if (stringValue.includes(';') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(';');
      });

      // Add BOM for Excel UTF-8 compatibility
      const csvContent = '\uFEFF' + [csvHeaderRow, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="contratos.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting contracts:", error);
      res.status(500).json({ error: "Failed to export contracts" });
    }
  });

  // Download template
  app.get("/api/contracts/template", (req, res) => {
    try {
      const columns = [
        'estado_cliente', 'tipo_servico', 'hh_estimado', 'id_ativo', 'cliente_primavera',
        'cliente_nome', 'fcm', 'pago', 'data_inicio_contrato', 'data_fim_contrato',
        'localizacao_geografica', 'morada_entrega', 'localidade', 'concelho', 'distrito',
        'local_execucao_consolidado', 'descricao_servico', 'visita_pesado', 'tipo_equipamento',
        'capacidade_ce', 'num_serie_equipamento', 'celula_carga', 'visor', 'num_serie_visor',
        'ultima_visita_ce', 'visita_camiao', 'visita_ligeiro', 'sugestao_atividade_camiao',
        'proxima_atividade_ligeiro', 'restricao', 'observacao'
      ];

      const csvHeaderRow = columns.join(';');
      const csvContent = '\uFEFF' + csvHeaderRow;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting template:", error);
      res.status(500).json({ error: "Failed to export template" });
    }
  });

  // Import contracts from Excel/CSV
  app.post("/api/contracts/import", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("Processing file import...");
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Use raw: false to try to format values, but defval: null ensures missing cells are null
      const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

      console.log(`Read ${data.length} rows from file.`);
      if (data.length > 0) {
        console.log("First row keys:", Object.keys(data[0]));
      }

      if (data.length === 0) {
        return res.status(400).json({ error: "File is empty or could not be read." });
      }

      const columns = [
        'estado_cliente', 'tipo_servico', 'hh_estimado', 'id_ativo', 'cliente_primavera',
        'cliente_nome', 'fcm', 'pago', 'data_inicio_contrato', 'data_fim_contrato',
        'localizacao_geografica', 'morada_entrega', 'localidade', 'concelho', 'distrito',
        'local_execucao_consolidado', 'descricao_servico', 'visita_pesado', 'tipo_equipamento',
        'capacidade_ce', 'num_serie_equipamento', 'celula_carga', 'visor', 'num_serie_visor',
        'ultima_visita_ce', 'visita_camiao', 'visita_ligeiro', 'sugestao_atividade_camiao',
        'proxima_atividade_ligeiro', 'restricao', 'observacao'
      ];

      const insertStmt = db.prepare(`
        INSERT INTO contracts (${columns.join(', ')}) 
        VALUES (${columns.map(() => '?').join(', ')})
      `);

      const insertMany = db.transaction((rows) => {
        let count = 0;
        for (const row of rows) {
          // Normalize row keys to handle case sensitivity and potential trimming issues
          // Create a map of normalized key -> actual key
          const rowKeys = Object.keys(row);
          const keyMap = new Map();
          rowKeys.forEach(k => {
            // Remove quotes, trim, lowercase
            const normalized = k.toString().trim().toLowerCase().replace(/['"]/g, '');
            keyMap.set(normalized, k);
          });

          const values = columns.map(col => {
            const normalizedCol = col.toLowerCase();
            const actualKey = keyMap.get(normalizedCol);
            
            let value = actualKey ? row[actualKey] : null;
            
            // Handle dates if they come as objects from xlsx
            if (value instanceof Date) {
              value = value.toISOString().split('T')[0];
            }
            
            return value;
          });
          
          insertStmt.run(...values);
          count++;
        }
        return count;
      });

      const count = insertMany(data);
      console.log(`Successfully imported ${count} contracts.`);

      res.json({ success: true, count, message: `Imported ${count} contracts successfully` });
    } catch (error) {
      console.error("Error importing contracts:", error);
      res.status(500).json({ error: "Failed to import contracts: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
