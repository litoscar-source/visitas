import React, { useState, useEffect } from 'react';
import { Contract } from '../types';
import { X, Save, Plus, Trash2, Search, Edit2 } from 'lucide-react';

interface ContractFormProps {
  contract?: Contract | null;
  onSave: (contract: Contract) => void;
  onCancel: () => void;
}

export default function ContractForm({ contract, onSave, onCancel }: ContractFormProps) {
  const [formData, setFormData] = useState<Contract>({
    estado_cliente: '',
    tipo_servico: '',
    hh_estimado: '',
    id_ativo: '',
    cliente_primavera: '',
    cliente_nome: '',
    fcm: '',
    pago: 0,
    data_inicio_contrato: '',
    data_fim_contrato: '',
    localizacao_geografica: '',
    morada_entrega: '',
    localidade: '',
    concelho: '',
    distrito: '',
    local_execucao_consolidado: '',
    descricao_servico: '',
    visita_pesado: '',
    tipo_equipamento: '',
    capacidade_ce: '',
    num_serie_equipamento: '',
    celula_carga: '',
    visor: '',
    num_serie_visor: '',
    ultima_visita_ce: '',
    visita_camiao: '',
    visita_ligeiro: '',
    sugestao_atividade_camiao: '',
    proxima_atividade_ligeiro: '',
    restricao: '',
    observacao: ''
  });

  useEffect(() => {
    if (contract) {
      setFormData(prev => {
        const merged = { ...prev, ...contract };
        // Ensure all fields have valid values to prevent uncontrolled input warnings
        (Object.keys(prev) as Array<keyof Contract>).forEach(key => {
          if (merged[key] === null || merged[key] === undefined) {
             (merged as any)[key] = key === 'pago' ? 0 : '';
          }
        });
        return merged;
      });
    }
  }, [contract]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {contract ? 'Editar Contrato' : 'Novo Contrato'}
          </h2>
          <button onClick={onCancel} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Dados do Cliente */}
          <div>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-1">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Cliente Nome</label>
                <input name="cliente_nome" value={formData.cliente_nome} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Cliente Primavera</label>
                <input name="cliente_primavera" value={formData.cliente_primavera} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Estado Cliente</label>
                <select name="estado_cliente" value={formData.estado_cliente} onChange={handleChange} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Suspenso">Suspenso</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>ID Ativo</label>
                <input name="id_ativo" value={formData.id_ativo} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 2: Detalhes do Contrato */}
          <div>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-1">Detalhes do Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Tipo de Serviço</label>
                <input name="tipo_servico" value={formData.tipo_servico} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>H-H Estimado</label>
                <input name="hh_estimado" value={formData.hh_estimado} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>FCM</label>
                <input name="fcm" value={formData.fcm} onChange={handleChange} className={inputClass} />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="pago" 
                    checked={Boolean(formData.pago)} 
                    onChange={(e) => setFormData(prev => ({...prev, pago: e.target.checked}))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="text-sm font-medium text-gray-700">Pago</span>
                </label>
              </div>
              <div>
                <label className={labelClass}>Data Início</label>
                <input type="date" name="data_inicio_contrato" value={formData.data_inicio_contrato} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Data Fim</label>
                <input type="date" name="data_fim_contrato" value={formData.data_fim_contrato} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 3: Localização */}
          <div>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-1">Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Morada de Entrega</label>
                <input name="morada_entrega" value={formData.morada_entrega} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Localidade</label>
                <input name="localidade" value={formData.localidade} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Concelho</label>
                <input name="concelho" value={formData.concelho} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Distrito</label>
                <input name="distrito" value={formData.distrito} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Loc. Geográfica</label>
                <input name="localizacao_geografica" value={formData.localizacao_geografica} onChange={handleChange} className={inputClass} placeholder="Lat, Long" />
              </div>
              <div className="md:col-span-3">
                <label className={labelClass}>Local de Execução Consolidado</label>
                <input name="local_execucao_consolidado" value={formData.local_execucao_consolidado} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 4: Equipamento */}
          <div>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-1">Equipamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Tipo Equipamento</label>
                <input name="tipo_equipamento" value={formData.tipo_equipamento} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nº Série Equip.</label>
                <input name="num_serie_equipamento" value={formData.num_serie_equipamento} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Capacidade CE</label>
                <input name="capacidade_ce" value={formData.capacidade_ce} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Célula de Carga</label>
                <input name="celula_carga" value={formData.celula_carga} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Visor</label>
                <input name="visor" value={formData.visor} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nº Série Visor</label>
                <input name="num_serie_visor" value={formData.num_serie_visor} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 5: Visitas e Atividades */}
          <div>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-1">Visitas e Atividades</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Visita Pesado</label>
                <input name="visita_pesado" value={formData.visita_pesado} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Visita Camião</label>
                <input name="visita_camiao" value={formData.visita_camiao} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Visita Ligeiro</label>
                <input name="visita_ligeiro" value={formData.visita_ligeiro} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Última Visita CE</label>
                <input type="date" name="ultima_visita_ce" value={formData.ultima_visita_ce} onChange={handleChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Sugestão Atividade Camião</label>
                <input name="sugestao_atividade_camiao" value={formData.sugestao_atividade_camiao} onChange={handleChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Próxima Atividade Ligeiro</label>
                <input name="proxima_atividade_ligeiro" value={formData.proxima_atividade_ligeiro} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 6: Outros */}
          <div>
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-1">Outros</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass}>Descrição do Serviço</label>
                <textarea name="descricao_servico" value={formData.descricao_servico} onChange={handleChange} className={inputClass} rows={2} />
              </div>
              <div>
                <label className={labelClass}>Restrição</label>
                <textarea name="restricao" value={formData.restricao} onChange={handleChange} className={inputClass} rows={2} />
              </div>
              <div>
                <label className={labelClass}>Observação</label>
                <textarea name="observacao" value={formData.observacao} onChange={handleChange} className={inputClass} rows={2} />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-0 flex justify-end gap-3 border-t mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Contrato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
