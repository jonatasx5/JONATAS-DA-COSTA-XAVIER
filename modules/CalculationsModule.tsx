
import React from 'react';
import { Estrutura, Vao, VaoType, CabinetCalculations } from '../types';
import { Input, Card, Button, Select, TrashIcon, MoveHorizontalIcon, PlusCircleIcon, AlertTriangleIcon } from '../components/ui';

interface CalculationsModuleProps {
  estrutura: Estrutura;
  setEstrutura: React.Dispatch<React.SetStateAction<Estrutura>>;
  vaos: Vao[];
  setVaos: React.Dispatch<React.SetStateAction<Vao[]>>;
  calculations: CabinetCalculations;
}

const vaoTypeLabels: { [key in VaoType]: string } = {
  [VaoType.PortaDupla]: 'Porta Dupla',
  [VaoType.PortaUnica]: 'Porta Única',
  [VaoType.Gavetas]: 'Gavetas',
  [VaoType.PortaTempero]: 'Porta Tempero',
};

const VaoItem: React.FC<{
    vao: Vao;
    index: number;
    totalVaos: number;
    updateVao: (index: number, updatedVao: Vao) => void;
    removeVao: (index: number) => void;
    moveVao: (fromIndex: number, toIndex: number) => void;
    calculatedWidth: number;
}> = ({ vao, index, totalVaos, updateVao, removeVao, moveVao, calculatedWidth }) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        updateVao(index, { ...vao, [name]: isNumber ? parseFloat(value) || 0 : value });
    };

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-primary">Vão {index + 1}</h3>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => moveVao(index, index - 1)} disabled={index === 0}><MoveHorizontalIcon className="h-4 w-4 rotate-180" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveVao(index, index + 1)} disabled={index === totalVaos - 1}><MoveHorizontalIcon className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => removeVao(index)}><TrashIcon className="h-4 w-4" /></Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Tipo de Vão" name="tipo" value={vao.tipo} onChange={handleInputChange}>
                    {Object.entries(vaoTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </Select>

                <Input
                    label="Largura Fixa"
                    type="number"
                    name="vaoLargura"
                    unit="cm"
                    value={vao.vaoLargura}
                    onChange={handleInputChange}
                    placeholder="0 para auto"
                />

                {vao.tipo === VaoType.Gavetas && (
                    <Input
                        label="Nº de Gavetas"
                        type="number"
                        name="numGavetas"
                        value={vao.numGavetas}
                        onChange={handleInputChange}
                    />
                )}
            </div>
             <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
                <p className="text-sm text-blue-600">Largura Final Calculada</p>
                <p className="text-xl font-bold text-blue-800">{calculatedWidth.toFixed(2)} cm</p>
            </div>
        </Card>
    );
};


