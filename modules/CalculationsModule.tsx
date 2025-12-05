
import React, { useState, useMemo, useEffect } from 'react';
import { Estrutura, Vao, VaoType, CabinetCalculations, LayoutType, SpaceCalculationBreakdown } from '../types';
import { Input, Card, Button, Select, TrashIcon, MoveHorizontalIcon, PlusCircleIcon, AlertTriangleIcon } from '../components/ui';

interface CalculationsModuleProps {
  estrutura: Estrutura;
  setEstrutura: React.Dispatch<React.SetStateAction<Estrutura>>;
  vaos: Vao[];
  setVaos: React.Dispatch<React.SetStateAction<Vao[]>>;
  calculations: CabinetCalculations;
  budgetNumber: string;
}

const vaoTypeLabels: { [key in VaoType]: string } = {
  [VaoType.PortaDupla]: 'Porta Dupla',
  [VaoType.PortaUnica]: 'Porta Única',
  [VaoType.Gavetas]: 'Gavetas',
  [VaoType.PortaTempero]: 'Porta Tempero',
};

const CalculationBreakdownDisplay: React.FC<{ title: string, breakdown: SpaceCalculationBreakdown }> = ({ title, breakdown }) => {
    const { medidaFrente, acrescimoCanto, descontoLateral, descontoCanto, totalTravassas, espacoUtil, somaVaos, diferenca } = breakdown;
    const diffColor = Math.abs(diferenca) < 0.1 ? 'text-green-600' : 'text-red-600';

    const renderRow = (label: string, value: number, isTotal = false, isFinal = false, colorClass = 'text-gray-800') => (
        <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t' : ''} ${isFinal ? 'font-bold' : ''}`}>
            <span className="text-sm text-gray-600">{label}</span>
            <span className={`text-sm font-mono ${isFinal ? colorClass : 'text-gray-800'}`}>
                {value.toFixed(2)} cm
            </span>
        </div>
    );

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b">{title}</h3>
            <div className="space-y-1">
                {renderRow('Medida da Frente da Pedra', medidaFrente)}
                {acrescimoCanto > 0 && renderRow('(+) Acréscimo para Canto(s)', acrescimoCanto)}
                {descontoLateral > 0 && renderRow('(-) Desconto Lateral(ais)', -descontoLateral)}
                {descontoCanto > 0 && renderRow('(-) Desconto do Canto', -descontoCanto)}
                {totalTravassas > 0 && renderRow('(-) Desconto Travessa(s)', -totalTravassas)}
                {renderRow('(=) Espaço Útil para Vãos', espacoUtil, true, true)}
                <div className="pt-2"></div>
                {renderRow('Soma dos Vãos Definidos', somaVaos, true, true)}
                {renderRow('Diferença (Sobra / Falta)', diferenca, false, true, diffColor)}
            </div>
        </div>
    );
};


