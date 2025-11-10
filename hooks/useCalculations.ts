import { useMemo } from 'react';
import { Estrutura, Vao, VaoType, CabinetCalculations, BomItem, BudgetInputs, BudgetCalculations } from '../types';

const round = (num: number) => Math.round(num * 100) / 100;

export function useCabinetCalculations(estrutura: Estrutura, vaos: Vao[]): CabinetCalculations {
  return useMemo(() => {
    const { pedraComprimento, alturaTotal, lateraisComVidro, possuiBase, pedraProfundidade } = estrutura;

    // 1. Quadro, Vão Interno e Base
    const comprimentoUtil = round(pedraComprimento - (lateraisComVidro * 2));
    const alturaQuadro = round(possuiBase ? alturaTotal - 10 : alturaTotal);
    const internoLargura = round(comprimentoUtil - 4);
    const internoAltura = round(alturaQuadro - 4);

    // 2. Divisórias
    const nDivisorias = vaos.length > 0 ? vaos.length - 1 : 0;
    const alturaDiv = round(alturaQuadro - 4);
    const consumoLarguraDivisorias = round(nDivisorias * 1.5);
    const larguraUtilVãos = round(internoLargura - consumoLarguraDivisorias);

    // 3. Distribuição de Vãos
    const larguraFixos = round(vaos.reduce((sum, v) => v.vaoLargura > 0 ? sum + v.vaoLargura : sum, 0));
    const resto = round(larguraUtilVãos - larguraFixos);

    const numPortasDuplasFlex = vaos.filter(v => v.tipo === VaoType.PortaDupla && v.vaoLargura === 0).length;
    const numPortasUnicasFlex = vaos.filter(v => v.tipo === VaoType.PortaUnica && v.vaoLargura === 0).length;
    
    const totalPesos = (numPortasDuplasFlex * 2) + (numPortasUnicasFlex * 1);
    const unidadeDistribuicao = totalPesos > 0 ? round(resto / totalPesos) : 0;

    const warnings: string[] = [];
    if (resto < 0) {
      warnings.push(`Excesso de ${Math.abs(resto).toFixed(2)} cm. Reduza a largura dos vãos fixos.`);
    } else if (resto > 0 && totalPesos === 0) {
      warnings.push(`Sobra de ${resto.toFixed(2)} cm. Adicione vãos flexíveis ou aumente vãos fixos.`);
    }

    const calculatedVaos = vaos.map(vao => {
      let finalWidth = vao.vaoLargura;
      if (vao.vaoLargura === 0) {
        if (vao.tipo === VaoType.PortaDupla) finalWidth = round(unidadeDistribuicao * 2);
        if (vao.tipo === VaoType.PortaUnica) finalWidth = round(unidadeDistribuicao * 1);
      }
      return { ...vao, finalWidth };
    });

    // 4. BOM (Bill of Materials) Generation
    const bom: BomItem[] = [];

    // Perfis 20x45
    bom.push({ id: 'p1', category: 'Perfis 20x45', item: 'Travessa Superior/Inferior', quantity: 2, width: comprimentoUtil, height: 4.5 });
    bom.push({ id: 'p2', category: 'Perfis 20x45', item: 'Montante Esquerdo/Direito', quantity: 2, width: 4.5, height: alturaQuadro });

    // Divisórias 15x45
    if (nDivisorias > 0) {
      bom.push({ id: 'd1', category: 'Divisórias 15x45', item: 'Divisória reta', quantity: nDivisorias, width: 1.5, height: alturaDiv });
    }

    const alturaFrente = round(internoAltura + 2);

    calculatedVaos.forEach((vao, index) => {
      const vaoId = `vao-${index + 1}`;
      switch (vao.tipo) {
        case VaoType.PortaDupla:
          const larguraFolha = round((vao.finalWidth + 0.7) / 2);
          bom.push({ id: `${vaoId}-pd`, category: `Vao ${index + 1}: Porta Dupla`, item: 'Frente (folha)', quantity: 2, width: larguraFolha, height: alturaFrente });
          bom.push({ id: `${vaoId}-pd-vf`, category: `Vao ${index + 1}: Porta Dupla`, item: 'Vidro da Frente', quantity: 2, width: round(larguraFolha - 0.4), height: round(alturaFrente - 0.4), thickness: 6 });
          bom.push({ id: `${vaoId}-pd-vi`, category: `Vao ${index + 1}: Porta Dupla`, item: 'Vidro Interno (Prateleira)', quantity: 1, width: round(vao.finalWidth - 0.5), height: round(pedraProfundidade - 5), thickness: 6, notes: 'Profundidade' });
          break;
        case VaoType.PortaUnica:
          const larguraUnica = round(vao.finalWidth + 1);
          bom.push({ id: `${vaoId}-pu`, category: `Vao ${index + 1}: Porta Única`, item: 'Frente', quantity: 1, width: larguraUnica, height: alturaFrente });
          bom.push({ id: `${vaoId}-pu-vf`, category: `Vao ${index + 1}: Porta Única`, item: 'Vidro da Frente', quantity: 1, width: round(larguraUnica - 0.4), height: round(alturaFrente - 0.4), thickness: 6 });
          bom.push({ id: `${vaoId}-pu-vi`, category: `Vao ${index + 1}: Porta Única`, item: 'Vidro Interno (Prateleira)', quantity: 1, width: round(vao.finalWidth - 0.5), height: round(pedraProfundidade - 5), thickness: 6, notes: 'Profundidade' });
          break;
        case VaoType.PortaTempero:
          const larguraFrentePT = round(vao.finalWidth + 1);
          const baseLarguraPT = round(vao.finalWidth - 3);
          bom.push({ id: `${vaoId}-pt-frente`, category: `Vao ${index + 1}: Porta Tempero`, item: 'Frente', quantity: 1, width: larguraFrentePT, height: alturaFrente });
           bom.push({ id: `${vaoId}-pt-vf`, category: `Vao ${index + 1}: Porta Tempero`, item: 'Vidro da Frente', quantity: 1, width: round(larguraFrentePT - 0.4), height: round(alturaFrente - 0.4), thickness: 6 });
          bom.push({ id: `${vaoId}-pt-base`, category: `Vao ${index + 1}: Porta Tempero`, item: 'Base', quantity: 2, width: baseLarguraPT, height: 39.5, notes: "Profundidade" });
          bom.push({ id: `${vaoId}-pt-lat`, category: `Vao ${index + 1}: Porta Tempero`, item: 'Lateral interna', quantity: 4, width: 39.5, height: 7, notes: "Comprimento" });
          bom.push({ id: `${vaoId}-pt-fundo`, category: `Vao ${index + 1}: Porta Tempero`, item: 'Fundo/Frente interno', quantity: 4, width: round(baseLarguraPT - 1), height: 7 });
          break;
        case VaoType.Gavetas:
          if (vao.numGavetas > 0) {
            const folgasTotais = round((vao.numGavetas - 1) * 0.4);
            const frenteAltura = round((internoAltura + 2 - folgasTotais) / vao.numGavetas);
            const corpoLargura = round(vao.finalWidth - 3);
            const lateraisFundoAlt = round(frenteAltura - 5);
            const larguraFrenteGaveta = round(vao.finalWidth + 1);

            bom.push({ id: `${vaoId}-g-frente`, category: `Vao ${index + 1}: Gavetas`, item: 'Frente de Gaveta', quantity: vao.numGavetas, width: larguraFrenteGaveta, height: frenteAltura });
            bom.push({ id: `${vaoId}-g-vf`, category: `Vao ${index + 1}: Gavetas`, item: 'Vidro da Frente', quantity: vao.numGavetas, width: round(larguraFrenteGaveta - 0.4), height: round(frenteAltura - 0.4), thickness: 5 });
            bom.push({ id: `${vaoId}-g-base`, category: `Vao ${index + 1}: Gavetas`, item: 'Vidro - Base', quantity: vao.numGavetas, width: corpoLargura, height: 39.5, thickness: 5, notes: "Profundidade" });
            bom.push({ id: `${vaoId}-g-fundo`, category: `Vao ${index + 1}: Gavetas`, item: 'Vidro - Fundo', quantity: vao.numGavetas, width: corpoLargura, height: lateraisFundoAlt, thickness: 5 });
            bom.push({ id: `${vaoId}-g-lat`, category: `Vao ${index + 1}: Gavetas`, item: 'Vidro - Lateral', quantity: vao.numGavetas * 2, width: 39.5, height: lateraisFundoAlt, thickness: 5, notes: "Profundidade" });
          }
          break;
      }
    });

    return {
      comprimentoUtil,
      alturaQuadro,
      internoLargura,
      internoAltura,
      nDivisorias,
      larguraUtilVãos,
      larguraFixos,
      resto,
      unidadeDistribuicao,
      calculatedVaos,
      bom,
      warnings
    };
  }, [estrutura, vaos]);
}

