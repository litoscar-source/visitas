import { Contract } from '../types';

const STORAGE_KEY = 'contracts_data';

// Helper to generate ID
const generateId = () => {
  return Date.now();
};

export const contractService = {
  getAll: (): Contract[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      const contracts = JSON.parse(data);
      // Sort by created_at desc (simulating SQL ORDER BY)
      return contracts.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    } catch (e) {
      console.error("Error parsing contracts from local storage", e);
      return [];
    }
  },

  save: (contract: Contract): Contract => {
    const contracts = contractService.getAll();
    
    if (contract.id) {
      // Update
      const index = contracts.findIndex(c => c.id === contract.id);
      if (index !== -1) {
        contracts[index] = { ...contract };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
        return contracts[index];
      }
    }
    
    // Create
    const newContract = {
      ...contract,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    contracts.push(newContract);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
    return newContract;
  },

  delete: (id: number): void => {
    const contracts = contractService.getAll();
    const filtered = contracts.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  importBatch: (newContracts: any[]): number => {
    const currentContracts = contractService.getAll();
    let count = 0;
    
    // Normalize and add IDs
    const toAdd = newContracts.map(c => ({
      ...c,
      id: generateId() + count++, // Ensure unique IDs during batch
      created_at: new Date().toISOString()
    }));

    const merged = [...currentContracts, ...toAdd];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return count;
  }
};
