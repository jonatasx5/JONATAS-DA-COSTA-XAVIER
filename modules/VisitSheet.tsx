
import React from 'react';
import { VisitData, CompanyProfile, LayoutType } from '../types';

interface VisitSheetProps {
  visitData: VisitData;
  companyProfile: CompanyProfile;
  budgetNumber: string;
}

const modelLabels = {
    [LayoutType.Reto]: 'Reto',
    [LayoutType.EmL]: 'Em L',
    [LayoutType.EmU]: 'Em U',
};

const typeLabels = {
    'inferior': 'Inferior',
    'superior': 'Superior',
};

const DataRow: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div>
    <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">{label}</p>
    {children ? <div className="text-gray-800 text-sm mt-1">{children}</div> : <p className="text-gray-800">{value || 'Não informado'}</p>}
  </div>
);

export const VisitSheet = React.forwardRef<HTMLDivElement, VisitSheetProps>(({ visitData, companyProfile, budgetNumber }, ref) => {
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div ref={ref} className="print-container bg-white p-8 mx-auto border" style={{ width: '210mm', minHeight: '297mm', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <header className="flex justify-between items-start pb-4 border-b">
        <div className="flex items-center gap-4">
            {companyProfile.logo && <img src={companyProfile.logo} alt="Logo" className="h-16 w-auto object-contain" />}
            <div>
                <h1 className="text-xl font-bold text-primary">{companyProfile.name}</h1>
                <h2 className="text-lg font-semibold text-gray-700">Ficha de Visita Técnica</h2>
            </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm text-gray-600 font-medium">Orçamento Nº {budgetNumber}</p>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
      </header>
      
      <main className="mt-6 space-y-6">
        <section className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-base font-bold text-primary mb-3">Dados do Cliente</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <DataRow label="Cliente" value={visitData.clientName} />
            <DataRow label="Bairro / Endereço" value={visitData.clientAddress} />
          </div>
        </section>

        <section className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-base font-bold text-primary mb-3">Especificações do Móvel</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <DataRow label="Tipo" value={typeLabels[visitData.cabinetType]} />
            <DataRow label="Modelo" value={modelLabels[visitData.cabinetModel]} />
            <DataRow label="Local" value={visitData.cabinetLocation} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-base font-bold text-primary mb-3">Medidas do Local (cm)</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>{visitData.cabinetModel === LayoutType.Reto ? 'Frente:' : 'Lado A:'}</span><span className="font-mono font-semibold">{visitData.measurements.ladoA.toFixed(2)}</span></div>
                    {(visitData.cabinetModel === LayoutType.EmL || visitData.cabinetModel === LayoutType.EmU) && (
                        <div className="flex justify-between"><span>Lado B:</span><span className="font-mono font-semibold">{visitData.measurements.ladoB.toFixed(2)}</span></div>
                    )}
                    {visitData.cabinetModel === LayoutType.EmU && (
                        <div className="flex justify-between"><span>Lado C:</span><span className="font-mono font-semibold">{visitData.measurements.ladoC.toFixed(2)}</span></div>
                    )}
                </div>

                <h3 className="text-base font-bold text-primary mt-4 mb-2 pt-3 border-t">Base de Alvenaria</h3>
                <div className="space-y-2 text-sm">
                    {visitData.hasBase ? (
                        <>
                           <div className="flex justify-between"><span>Altura:</span><span className="font-mono font-semibold">{visitData.baseDetails.height.toFixed(2)} cm</span></div>
                           <div className="flex justify-between"><span>Profundidade A:</span><span className="font-mono font-semibold">{visitData.baseDetails.depthA.toFixed(2)} cm</span></div>
                            {(visitData.cabinetModel === LayoutType.EmL || visitData.cabinetModel === LayoutType.EmU) && (
                               <div className="flex justify-between"><span>Profundidade B:</span><span className="font-mono font-semibold">{visitData.baseDetails.depthB.toFixed(2)} cm</span></div>
                            )}
                            {visitData.cabinetModel === LayoutType.EmU && (
                               <div className="flex justify-between"><span>Profundidade C:</span><span className="font-mono font-semibold">{visitData.baseDetails.depthC.toFixed(2)} cm</span></div>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-500">Não possui / a ser construída.</p>
                    )}
                </div>
            </div>
             <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-base font-bold text-primary mb-3">Registro Fotográfico</h3>
                {visitData.photo ? 
                    <img src={visitData.photo} alt="Foto do local" className="w-full h-auto rounded-md object-contain" style={{maxHeight: '200px'}} /> 
                    : <p className="text-gray-500 text-sm text-center py-8">Nenhuma foto registrada.</p>
                }
            </div>
        </section>

        <section>
          <DataRow label="Observações">
            <p className="text-xs border p-3 bg-gray-50 rounded-md min-h-[80px] whitespace-pre-wrap">
                {visitData.notes || 'Nenhuma observação.'}
            </p>
          </DataRow>
        </section>
      </main>

      <footer className="text-center text-xs text-gray-400 pt-6 mt-auto border-t">
        <p>Documento gerado pelo Planejador de Armários Pro</p>
      </footer>
    </div>
  );
});