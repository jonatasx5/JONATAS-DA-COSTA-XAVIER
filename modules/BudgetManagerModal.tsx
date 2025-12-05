
import React, { useState, useMemo, useRef } from 'react';
import { SavedProject } from '../types';
import { Button, Input, Card, TrashIcon, DownloadIcon, UploadIcon, ShareIcon } from '../components/ui';
import { usePersistence } from '../hooks/usePersistence';

interface BudgetManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: SavedProject[];
    onLoad: (project: SavedProject) => void;
    onDelete: (id: string) => void;
}

export const BudgetManagerModal: React.FC<BudgetManagerModalProps> = ({ isOpen, onClose, projects, onLoad, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { exportProject, importProject } = usePersistence();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredProjects = useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase();
        return projects.filter(p => 
            p.clientName.toLowerCase().includes(lowerTerm) ||
            p.clientAddress.toLowerCase().includes(lowerTerm) ||
            p.id.includes(lowerTerm)
        );
    }, [projects, searchTerm]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await importProject(e.target.files[0]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-primary">Gerenciar Orçamentos</h2>
                            <p className="text-sm text-gray-500">Banco de Dados Local - Salvo neste dispositivo</p>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".json" 
                                onChange={handleFileChange}
                            />
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                <UploadIcon className="h-4 w-4 mr-2" />
                                Importar Arquivo
                            </Button>
                            <Button variant="ghost" onClick={onClose}>Fechar</Button>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 border-b">
                        <Input 
                            placeholder="Buscar por Nome, Bairro ou ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {filteredProjects.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                {searchTerm ? 'Nenhum projeto encontrado para esta busca.' : 'Nenhum projeto salvo ainda.'}
                            </div>
                        ) : (
                            filteredProjects.map(project => (
                                <Card key={project.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg text-gray-800">{project.clientName}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                                project.status === 'Em Produção' ? 'bg-green-100 text-green-700 border-green-200' :
                                                project.status === 'Visita Realizada' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">{project.clientAddress}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>ID: {project.id}</span>
                                            <span>Data: {new Date(project.lastModified).toLocaleDateString()}</span>
                                            <span className="font-semibold text-gray-700">Valor: {project.totalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button 
                                            variant="secondary"
                                            title="Exportar/Compartilhar"
                                            onClick={() => exportProject(project)}
                                        >
                                            <ShareIcon className="h-4 w-4 md:mr-2" />
                                            <span className="hidden md:inline">Enviar</span>
                                        </Button>
                                        <Button 
                                            onClick={() => onLoad(project)}
                                            className="flex-1 md:flex-none"
                                        >
                                            <DownloadIcon className="h-4 w-4 mr-2" />
                                            Carregar
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="icon"
                                            onClick={() => onDelete(project.id)}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                    <div className="p-3 bg-yellow-50 text-yellow-800 text-xs text-center border-t">
                        Para enviar um orçamento ao técnico: Clique em "Enviar", mande o arquivo pelo WhatsApp. O técnico deve clicar em "Importar Arquivo" para abrir.
                    </div>
                </div>
            </div>
        </>
    );
};
