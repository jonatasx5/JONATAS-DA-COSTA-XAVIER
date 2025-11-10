import React, { useState, useEffect } from 'react';
import { BudgetInputs, BudgetCalculations, CabinetCalculations, CompanyProfile } from '../types';
import { Input, Card, Checkbox, Button } from '../components/ui';
import { useBudgetCalculations } from '../hooks/useCalculations';
import { QuoteModal } from './QuoteModal';

interface BudgetModuleProps {
    cabinetCalculations: CabinetCalculations;
    companyProfile: CompanyProfile;
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


export const BudgetModule: React.FC<BudgetModuleProps> = ({ cabinetCalculations, companyProfile }) => {
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [inputs, setInputs] = useState<BudgetInputs>({
        larguraCm: 0,
        alturaCm: 0,
        precoML: 1200,
        acm: false,
        tintaMetalica: false,
        vidroReflecta: false,
        perfisPintados: false,
        acessorios: {
            portaTempero: 0,
            gavetao: 0,
            gavetaDupla: 0,
            escorredor: 0,
            portaPano: 0,
            portaCanto: 0,
            lateria: 0,
        },
    });

    useEffect(() => {
        setInputs(prev => ({
            ...prev,
            larguraCm: cabinetCalculations.comprimentoUtil,
            alturaCm: cabinetCalculations.alturaQuadro,
        }));
    }, [cabinetCalculations.comprimentoUtil, cabinetCalculations.alturaQuadro]);

    const calculations = useBudgetCalculations(inputs);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setInputs(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : parseFloat(value) || 0 }));
    };

    const handleAcessorioChange = (name: keyof BudgetInputs['acessorios'], value: number) => {
        setInputs(prev => ({
            ...prev,
            acessorios: { ...prev.acessorios, [name]: value }
        }));
    };

    return (
        <>
            <QuoteModal
                isOpen={isQuoteModalOpen}
                onClose={() => setIsQuoteModalOpen(false)}
                budgetInputs={inputs}
                budgetCalculations={calculations}
                cabinetCalculations={cabinetCalculations}
                companyProfile={companyProfile}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Inputs Column */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="md:col-span-2">
                        <h2 className="text-xl font-bold mb-4 text-primary">Dados Base</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input label="Largura do Armário" type="number" name="larguraCm" unit="cm" value={inputs.larguraCm} onChange={handleInputChange} />
                            <Input label="Altura do Armário" type="number" name="alturaCm" unit="cm" value={inputs.alturaCm} onChange={handleInputChange} />
                            <Input label="Preço por Metro Linear" type="number" name="precoML" unit="R$/m" value={inputs.precoML} onChange={handleInputChange} />
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold mb-4 text-primary">Acessórios Adicionais</h2>
                        <div className="space-y-3">
                        <AcessorioInput label="Lateria (painel lateral)" value={inputs.acessorios.lateria} onChange={v => handleAcessorioChange('lateria', v)} max={2} />
                        <AcessorioInput label="Porta-tempero" value={inputs.acessorios.portaTempero} onChange={v => handleAcessorioChange('portaTempero', v)} />
                        <AcessorioInput label="Gavetão" value={inputs.acessorios.gavetao} onChange={v => handleAcessorioChange('gavetao', v)} />
                        <AcessorioInput label="Gaveta Dupla" value={inputs.acessorios.gavetaDupla} onChange={v => handleAcessorioChange('gavetaDupla', v)} />
                        <AcessorioInput label="Escorredor Embutido" value={inputs.acessorios.escorredor} onChange={v => handleAcessorioChange('escorredor', v)} />
                        <AcessorioInput label="Porta-pano" value={inputs.acessorios.portaPano} onChange={v => handleAcessorioChange('portaPano', v)} />
                        <AcessorioInput label="Porta de Canto" value={inputs.acessorios.portaCanto} onChange={v => handleAcessorioChange('portaCanto', v)} />
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold mb-4 text-primary">Modificadores de Acabamento</h2>
                        <div className="space-y-4">
                            <Checkbox label="Prateleiras em ACM (+10% no ML)" name="acm" checked={inputs.acm} onChange={handleInputChange} />
                            <Checkbox label="Tinta Metálica (+5% no total)" name="tintaMetalica" checked={inputs.tintaMetalica} onChange={handleInputChange} />
                            <Checkbox label="Vidro Reflecta/Espelho (+15% no total)" name="vidroReflecta" checked={inputs.vidroReflecta} onChange={handleInputChange} />
                            <Checkbox label="Perfis Pintados (+15% no total)" name="perfisPintados" checked={inputs.perfisPintados} onChange={handleInputChange} />
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
                            <div className="border-t-2 border-dashed my-2"></div>
                            <div className="p-4 bg-primary text-primary-foreground rounded-lg text-center">
                                <p className="text-lg font-medium">Valor Total</p>
                                <p className="text-4xl font-bold tracking-tight">{formatCurrency(calculations.total)}</p>
                            </div>
                            <div className="mt-6">
                                <Button className="w-full" onClick={() => setIsQuoteModalOpen(true)}>
                                    Gerar Orçamento para Cliente
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};