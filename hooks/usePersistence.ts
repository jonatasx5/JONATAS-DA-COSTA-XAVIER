
import { useState, useEffect, useCallback } from 'react';
import { SavedProject, Estrutura, Vao, BudgetInputs, VisitData, ProductionNotes } from '../types';

const STORAGE_KEY = 'planejador_armarios_db_v1';

export const usePersistence = () => {
    const [projects, setProjects] = useState<SavedProject[]>([]);

    // Load on mount
    useEffect(() => {
        const loaded = localStorage.getItem(STORAGE_KEY);
        if (loaded) {
            try {
                setProjects(JSON.parse(loaded));
            } catch (e) {
                console.error("Erro ao carregar projetos", e);
                setProjects([]);
            }
        }
    }, []);

    const saveProject = useCallback((
        id: string,
        estrutura: Estrutura,
        vaos: Vao[],
        budgetInputs: BudgetInputs,
        visitData: VisitData,
        productionNotes: ProductionNotes,
        totalValue: number
    ) => {
        const now = Date.now();
        
        // Determine status based on data filled
        let status: SavedProject['status'] = 'Orçamento';
        if (visitData.measurements.ladoA > 0 || visitData.photo) {
            status = 'Visita Realizada';
        }
        if (productionNotes.glass.length > 5 || productionNotes.profiles.length > 5) {
            status = 'Em Produção';
        }

        // Get client name from either source, prioritize Visit data if available as it's more accurate
        const clientName = visitData.clientName || 'Cliente Sem Nome';
        const clientAddress = visitData.clientAddress || 'Endereço não informado';

        const newProject: SavedProject = {
            id,
            createdAt: now, // This should ideally be preserved if editing, but for simplicity we update
            lastModified: now,
            clientName,
            clientAddress,
            totalValue,
            status,
            estrutura,
            vaos,
            budgetInputs,
            visitData,
            productionNotes
        };

        setProjects(prev => {
            const existingIndex = prev.findIndex(p => p.id === id);
            let updatedList;
            if (existingIndex >= 0) {
                // Update existing, preserving original creation date
                newProject.createdAt = prev[existingIndex].createdAt;
                updatedList = [...prev];
                updatedList[existingIndex] = newProject;
            } else {
                // Add new
                updatedList = [newProject, ...prev];
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
            return updatedList;
        });
        
        alert('Projeto salvo com sucesso!');
    }, []);

    const deleteProject = useCallback((id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
            setProjects(prev => {
                const updated = prev.filter(p => p.id !== id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        }
    }, []);
    
    const exportProject = useCallback((project: SavedProject) => {
        const dataStr = JSON.stringify(project, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `projeto_${project.clientName.replace(/\s/g, '_')}_${project.id}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    const importProject = useCallback((file: File) => {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = event.target?.result as string;
                    const project: SavedProject = JSON.parse(json);
                    
                    // Simple validation
                    if (!project.id || !project.estrutura || !project.budgetInputs) {
                        throw new Error("Arquivo inválido: formato de projeto desconhecido.");
                    }

                    setProjects(prev => {
                        // Check if exists, if so overwrite, else add
                        const existingIndex = prev.findIndex(p => p.id === project.id);
                        let updatedList;
                        if (existingIndex >= 0) {
                            updatedList = [...prev];
                            updatedList[existingIndex] = project;
                        } else {
                            updatedList = [project, ...prev];
                        }
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
                        return updatedList;
                    });
                    alert(`Projeto de ${project.clientName} importado com sucesso!`);
                    resolve();
                } catch (error) {
                    console.error(error);
                    alert("Erro ao importar arquivo. Verifique se é um arquivo de projeto válido.");
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }, []);

    return {
        projects,
        saveProject,
        deleteProject,
        exportProject,
        importProject
    };
};
