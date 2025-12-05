
import React, { useState } from 'react';
import { BudgetInputs, BudgetCalculations, CompanyProfile, LayoutType } from '../types';
import { Input, Card, Checkbox, Button, Select } from '../components/ui';
import { useBudgetCalculations } from '../hooks/useCalculations';
import { QuoteModal } from './QuoteModal';

interface BudgetModuleProps {
    companyProfile: CompanyProfile;
    budgetInputs: BudgetInputs;
    setBudgetInputs: (inputs: BudgetInputs | ((prev: BudgetInputs) => BudgetInputs)) => void;
    budgetNumber: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const AcessorioInput: React.FC<{
    label: string;
    value: number;
    onChange: (newValue: number) => void;
    max?: number;
}> = ({ label, value, onChange, max }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-7 w-7 p-0" onClick={() => onChange(Math.max(0, value - 1))}>-</Button>
            <span className="w-8 text-center font-semibold">{value}</span>
            <Button 
                variant="secondary" 
                className="h-7 w-7 p-0" 
                onClick={() => {
                    const newValue = value + 1;
                    if (max === undefined || newValue <= max) {
                        onChange(newValue);
                    }
                }}
                disabled={max !== undefined && value >= max}
            >+</Button>
        </div>
    </div>
);


export const BudgetModule: React.FC<BudgetModuleProps> = ({ companyProfile, budgetInputs, setBudgetInputs, budgetNumber }) => {
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    
    const calculations = useBudgetCalculations(budgetInputs);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const target = e.target as HTMLInputElement;

        if (name.startsWith('medidas.')) {
            const key = name.split('.')[1] as 'ladoA' | 'ladoB' | 'ladoC';
            setBudgetInputs(prev => ({
                ...prev,
                medidas: { ...prev.medidas, [key]: parseFloat(value) || 0 }
            }));
        } else if (type === 'checkbox') {
            setBudgetInputs(prev => ({ ...prev, [name]: target.checked }));
        } else if (type === 'number') {
            setBudgetInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setBudgetInputs(prev => ({ ...prev, [name]: value }));
        }
    };


    const handleAcessorioChange = (name: keyof BudgetInputs['acessorios'], value: number) => {
        setBudgetInputs(prev => ({
            ...prev,
            acessorios: { ...prev.acessorios, [name]: value }
        }));
    };