const VaoItem: React.FC<{
    vao: Vao;
    index: number;
    totalVaos: number;
    updateVao: (id: string, updatedVao: Vao) => void;
    removeVao: (id: string) => void;
    moveVao: (id: string, direction: 'up' | 'down') => void;
    calculatedWidth: number;
    isCorner: boolean;
}> = ({ vao, index, totalVaos, updateVao, removeVao, moveVao, calculatedWidth, isCorner }) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        updateVao(vao.id, { ...vao, [name]: isNumber ? parseFloat(value) || 0 : value });
    };

    return (
        <Card className={`flex flex-col gap-4 ${isCorner ? 'border-primary/50 ring-2 ring-primary/20' : ''}`}>
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-primary">{isCorner ? `Vão ${index + 1} (Canto)` : `Vão ${index + 1}`}</h3>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => moveVao(vao.id, 'up')} disabled={index === 0} aria-label="Mover para cima"><MoveHorizontalIcon className="h-4 w-4 rotate-90" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveVao(vao.id, 'down')} disabled={index === totalVaos - 1} aria-label="Mover para baixo"><MoveHorizontalIcon className="h-4 w-4 -rotate-90" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => removeVao(vao.id)} aria-label="Remover vão"><TrashIcon className="h-4 w-4" /></Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Tipo de Vão" name="tipo" value={vao.tipo} onChange={handleInputChange} disabled={isCorner}>
                    {isCorner ? (
                        <option value={VaoType.PortaUnica}>Porta de Canto</option>
                    ) : (
                        Object.entries(vaoTypeLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))
                    )}
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

                {vao.tipo === VaoType.Gavetas && !isCorner && (
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

const VaoList: React.FC<{
    side: 'A' | 'B' | 'C';
    vaos: Vao[];
    calculations: CabinetCalculations;
    addVao: (side: 'A' | 'B' | 'C') => void;
    updateVao: (id: string, updatedVao: Vao) => void;
    removeVao: (id: string) => void;
    moveVao: (id: string, direction: 'up' | 'down') => void;
    cornerVaoIds: string[];
}> = ({ side, vaos, calculations, addVao, updateVao, removeVao, moveVao, cornerVaoIds }) => {
    const sideVaos = vaos.filter(v => v.side === side);
    return (
        <div className="space-y-4">
            {sideVaos.map((vao, index) => {
                const calculatedVao = calculations.calculatedVaos.find(cv => cv.id === vao.id);
                return (
                    <VaoItem
                        key={vao.id}
                        vao={vao}
                        index={index}
                        totalVaos={sideVaos.length}
                        updateVao={updateVao}
                        removeVao={removeVao}
                        moveVao={moveVao}
                        calculatedWidth={calculatedVao?.finalWidth || 0}
                        isCorner={cornerVaoIds.includes(vao.id)}
                    />
                );
            })}
            <Button onClick={() => addVao(side)} className="w-full">
                <PlusCircleIcon className="h-5 w-5 mr-2"/> Adicionar Vão
            </Button>
        </div>
    );
};


export const CalculationsModule: React.FC<CalculationsModuleProps> = ({ estrutura, setEstrutura, vaos, setVaos, calculations, budgetNumber }) => {
  
  const handleEstruturaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;
    setEstrutura(prev => {
        const isCheckbox = type === 'checkbox';
        const isNumeric = type === 'number';
        const isSelect = e.target.tagName.toLowerCase() === 'select';

        let finalValue: any = value;
        if(isCheckbox) finalValue = target.checked;
        if(isNumeric) finalValue = parseFloat(value) || 0;
        if(isSelect && !isNaN(Number(value))) finalValue = parseFloat(value);
      
        const newEstrutura = { ...prev, [name]: finalValue };

        return newEstrutura;
    });
  };
  
  const addVao = (side: 'A' | 'B' | 'C') => {
    setVaos([...vaos, { id: new Date().toISOString(), tipo: VaoType.PortaDupla, vaoLargura: 0, numGavetas: 4, side }]);
  };

  const removeVao = (id: string) => {
    setVaos(vaos.filter(v => v.id !== id));
  };
  
  const updateVao = (id: string, updatedVao: Vao) => {
    setVaos(vaos.map(v => v.id === id ? updatedVao : v));
  };

  const moveVao = (id: string, direction: 'up' | 'down') => {
    const currentIndex = vaos.findIndex(v => v.id === id);
    if (currentIndex < 0) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= vaos.length) return;
    
    const newVaos = [...vaos];
    const [movedItem] = newVaos.splice(currentIndex, 1);
    newVaos.splice(newIndex, 0, movedItem);

    setVaos(newVaos);
  };

  const cornerVaoIds = useMemo(() => {
    if (estrutura.layout !== LayoutType.EmL && estrutura.layout !== LayoutType.EmU) return [];
    const ids: string[] = [];
    
    if (estrutura.possuiPortaCantoAB) {
        const vaosLadoA = vaos.filter(v => v.side === 'A');
        if (vaosLadoA.length > 0) ids.push(vaosLadoA[vaosLadoA.length - 1].id);
        const vaosLadoB = vaos.filter(v => v.side === 'B');
        if (vaosLadoB.length > 0) ids.push(vaosLadoB[0].id);
    }

    if (estrutura.layout === LayoutType.EmU && estrutura.possuiPortaCantoBC) {
        const vaosLadoB = vaos.filter(v => v.side === 'B');
        if (vaosLadoB.length > 0) ids.push(vaosLadoB[vaosLadoB.length - 1].id);
        const vaosLadoC = vaos.filter(v => v.side === 'C');
        if (vaosLadoC.length > 0) ids.push(vaosLadoC[0].id);
    }
    
    return Array.from(new Set(ids));
  }, [estrutura.layout, estrutura.possuiPortaCantoAB, estrutura.possuiPortaCantoBC, vaos]);

  useEffect(() => {
    if (cornerVaoIds.length > 0) {
        const vaosToUpdate = vaos.filter(v => cornerVaoIds.includes(v.id));
        if (vaosToUpdate.some(v => v.tipo !== VaoType.PortaUnica)) {
            setVaos(currentVaos => currentVaos.map(v => 
                cornerVaoIds.includes(v.id) ? { ...v, tipo: VaoType.PortaUnica } : v
            ));
        }
    }
  }, [cornerVaoIds, vaos, setVaos]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna de Inputs */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary">1. Estrutura</h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded border">Nº {budgetNumber}</span>
            </div>
            <div className="space-y-4">
              <Select label="Formato do Armário" id="layout" name="layout" value={estrutura.layout} onChange={handleEstruturaChange}>
                  <option value={LayoutType.Reto}>Reto</option>
                  <option value={LayoutType.EmL}>Em L</option>
                  <option value={LayoutType.EmU}>Em U</option>
              </Select>
              
              {estrutura.layout === LayoutType.Reto && (
                <>
                  <Input label="Medida da Pedra" id="comprimentoPedra" name="comprimentoPedra" type="number" unit="cm" value={estrutura.comprimentoPedra} onChange={handleEstruturaChange} />
                   <Select label="Número de Laterais" id="numLaterais" name="numLaterais" value={estrutura.numLaterais} onChange={handleEstruturaChange}>
                      <option value={0}>0 Laterais (sem desconto)</option>
                      <option value={1}>1 Lateral (desconto de 2cm)</option>
                      <option value={2}>2 Laterais (desconto de 4cm)</option>
                  </Select>
                  <Input label="Profundidade da Pedra" id="profundidadePedra" name="profundidadePedra" type="number" unit="cm" value={estrutura.profundidadePedra} onChange={handleEstruturaChange} />
                </>
              )}

              <Input label="Altura Total" id="alturaTotal" name="alturaTotal" type="number" unit="cm" value={estrutura.alturaTotal} onChange={handleEstruturaChange} />
              <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="possuiBase" name="possuiBase" checked={estrutura.possuiBase} onChange={handleEstruturaChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="possuiBase" className="text-sm font-medium text-gray-700">Possui base de 10cm</label>
              </div>
              
              {(estrutura.layout === LayoutType.EmL || estrutura.layout === LayoutType.EmU) && (
                <div className="flex items-center space-x-2 pt-2">
                    <input type="checkbox" id="possuiPortaCantoAB" name="possuiPortaCantoAB" checked={estrutura.possuiPortaCantoAB} onChange={handleEstruturaChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="possuiPortaCantoAB" className="text-sm font-medium text-gray-700">Porta de canto (A-B)</label>
                </div>
              )}
              {estrutura.layout === LayoutType.EmU && (
                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="possuiPortaCantoBC" name="possuiPortaCantoBC" checked={estrutura.possuiPortaCantoBC} onChange={handleEstruturaChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="possuiPortaCantoBC" className="text-sm font-medium text-gray-700">Porta de canto (B-C)</label>
                </div>
              )}
            </div>
        </Card>
        
        {(estrutura.layout === LayoutType.EmL || estrutura.layout === LayoutType.EmU) && (
            <>
            <Card>
                <h3 className="text-lg font-bold mb-3 text-primary">Lado A</h3>
                <div className="space-y-4">
                    <Input label="Medida da Frente (A)" name="ladoAComprimento" type="number" unit="cm" value={estrutura.ladoAComprimento} onChange={handleEstruturaChange} />
                    <Input label="Profundidade da Pedra (A)" name="profundidadePedraA" type="number" unit="cm" value={estrutura.profundidadePedraA} onChange={handleEstruturaChange} />
                    <div className="flex items-center space-x-2 pt-2">
                        <input type="checkbox" id="ladoATemLateral" name="ladoATemLateral" checked={estrutura.ladoATemLateral} onChange={handleEstruturaChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="ladoATemLateral" className="text-sm font-medium text-gray-700">Possui lateral neste lado</label>
                    </div>
                </div>
            </Card>
            <Card>
                <h3 className="text-lg font-bold mb-3 text-primary">Lado B</h3>
                <div className="space-y-4">
                    <Input label="Medida da Frente (B)" name="ladoBComprimento" type="number" unit="cm" value={estrutura.ladoBComprimento} onChange={handleEstruturaChange} />
                    {estrutura.layout === LayoutType.EmL && (
                      <>
                        <Input label="Profundidade da Pedra (B)" name="profundidadePedraB" type="number" unit="cm" value={estrutura.profundidadePedraB} onChange={handleEstruturaChange} />
                        <div className="flex items-center space-x-2 pt-2">
                            <input type="checkbox" id="ladoBTemLateral" name="ladoBTemLateral" checked={estrutura.ladoBTemLateral} onChange={handleEstruturaChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="ladoBTemLateral" className="text-sm font-medium text-gray-700">Possui lateral neste lado</label>
                        </div>
                      </>
                    )}
                </div>
            </Card>
            </>
        )}
         {estrutura.layout === LayoutType.EmU && (
            <Card>
                <h3 className="text-lg font-bold mb-3 text-primary">Lado C</h3>
                <div className="space-y-4">
                    <Input label="Medida da Frente (C)" name="ladoCComprimento" type="number" unit="cm" value={estrutura.ladoCComprimento} onChange={handleEstruturaChange} />
                    <Input label="Profundidade da Pedra (C)" name="profundidadePedraC" type="number" unit="cm" value={estrutura.profundidadePedraC} onChange={handleEstruturaChange} />
                    <div className="flex items-center space-x-2 pt-2">
                        <input type="checkbox" id="ladoCTemLateral" name="ladoCTemLateral" checked={estrutura.ladoCTemLateral} onChange={handleEstruturaChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="ladoCTemLateral" className="text-sm font-medium text-gray-700">Possui lateral neste lado</label>
                    </div>
                </div>
            </Card>
         )}
      </div>

      {/* Coluna de Vãos e Resultados */}
      <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">2. Aberturas (Vãos)</h2>
            {estrutura.layout === LayoutType.Reto ? (
                <VaoList side="A" vaos={vaos} calculations={calculations} addVao={() => addVao('A')} updateVao={updateVao} removeVao={removeVao} moveVao={moveVao} cornerVaoIds={[]} />
            ) : estrutura.layout === LayoutType.EmL ? (
                <div className="flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">Vãos do Lado A</h3>
                        <VaoList side="A" vaos={vaos} calculations={calculations} addVao={addVao} updateVao={updateVao} removeVao={removeVao} moveVao={moveVao} cornerVaoIds={cornerVaoIds} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">Vãos do Lado B</h3>
                        <VaoList side="B" vaos={vaos} calculations={calculations} addVao={addVao} updateVao={updateVao} removeVao={removeVao} moveVao={moveVao} cornerVaoIds={cornerVaoIds} />
                    </div>
                </div>
            ) : ( // EmU
                 <div className="flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">Vãos do Lado A</h3>
                        <VaoList side="A" vaos={vaos} calculations={calculations} addVao={addVao} updateVao={updateVao} removeVao={removeVao} moveVao={moveVao} cornerVaoIds={cornerVaoIds} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">Vãos do Lado B</h3>
                        <VaoList side="B" vaos={vaos} calculations={calculations} addVao={addVao} updateVao={updateVao} removeVao={removeVao} moveVao={moveVao} cornerVaoIds={cornerVaoIds} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">Vãos do Lado C</h3>
                        <VaoList side="C" vaos={vaos} calculations={calculations} addVao={addVao} updateVao={updateVao} removeVao={removeVao} moveVao={moveVao} cornerVaoIds={cornerVaoIds} />
                    </div>
                </div>
            )}
          </Card>
        
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
            {estrutura.layout === LayoutType.Reto ? (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Largura do Quadro Frontal</p>
                        <p className="text-lg font-semibold text-primary">{calculations.totalComprimentoUtil.toFixed(2)} cm</p>
                    </div>
                     <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Altura do Quadro</p>
                        <p className="text-lg font-semibold text-primary">{calculations.alturaQuadro.toFixed(2)} cm</p>
                    </div>
                </div>
            ) : estrutura.layout === LayoutType.EmL ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Perfil Frontal (Lado A)</p>
                        <p className="text-lg font-semibold text-primary">{(calculations.quadroWidthA || 0).toFixed(2)} cm</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Perfil Frontal (Lado B)</p>
                        <p className="text-lg font-semibold text-primary">{(calculations.quadroWidthB || 0).toFixed(2)} cm</p>
                    </div>
                     <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Altura do Quadro</p>
                        <p className="text-lg font-semibold text-primary">{calculations.alturaQuadro.toFixed(2)} cm</p>
                    </div>
                </div>
            ) : ( // EmU
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Perfil Frontal (A)</p>
                        <p className="text-lg font-semibold text-primary">{(calculations.quadroWidthA || 0).toFixed(2)} cm</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Perfil Frontal (B)</p>
                        <p className="text-lg font-semibold text-primary">{(calculations.quadroWidthB || 0).toFixed(2)} cm</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Perfil Frontal (C)</p>
                        <p className="text-lg font-semibold text-primary">{(calculations.quadroWidthC || 0).toFixed(2)} cm</p>
                    </div>
                     <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm text-muted-foreground">Altura do Quadro</p>
                        <p className="text-lg font-semibold text-primary">{calculations.alturaQuadro.toFixed(2)} cm</p>
                    </div>
                </div>
            )}
        </Card>

        {calculations.spaceCalculationDetails && (
          <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">Detalhamento do Cálculo de Espaço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {calculations.spaceCalculationDetails.reto && (
                    <CalculationBreakdownDisplay title="Armário Reto" breakdown={calculations.spaceCalculationDetails.reto} />
                )}
                {calculations.spaceCalculationDetails.ladoA && (
                    <CalculationBreakdownDisplay title="Lado A" breakdown={calculations.spaceCalculationDetails.ladoA} />
                )}
                {calculations.spaceCalculationDetails.ladoB && (
                    <CalculationBreakdownDisplay title="Lado B" breakdown={calculations.spaceCalculationDetails.ladoB} />
                )}
                {calculations.spaceCalculationDetails.ladoC && (
                    <CalculationBreakdownDisplay title="Lado C" breakdown={calculations.spaceCalculationDetails.ladoC} />
                )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};