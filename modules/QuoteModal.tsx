import React, { useState, useRef } from 'react';
import { BudgetInputs, BudgetCalculations, CabinetCalculations, CompanyProfile } from '../types';
import { Card, Input, Button, PrinterIcon, CameraIcon, Textarea, Select } from '../components/ui';

declare const html2canvas: any;

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetInputs: BudgetInputs;
  budgetCalculations: BudgetCalculations;
  cabinetCalculations: CabinetCalculations;
  companyProfile: CompanyProfile;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, budgetInputs, budgetCalculations, cabinetCalculations, companyProfile }) => {
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [cabinetLocation, setCabinetLocation] = useState('Cozinha');
  const [customCabinetLocation, setCustomCabinetLocation] = useState('');
  
  const quoteRef = useRef<HTMLDivElement>(null);

  const handleSaveAsImage = () => {
    if (quoteRef.current) {
        // Temporarily hide inputs before screenshot
        const inputs = quoteRef.current.querySelectorAll('.no-print-input');
        inputs.forEach(input => (input as HTMLElement).style.display = 'none');
        const placeholders = quoteRef.current.querySelectorAll('.print-placeholder');
        placeholders.forEach(ph => (ph as HTMLElement).style.display = 'block');
        
        html2canvas(quoteRef.current, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: '#ffffff',
        }).then((canvas: HTMLCanvasElement) => {
            const link = document.createElement('a');
            link.download = `orcamento-${clientName.replace(/\s/g, '_') || 'cliente'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
             // Restore visibility
            inputs.forEach(input => (input as HTMLElement).style.display = 'block');
            placeholders.forEach(ph => (ph as HTMLElement).style.display = 'none');
        });
    }
  };
  
  if (!isOpen) return null;
  
  const getSelectedFinishes = () => {
      const finishes = [];
      if (budgetInputs.acm) finishes.push("Prateleiras em ACM");
      if (budgetInputs.tintaMetalica) finishes.push("Pintura Metálica");
      if (budgetInputs.vidroReflecta) finishes.push("Vidro Reflecta/Espelho");
      if (budgetInputs.perfisPintados) finishes.push("Perfis com Pintura Especial");
      return finishes;
  }

  const getSelectedAccessories = () => {
      return (Object.entries(budgetInputs.acessorios) as [string, number][])
        .filter(([, qty]) => qty > 0)
        .map(([key, qty]) => {
            const labels: {[key:string]: string} = {
                portaTempero: "Porta-tempero", gavetao: "Gavetão", gavetaDupla: "Gaveta Dupla",
                escorredor: "Escorredor Embutido", portaPano: "Porta-pano", portaCanto: "Porta de Canto",
                lateria: "Lateria (painel lateral)"
            };
            return `${qty}x ${labels[key]}`;
        });
  }

  const finalCabinetLocation = cabinetLocation === 'Outros' ? customCabinetLocation : cabinetLocation;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 no-print" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto no-print">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl my-8 transform transition-all flex">
          
          {/* Coluna de Inputs */}
          <div className="w-1/3 p-6 border-r flex flex-col gap-4">
              <h3 className="text-lg font-bold text-primary">Preencher Dados</h3>
              <Input label="Nome do Cliente" placeholder="Ex: João da Silva" value={clientName} onChange={e => setClientName(e.target.value)} />
              <Textarea label="Endereço do Cliente" placeholder="Ex: Rua das Flores, 123" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
              <Input label="Vendedor" placeholder="Seu nome" value={sellerName} onChange={e => setSellerName(e.target.value)} />
              <Select label="Local do Armário" value={cabinetLocation} onChange={e => setCabinetLocation(e.target.value)}>
                <option>Cozinha</option>
                <option>Banheiro</option>
                <option>Área Gourmet</option>
                <option>Guarda Roupa</option>
                <option>Outros</option>
              </Select>
              {cabinetLocation === 'Outros' && (
                  <Input label="Especifique o Local" placeholder="Ex: Lavanderia" value={customCabinetLocation} onChange={e => setCustomCabinetLocation(e.target.value)} />
              )}
               <div className="mt-auto pt-4 border-t space-y-2">
                 <Button onClick={handleSaveAsImage} className="w-full">
                    <CameraIcon className="h-4 w-4 mr-2" />
                    Salvar como Imagem
                 </Button>
                 <Button onClick={onClose} variant="secondary" className="w-full">Fechar</Button>
               </div>
          </div>
          
          {/* Coluna de Preview */}
          <div className="w-2/3 p-8 bg-gray-100 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)'}}>
            <div ref={quoteRef} className="print-container bg-white p-8 mx-auto" style={{ width: '210mm', minHeight: '297mm'}}>
              <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
                  <div className="flex items-center gap-4">
                      {companyProfile.logo && <img src={companyProfile.logo} alt="Logo" className="h-16 w-auto object-contain" />}
                      <div>
                          <h1 className="text-xl font-bold text-primary">{companyProfile.name}</h1>
                          <p className="text-xs text-gray-500 whitespace-pre-line">{companyProfile.address}</p>
                          <p className="text-xs text-gray-500">{companyProfile.contact}</p>
                      </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-gray-400 uppercase">Orçamento</p>
                      <p className="text-sm text-gray-600">{new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
              </header>

              <section className="grid grid-cols-2 gap-6 my-6 text-sm">
                  <div className="space-y-1">
                      <h3 className="font-semibold text-gray-500">CLIENTE</h3>
                      <p className="font-medium text-gray-800">{clientName || 'A definir'}</p>
                      <p className="text-gray-600 whitespace-pre-line">{clientAddress || 'Endereço a definir'}</p>
                  </div>
                  <div className="space-y-1">
                      <h3 className="font-semibold text-gray-500">PROJETO</h3>
                      <p className="font-medium text-gray-800">{`Móvel para ${finalCabinetLocation || 'Ambiente'}`}</p>
                      <p className="text-gray-600">Vendedor: {sellerName || 'A definir'}</p>
                  </div>
              </section>
              
              <section className="mt-4">
                  <Card className="border-gray-200 shadow-none">
                      <h3 className="text-base font-semibold text-primary mb-3">Detalhes do Produto</h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                          <div>
                              <p className="font-semibold text-gray-600">Dimensões Gerais:</p>
                              <p className="text-gray-800 pl-2">&bull; Largura: {cabinetCalculations.comprimentoUtil.toFixed(2)} cm | Altura: {cabinetCalculations.alturaQuadro.toFixed(2)} cm</p>
                          </div>
                          <div>
                              <p className="font-semibold text-gray-600">Acabamentos:</p>
                              {getSelectedFinishes().length > 0 ? getSelectedFinishes().map(f => <p key={f} className="text-gray-800 pl-2">&bull; {f}</p>) : <p className="text-gray-500 pl-2">Padrão</p>}
                          </div>
                          <div className="col-span-2">
                               <p className="font-semibold text-gray-600">Acessórios:</p>
                               {getSelectedAccessories().length > 0 ? getSelectedAccessories().map(a => <p key={a} className="text-gray-800 pl-2">&bull; {a}</p>) : <p className="text-gray-500 pl-2">Nenhum</p>}
                          </div>
                      </div>
                  </Card>
              </section>

              <section className="mt-6">
                  <h3 className="text-base font-semibold text-primary mb-3">Resumo Financeiro</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between items-center text-gray-600"><span>Valor base do móvel</span><span className="font-mono">{formatCurrency(budgetCalculations.basePrice)}</span></div>
                      <div className="flex justify-between items-center text-gray-600"><span>Acessórios</span><span className="font-mono">{formatCurrency(budgetCalculations.acessoriosPrice)}</span></div>
                      <div className="flex justify-between items-center font-semibold text-gray-800 pt-2 border-t"><span>Subtotal</span><span className="font-mono">{formatCurrency(budgetCalculations.subtotal)}</span></div>
                      <div className="flex justify-between items-center text-gray-600 text-xs"><span>Ajustes de acabamento (x{budgetCalculations.multiplicadorAcabamento.toFixed(2)})</span><span className="font-mono">{formatCurrency(budgetCalculations.total - budgetCalculations.subtotal)}</span></div>
                  </div>
                  <div className="mt-2 p-4 bg-primary text-primary-foreground rounded-lg flex justify-between items-center">
                      <span className="text-lg font-bold">Valor Total</span>
                      <span className="text-2xl font-bold font-mono">{formatCurrency(budgetCalculations.total)}</span>
                  </div>
              </section>
              
              <footer className="text-center text-xs text-gray-400 pt-6 mt-6 border-t">
                  <p>Este orçamento é válido por 30 dias. Os valores podem sofrer alterações após este período.</p>
              </footer>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};