    return (
        <>
            <QuoteModal
                isOpen={isQuoteModalOpen}
                onClose={() => setIsQuoteModalOpen(false)}
                budgetInputs={budgetInputs}
                budgetCalculations={calculations}
                companyProfile={companyProfile}
                budgetNumber={budgetNumber}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Inputs Column */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="md:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-primary">Dados Base</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded border">Nº: {budgetNumber}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="sm:col-span-2">
                                <Select label="Tipo de Armário" name="type" value={budgetInputs.type} onChange={handleInputChange}>
                                    <option value="inferior">Inferior (Baseado na pedra)</option>
                                    <option value="superior">Superior (Baseado na altura)</option>
                                </Select>
                            </div>
                            <div className="sm:col-span-2">
                                <Select label="Formato do Armário" name="layout" value={budgetInputs.layout} onChange={handleInputChange}>
                                    <option value={LayoutType.Reto}>Reto</option>
                                    <option value={LayoutType.EmL}>Em L</option>
                                    <option value={LayoutType.EmU}>Em U</option>
                                </Select>
                            </div>

                            <Input label={budgetInputs.layout === LayoutType.Reto ? "Largura" : "Largura Lado A"} type="number" name="medidas.ladoA" unit="cm" value={budgetInputs.medidas.ladoA} onChange={handleInputChange} />
                            
                            {(budgetInputs.layout === LayoutType.EmL || budgetInputs.layout === LayoutType.EmU) && (
                                <Input label="Largura Lado B" type="number" name="medidas.ladoB" unit="cm" value={budgetInputs.medidas.ladoB} onChange={handleInputChange} />
                            )}
                            
                            {budgetInputs.layout === LayoutType.EmU && (
                                <Input label="Largura Lado C" type="number" name="medidas.ladoC" unit="cm" value={budgetInputs.medidas.ladoC} onChange={handleInputChange} />
                            )}
                            
                            <Input label="Altura do Armário" type="number" name="alturaCm" unit="cm" value={budgetInputs.alturaCm} onChange={handleInputChange} />
                            <Input label="Preço por Metro Linear" type="number" name="precoML" unit="R$/m" value={budgetInputs.precoML} onChange={handleInputChange} />
                            
                            {/* Novo Campo de Distância */}
                            <Input label="Distância do Cliente" type="number" name="distancia" unit="Km" value={budgetInputs.distancia} onChange={handleInputChange} />
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold mb-4 text-primary">Acessórios Adicionais</h2>
                        <div className="space-y-3">
                        <AcessorioInput label="Lateral (painel lateral)" value={budgetInputs.acessorios.lateral} onChange={v => handleAcessorioChange('lateral', v)} max={2} />
                        <AcessorioInput label="Porta-tempero" value={budgetInputs.acessorios.portaTempero} onChange={v => handleAcessorioChange('portaTempero', v)} />
                        <AcessorioInput label="Gavetão" value={budgetInputs.acessorios.gavetao} onChange={v => handleAcessorioChange('gavetao', v)} />
                        <AcessorioInput label="Gaveta Dupla" value={budgetInputs.acessorios.gavetaDupla} onChange={v => handleAcessorioChange('gavetaDupla', v)} />
                        <AcessorioInput label="Escorredor Embutido" value={budgetInputs.acessorios.escorredor} onChange={v => handleAcessorioChange('escorredor', v)} />
                        <AcessorioInput label="Porta-pano" value={budgetInputs.acessorios.portaPano} onChange={v => handleAcessorioChange('portaPano', v)} />
                        <AcessorioInput label="Porta de Canto" value={budgetInputs.acessorios.portaCanto} onChange={v => handleAcessorioChange('portaCanto', v)} />
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold mb-4 text-primary">Modificadores de Acabamento</h2>
                        <div className="space-y-4">
                            <Checkbox label="Prateleiras em ACM (+10% no ML)" name="acm" checked={budgetInputs.acm} onChange={handleInputChange} />
                            <Checkbox label="Tinta Metálica (+5% no total)" name="tintaMetalica" checked={budgetInputs.tintaMetalica} onChange={handleInputChange} />
                            <Checkbox label="Vidro Reflecta/Espelho (+15% no total)" name="vidroReflecta" checked={budgetInputs.vidroReflecta} onChange={handleInputChange} />
                            <Checkbox label="Perfis Pintados (+15% no total)" name="perfisPintados" checked={budgetInputs.perfisPintados} onChange={handleInputChange} />
                        </div>
                    </Card>
                </div>

                {/* Results Column */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-8">
                        <h2 className="text-xl font-bold mb-4 text-primary">Resumo do Orçamento</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm p-3 bg-secondary rounded-md">
                                <span className="text-muted-foreground">Preço ML Aplicado:</span>
                                <span className="font-semibold text-primary">{formatCurrency(calculations.precoMLAplicado)}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm px-3">
                                <span className="text-xs text-gray-500">Fator Altura ({budgetInputs.type}):</span>
                                <span className="text-xs font-mono text-gray-500">x{calculations.fatorAltura.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-3 bg-secondary rounded-md">
                                <span className="text-muted-foreground">Preço Base:</span>
                                <span className="font-semibold text-primary">{formatCurrency(calculations.basePrice)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-3 bg-secondary rounded-md">
                                <span className="text-muted-foreground">Acessórios:</span>
                                <span className="font-semibold text-primary">{formatCurrency(calculations.acessoriosPrice)}</span>
                            </div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold text-gray-600">Subtotal:</span>
                                <span className="font-bold text-gray-800">{formatCurrency(calculations.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-3 bg-secondary rounded-md">
                                <span className="text-muted-foreground">Multiplicador (acabamento):</span>
                                <span className="font-semibold text-primary">x{calculations.multiplicadorAcabamento.toFixed(2)}</span>
                            </div>
                            
                            {/* Exibição do Frete */}
                            <div className="flex justify-between items-center text-sm p-3 bg-secondary rounded-md">
                                <span className="text-muted-foreground">Frete ({budgetInputs.distancia}km):</span>
                                <span className="font-semibold text-primary">{formatCurrency(calculations.frete)}</span>
                            </div>

                            <div className="border-t-2 border-dashed my-2"></div>
                            <div className="p-4 bg-primary text-primary-foreground rounded-lg text-center">
                                <p className="text-lg font-medium">Valor Total</p>
                                <p className="text-4xl font-bold tracking-tight">{formatCurrency(calculations.total)}</p>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">Opções de Pagamento</h3>
                                <div className="space-y-2">
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                        <p className="font-semibold text-green-800">À Vista com 5% de Desconto</p>
                                        <p className="text-2xl font-bold text-green-700">{formatCurrency(calculations.total * 0.95)}</p>
                                    </div>
                                    {(() => {
                                        const total = calculations.total;
                                        if (total < 700) return null;
                                        const numParcelas = Math.floor(total / 700);
                                        if (numParcelas < 1) return null;
                                        const valorParcela = total / numParcelas;
                                        return (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                                <p className="font-semibold text-blue-800">Parcelado no Cartão</p>
                                                <p className="text-lg text-blue-700"><span className="font-bold">{numParcelas}x</span> de <span className="font-bold">{formatCurrency(valorParcela)}</span></p>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <Button className="w-full" onClick={() => setIsQuoteModalOpen(true)}>
                                    Gerar Imagem para Cliente
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};
