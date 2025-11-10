
import React from 'react';
import { BomItem } from '../types';
import { Card, Button, DownloadIcon } from '../components/ui';

interface ProductionModuleProps {
  bom: BomItem[];
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({ bom }) => {

  const exportToCsv = () => {
    const headers = ['Categoria', 'Item', 'Qtd', 'Largura (cm)', 'Altura (cm)', 'Espessura (mm)', 'Notas'];
    const rows = bom.map(item => [
      `"${item.category}"`,
      `"${item.item}"`,
      item.quantity,
      item.width.toFixed(2),
      item.height.toFixed(2),
      item.thickness || '',
      `"${item.notes || ''}"`
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ficha_de_corte.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Ficha de Corte / Produção</h2>
        <Button onClick={exportToCsv} disabled={bom.length === 0}>
          <DownloadIcon className="h-5 w-5 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">Categoria</th>
              <th scope="col" className="px-6 py-3">Item</th>
              <th scope="col" className="px-6 py-3 text-center">Qtd</th>
              <th scope="col" className="px-6 py-3 text-right">Largura (cm)</th>
              <th scope="col" className="px-6 py-3 text-right">Altura (cm)</th>
              <th scope="col" className="px-6 py-3 text-right">Espessura (mm)</th>
              <th scope="col" className="px-6 py-3">Notas</th>
            </tr>
          </thead>
          <tbody>
            {bom.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhum item na lista. Configure o armário na aba 'Cálculos'.
                </td>
              </tr>
            ) : (
              bom.map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.category}</th>
                  <td className="px-6 py-4">{item.item}</td>
                  <td className="px-6 py-4 text-center">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-mono">{item.width.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono">{item.height.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono">{item.thickness ? `${item.thickness}mm` : '-'}</td>
                  <td className="px-6 py-4">{item.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};