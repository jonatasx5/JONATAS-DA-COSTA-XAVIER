

import React, { useRef, useMemo, useState } from 'react';
import { BomItem, ProductionNotes } from '../types';
import { Card, Button, PrinterIcon } from '../components/ui';

declare const html2canvas: any;

const ProductionListTable: React.FC<{ items: BomItem[], isGlass: boolean }> = ({ items, isGlass }) => {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-800 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-4 py-3">Categoria</th>
            <th scope="col" className="px-4 py-3">Item</th>
            <th scope="col" className="px-4 py-3 text-center">Qtd</th>
            <th scope="col" className="px-4 py-3 text-right">Largura (cm)</th>
            <th scope="col" className="px-4 py-3 text-right">Altura (cm)</th>
            {isGlass && <th scope="col" className="px-4 py-3 text-right">Espessura (mm)</th>}
            {isGlass && <th scope="col" className="px-4 py-3 text-center">Lapidação</th>}
            <th scope="col" className="px-4 py-3">Notas</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
              <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{item.category}</th>
              <td className="px-4 py-3">{item.item}</td>
              <td className="px-4 py-3 text-center">{item.quantity}</td>
              <td className="px-4 py-3 text-right font-mono">{item.width.toFixed(2)}</td>
              <td className="px-4 py-3 text-right font-mono">{!isGlass && item.height === 0 ? '-' : item.height.toFixed(2)}</td>
              {isGlass && <td className="px-4 py-3 text-right font-mono">{item.thickness ? `${item.thickness}mm` : '-'}</td>}
              {isGlass && <td className="px-4 py-3 text-center text-xs font-medium">{item.polishingDescription || '-'}</td>}
              <td className="px-4 py-3">{item.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const SummaryDisplay: React.FC<{ title: string; data: { label: string; value: string }[] }> = ({ title, data }) => (
  <div className="mt-6">
    <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm border">
      {data.map(({ label, value }) => (
        <div key={label} className="flex justify-between items-center text-gray-700">
          <span>{label}</span>
          <span className="font-semibold font-mono">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

const ProductionSheet = React.forwardRef<HTMLDivElement, {
  title: string;
  date: string;
  listTitle: string;
  items: BomItem[];
  isGlass: boolean;
  summary: React.ReactNode;
  notes: string;
  onNotesChange: (value: string) => void;
  budgetNumber: string;
}>(({ title, date, listTitle, items, isGlass, summary, notes, onNotesChange, budgetNumber }, ref) => (
  <div ref={ref} className="print-container bg-white p-8 mx-auto border" style={{ width: '210mm', minHeight: '297mm' }}>
    <header className="text-center pb-6 border-b relative">
      <div className="absolute top-0 right-0 text-xs text-gray-400">Nº {budgetNumber}</div>
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <p className="text-sm text-gray-500">{date}</p>
    </header>
    <main className="flex-grow">
      <section className="mt-6">
        <h2 className="text-xl font-semibold text-primary mb-4">{listTitle}</h2>
        <ProductionListTable items={items} isGlass={isGlass} />
      </section>
    </main>
    <footer className="mt-auto">
      <section className="mt-8 pt-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Observações:</h3>
        <textarea
          className="w-full h-24 border border-dashed border-gray-300 rounded-md p-2 text-sm resize-none"
          placeholder="Digite suas observações aqui..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </section>
      <section>
        {summary}
      </section>
    </footer>
  </div>
));

interface ProductionModuleProps {
  bom: BomItem[];
  notes: ProductionNotes;
  setNotes: (notes: ProductionNotes | ((prev: ProductionNotes) => ProductionNotes)) => void;
  budgetNumber: string;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({ bom, notes, setNotes, budgetNumber }) => {
  const [activeSheet, setActiveSheet] = useState<'glass' | 'profiles'>('glass');
  const glassSheetRef = useRef<HTMLDivElement>(null);
  const profileSheetRef = useRef<HTMLDivElement>(null);

  const glassItems = useMemo(() => bom.filter(item => item.thickness !== undefined), [bom]);
  const profileItems = useMemo(() => bom.filter(item => item.thickness === undefined), [bom]);

  const glassSummaryData = useMemo(() => {
    const totalsByThickness: { [key: number]: number } = {};
    glassItems.forEach(item => {
      const area = item.quantity * (item.width / 100) * (item.height / 100);
      const thickness = item.thickness || 0;
      totalsByThickness[thickness] = (totalsByThickness[thickness] || 0) + area;
    });

    return Object.entries(totalsByThickness)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([thickness, totalArea]) => ({
        label: `Total Vidro ${thickness}mm:`,
        value: `${totalArea.toFixed(2)} m²`,
      }));
  }, [glassItems]);

  const profileSummaryData = useMemo(() => {
    let totalMeters = 0;
    profileItems.forEach(item => {
      const widthM = item.width / 100;
      const heightM = item.height / 100;
      let itemLengthM = 0;

      if (item.item === 'FRENTES') {
        // Frames (fronts) use perimeter
        itemLengthM = item.quantity * (2 * widthM + 2 * heightM);
      } else if (item.item === 'PERFIL QUADRO FRONTAL' || item.item === 'TRAVESSA') {
        // These are linear cuts, length is in 'width'
        itemLengthM = item.quantity * widthM;
      }
      totalMeters += itemLengthM;
    });

    const bars = Math.ceil(totalMeters / 6);
    return [
      {
        label: 'Gasto Total de Perfil:',
        value: `${totalMeters.toFixed(2)} m`,
      },
      {
        label: 'Barras de 6m necessárias:',
        value: `${bars} barra(s)`,
      }
    ];
  }, [profileItems]);

  const handleGenerateImage = () => {
    const targetRef = activeSheet === 'glass' ? glassSheetRef : profileSheetRef;
    const filename = activeSheet === 'glass' ? 'ficha_producao_vidros.png' : 'ficha_producao_perfis.png';
    
    if (targetRef.current) {
      const originalShadow = targetRef.current.style.boxShadow;
      targetRef.current.style.boxShadow = 'none';

      html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        if(targetRef.current) {
          targetRef.current.style.boxShadow = originalShadow;
        }
      });
    }
  };

  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const TabButton: React.FC<{sheetId: 'glass' | 'profiles'; label: string}> = ({sheetId, label}) => {
    const isActive = activeSheet === sheetId;
    return (
        <button
            onClick={() => setActiveSheet(sheetId)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            {label}
        </button>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 no-print gap-4">
        <div className="flex items-center space-x-2 bg-gray-200/50 p-1 rounded-lg">
            <TabButton sheetId='glass' label="Ficha de Vidros" />
            <TabButton sheetId='profiles' label="Ficha de Perfis" />
        </div>
        <Button onClick={handleGenerateImage} disabled={bom.length === 0}>
          <PrinterIcon className="h-5 w-5 mr-2" />
          Gerar Imagem da Ficha
        </Button>
      </div>

      {bom.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            Nenhum item na lista. Configure o armário na aba 'Cálculos'.
          </div>
        </Card>
      ) : (
        <div>
          <div style={{ display: activeSheet === 'glass' ? 'block' : 'none' }}>
            <ProductionSheet
                ref={glassSheetRef}
                title="Ficha de Produção - Vidros"
                date={date}
                listTitle="Lista de Vidros"
                items={glassItems}
                isGlass={true}
                notes={notes.glass}
                onNotesChange={(value) => setNotes(prev => ({...prev, glass: value}))}
                summary={<SummaryDisplay title="Resumo de Vidros" data={glassSummaryData} />}
                budgetNumber={budgetNumber}
            />
          </div>
          <div style={{ display: activeSheet === 'profiles' ? 'block' : 'none' }}>
            <ProductionSheet
                ref={profileSheetRef}
                title="Ficha de Produção - Perfis"
                date={date}
                listTitle="Lista de Perfis e Frentes"
                items={profileItems}
                isGlass={false}
                notes={notes.profiles}
                onNotesChange={(value) => setNotes(prev => ({...prev, profiles: value}))}
                summary={<SummaryDisplay title="Resumo de Perfis" data={profileSummaryData} />}
                budgetNumber={budgetNumber}
            />
          </div>
        </div>
      )}
    </>
  );
};