import React, { useState, useEffect, useRef } from 'react';
import { Contract } from './types';
import ContractForm from './components/ContractForm';
import { contractService } from './services/contractService';
import { Plus, Search, Edit2, Trash2, FileText, Filter, Download, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as xlsx from 'xlsx';

export default function App() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const fetchContracts = () => {
    setIsLoading(true);
    const data = contractService.getAll();
    setContracts(data);
    setIsLoading(false);
  };

  const handleSave = async (contract: Contract) => {
    try {
      contractService.save(contract);
      fetchContracts();
      setIsFormOpen(false);
      setEditingContract(null);
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Erro ao guardar contrato.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar este contrato?')) return;
    
    try {
      contractService.delete(id);
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingContract(null);
    setIsFormOpen(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;
        
        const workbook = xlsx.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: null });

        if (jsonData.length === 0) {
          alert('Ficheiro vazio ou inválido.');
          setIsLoading(false);
          return;
        }

        // Normalize keys
        const normalizedData = jsonData.map((row: any) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase().replace(/['"]/g, '');
            newRow[normalizedKey] = row[key];
          });
          return newRow;
        });

        const count = contractService.importBatch(normalizedData);
        alert(`Importados ${count} contratos com sucesso!`);
        fetchContracts();
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing:', error);
      alert('Erro ao importar ficheiro.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = () => {
    const data = contractService.getAll();
    if (data.length === 0) {
      alert('Não existem contratos para exportar.');
      return;
    }

    // Get headers
    const headers = Object.keys(data[0]);
    const csvHeaderRow = headers.join(';');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = (row as any)[header];
        const stringValue = value === null || value === undefined ? '' : String(value);
        if (stringValue.includes(';') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(';');
    });

    const csvContent = '\uFEFF' + [csvHeaderRow, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'contratos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
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
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const filteredContracts = contracts.filter(c => {
    // Global search
    const matchesSearch = 
      (c.cliente_nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cliente_primavera || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.num_serie_equipamento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.localidade || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Column filters
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const rawValue = (c as any)[key];
      const itemValue = String(rawValue ?? '').toLowerCase();
      const filterValue = String(value).toLowerCase();
      return itemValue.includes(filterValue);
    });
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Gestor de Contratos (Local)</h1>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              />
              <button 
                onClick={handleImportClick}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Excel
              </button>
              <button 
                onClick={handleDownloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileText className="h-4 w-4 mr-2" />
                Baixar Modelo
              </button>
              <button 
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </button>
              <button 
                onClick={handleNew}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Pesquisa global..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <span className="text-sm text-gray-500 self-center">
               {filteredContracts.length} registos encontrados
             </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ações</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Cliente</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('cliente_nome', e.target.value)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Início Contrato</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('data_inicio_contrato', e.target.value)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Fim Contrato</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('data_fim_contrato', e.target.value)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Pago</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('pago', e.target.value)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Morada Entrega</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('morada_entrega', e.target.value)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Localidade</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('localidade', e.target.value)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Concelho</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('concelho', e.target.value)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Distrito</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('distrito', e.target.value)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div>Sugestão Atividade</div>
                    <input 
                      type="text" 
                      className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Filtrar..."
                      onChange={(e) => handleFilterChange('sugestao_atividade_camiao', e.target.value)}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                      A carregar dados...
                    </td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                      Nenhum contrato encontrado.
                    </td>
                  </tr>
                ) : (
                  currentContracts.map((contract) => (
                    <tr 
                      key={contract.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onDoubleClick={() => handleEdit(contract)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(contract)} className="text-blue-600 hover:text-blue-900">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(contract.id!)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.cliente_nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.data_inicio_contrato}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.data_fim_contrato}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.pago ? 'Sim' : 'Não'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.morada_entrega}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.localidade}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.concelho}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.distrito}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.sugestao_atividade_camiao}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  A mostrar <span className="font-medium">{filteredContracts.length > 0 ? indexOfFirstItem + 1 : 0}</span> a <span className="font-medium">{Math.min(indexOfLastItem, filteredContracts.length)}</span> de <span className="font-medium">{filteredContracts.length}</span> resultados
                </p>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Primeira</span>
                    <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Página {currentPage} de {totalPages || 1}
                  </span>
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Próximo</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Última</span>
                    <ChevronsRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isFormOpen && (
        <ContractForm 
          contract={editingContract} 
          onSave={handleSave} 
          onCancel={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