export const CalculationsModule: React.FC<CalculationsModuleProps> = ({ estrutura, setEstrutura, vaos, setVaos, calculations }) => {
  const handleEstruturaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEstrutura(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
    }));
  };

  const addVao = () => {
    setVaos([...vaos, { id: new Date().toISOString(), tipo: VaoType.PortaDupla, vaoLargura: 0, numGavetas: 4 }]);
  };

  const removeVao = (index: number) => {
    setVaos(vaos.filter((_, i) => i !== index));
  };
  
  const updateVao = (index: number, updatedVao: Vao) => {
    const newVaos = [...vaos];
    newVaos[index] = updatedVao;
    setVaos(newVaos);
  };

  const moveVao = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= vaos.length) return;
    const newVaos = [...vaos];
    const [movedItem] = newVaos.splice(fromIndex, 1);
    newVaos.splice(toIndex, 0, movedItem);
    setVaos(newVaos);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna de Inputs */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">1. Estrutura</h2>
            <div className="space-y-4">
            <Input label="Comprimento da Pedra" id="pedraComprimento" name="pedraComprimento" type="number" unit="cm" value={estrutura.pedraComprimento} onChange={handleEstruturaChange} />
            <Input label="Profundidade da Pedra" id="pedraProfundidade" name="pedraProfundidade" type="number" unit="cm" value={estrutura.pedraProfundidade} onChange={handleEstruturaChange} />
            <Input label="Altura Total" id="alturaTotal" name="alturaTotal" type="number" unit="cm" value={estrutura.alturaTotal} onChange={handleEstruturaChange} />
            <Input label="Laterais com Vidro" id="lateraisComVidro" name="lateraisComVidro" type="number" value={estrutura.lateraisComVidro} onChange={handleEstruturaChange} />
            <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="possuiBase" name="possuiBase" checked={estrutura.possuiBase} onChange={handleEstruturaChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="possuiBase" className="text-sm font-medium text-gray-700">Construir base de 10cm</label>
            </div>
            </div>
        </Card>

        <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">2. Aberturas (Vãos)</h2>
            <p className="text-sm text-gray-600 mb-4">Adicione e configure os vãos da esquerda para a direita.</p>
            <Button onClick={addVao} className="w-full">
                <PlusCircleIcon className="h-5 w-5 mr-2"/> Adicionar Vão
            </Button>
        </Card>
      </div>

      {/* Coluna de Vãos e Resultados */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="space-y-4">
            {vaos.map((vao, index) => (
                <VaoItem
                    key={vao.id}
                    vao={vao}
                    index={index}
                    totalVaos={vaos.length}
                    updateVao={updateVao}
                    removeVao={removeVao}
                    moveVao={moveVao}
                    calculatedWidth={calculations.calculatedVaos[index]?.finalWidth || 0}
                />
            ))}
        </div>
        
        {calculations.warnings.length > 0 && (
          <Card className="border-yellow-400 bg-yellow-50">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mr-3"/>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Alerta de Cálculo</h3>
                {calculations.warnings.map((warn, i) => (
                    <p key={i} className="text-sm text-yellow-700">{warn}</p>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">Resultados do Cálculo</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-secondary rounded-md">
                    <p className="text-sm text-muted-foreground">Comp. Útil</p>
                    <p className="text-lg font-semibold text-primary">{calculations.comprimentoUtil.toFixed(2)} cm</p>
                </div>
                 <div className="p-3 bg-secondary rounded-md">
                    <p className="text-sm text-muted-foreground">Altura Quadro</p>
                    <p className="text-lg font-semibold text-primary">{calculations.alturaQuadro.toFixed(2)} cm</p>
                </div>
                 <div className="p-3 bg-secondary rounded-md">
                    <p className="text-sm text-muted-foreground">Largura Interna</p>
                    <p className="text-lg font-semibold text-primary">{calculations.internoLargura.toFixed(2)} cm</p>
                </div>
                 <div className="p-3 bg-secondary rounded-md">
                    <p className="text-sm text-muted-foreground">Altura Interna</p>
                    <p className="text-lg font-semibold text-primary">{calculations.internoAltura.toFixed(2)} cm</p>
                </div>
                <div className="p-3 bg-secondary rounded-md">
                    <p className="text-sm text-muted-foreground">Larg. Vãos</p>
                    <p className="text-lg font-semibold text-primary">{calculations.larguraUtilVãos.toFixed(2)} cm</p>
                </div>
                <div className="p-3 bg-secondary rounded-md">
                    <p className="text-sm text-muted-foreground">Larg. Fixos</p>
                    <p className="text-lg font-semibold text-primary">{calculations.larguraFixos.toFixed(2)} cm</p>
                </div>
                <div className={`p-3 rounded-md ${calculations.resto < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                    <p className={`text-sm ${calculations.resto < 0 ? 'text-red-700' : 'text-green-700'}`}>Sobra/Excesso</p>
                    <p className={`text-lg font-semibold ${calculations.resto < 0 ? 'text-red-800' : 'text-green-800'}`}>{calculations.resto.toFixed(2)} cm</p>
                </div>
                 <div className="p-3 bg-secondary rounded-md">
                    <p className="text-sm text-muted-foreground">Unid. Distrib.</p>
                    <p className="text-lg font-semibold text-primary">{calculations.unidadeDistribuicao.toFixed(2)} cm</p>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};