const ACESSORIOS_PRECOS = {
  portaTempero: 180,
  gavetao: 250,
  gavetaDupla: 250,
  escorredor: 900,
  portaPano: 150,
  portaCanto: 150,
  lateria: 100,
};

export function useBudgetCalculations(inputs: BudgetInputs): BudgetCalculations {
  return useMemo(() => {
    const { larguraCm, alturaCm, precoML, acm, tintaMetalica, vidroReflecta, perfisPintados, acessorios } = inputs;
    
    // 1. Conversões
    const comprimentoM = round(larguraCm / 100);
    const fatorAltura = alturaCm > 0 ? round(alturaCm / 70) : 0;
    
    // 2. Preço ML aplicado
    const precoMLAplicado = round(precoML * (acm ? 1.10 : 1));
    
    // 3. Base
    const basePrice = round(comprimentoM * precoMLAplicado * fatorAltura);

    // 4. Acessórios
    const acessoriosPrice = round(
      Object.entries(acessorios).reduce((total, [key, qty]) => {
        return total + qty * ACESSORIOS_PRECOS[key as keyof typeof ACESSORIOS_PRECOS];
      }, 0)
    );
    
    // 5. Subtotal
    const subtotal = round(basePrice + acessoriosPrice);
    
    // 6. Modificadores
    const multTinta = tintaMetalica ? 1.05 : 1;
    const multVidro = vidroReflecta ? 1.15 : 1;
    const multPerfis = perfisPintados ? 1.15 : 1;
    const multiplicadorAcabamento = round(multTinta * multVidro * multPerfis);

    const total = round(subtotal * multiplicadorAcabamento);

    return {
      comprimentoM,
      fatorAltura,
      precoMLAplicado,
      basePrice,
      acessoriosPrice,
      subtotal,
      total,
      multiplicadorAcabamento
    };

  }, [inputs]);
}