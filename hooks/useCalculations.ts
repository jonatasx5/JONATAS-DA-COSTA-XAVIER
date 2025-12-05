
import { useMemo } from 'react';
import { Estrutura, Vao, VaoType, CabinetCalculations, BomItem, BudgetInputs, BudgetCalculations, CalculatedVao, LayoutType, SpaceCalculationBreakdown } from '../types';

// --- CONSTANTS ---
const PERFIL_RETO_THICKNESS = 2.0; // Espessura do perfil de quadro em uma ponta reta (cm)
const PERFIL_CANTO_THICKNESS = 4.5; // Espessura do perfil que forma o canto (cm)
const FOLGA_LADO_SEM_LATERAL = 0.5; // Folga na largura se não houver lateral (cm)
const ACRESCIMO_PERFIL_L = 8.5; // Acréscimo no comprimento do perfil para o layout em L (cm)
const TRAVESSA_THICKNESS = 1.5; // Espessura da travessa/divisória interna (cm)
const BASE_HEIGHT = 10.0; // Altura da base de alvenaria (cm)
const FOLGA_VÃO = 0.3; // Folga total (esquerda/direita) para portas/gavetas dentro de um vão (cm)
const FOLGA_ENTRE_FRENTES = 0.3; // Folga entre duas portas ou gavetas (cm)
const LARGURA_MOLDURA_FRENTE = 3.8; // Largura da moldura da frente para cálculo do vidro (cm)

// Helper function
const round = (num: number) => Math.round(num * 100) / 100;

// Helper object needed for BOM generation notes
const vaoTypeLabels: { [key in VaoType]: string } = {
  [VaoType.PortaDupla]: 'Porta Dupla',
  [VaoType.PortaUnica]: 'Porta Única',
  [VaoType.Gavetas]: 'Gavetas',
  [VaoType.PortaTempero]: 'Porta Tempero',
};


// --- BUDGET CALCULATION HOOK ---
export const useBudgetCalculations = (inputs: BudgetInputs): BudgetCalculations => {
  return useMemo(() => {
    const { type, layout, medidas, alturaCm, precoML, distancia, acm, tintaMetalica, vidroReflecta, perfisPintados, acessorios } = inputs;
    
    let totalLarguraCm = 0;
    if (layout === LayoutType.Reto) {
        totalLarguraCm = medidas.ladoA;
    } else if (layout === LayoutType.EmL) {
        totalLarguraCm = medidas.ladoA + medidas.ladoB;
    } else if (layout === LayoutType.EmU) {
        totalLarguraCm = medidas.ladoA + medidas.ladoB + medidas.ladoC;
    }

    const comprimentoM = totalLarguraCm / 100;
    
    // Lógica de Fator de Altura baseada no tipo (Inferior vs Superior)
    let fatorAltura = 1;
    
    if (type === 'superior') {
        // Para superiores, baseia-se no princípio de altura padrão 70cm.
        // O que passar ou faltar é proporcional.
        fatorAltura = alturaCm / 70;
    } else {
        // Para inferiores, não considera a altura na base de cálculo, apenas a metragem linear.
        fatorAltura = 1;
    }

    const precoMLModificado = acm ? precoML * 1.1 : precoML;
    
    // O preço aplicado é o preço modificado vezes o fator de altura (que só muda para superiores)
    const precoMLAplicado = precoMLModificado * fatorAltura;

    const basePrice = comprimentoM * precoMLAplicado;

    const acessoriosPrice =
      acessorios.portaTempero * 180 +
      acessorios.gavetao * 250 +
      acessorios.gavetaDupla * 250 +
      acessorios.escorredor * 950 +
      acessorios.portaPano * 180 +
      acessorios.portaCanto * 150 +
      acessorios.lateral * 100;

    const subtotal = basePrice + acessoriosPrice;

    let multiplicadorAcabamento = 1;
    if (tintaMetalica) multiplicadorAcabamento += 0.05;
    if (vidroReflecta) multiplicadorAcabamento += 0.15;
    if (perfisPintados) multiplicadorAcabamento += 0.15;

    const totalAntesFrete = subtotal * multiplicadorAcabamento;
    
    // Cálculo do Frete: R$ 4,00 por Km
    const frete = distancia * 4;

    const total = totalAntesFrete + frete;

    return {
      comprimentoM,
      fatorAltura,
      precoMLAplicado: round(precoMLAplicado),
      basePrice: round(basePrice),
      acessoriosPrice: round(acessoriosPrice),
      subtotal: round(subtotal),
      frete: round(frete),
      total: round(total),
      multiplicadorAcabamento: round(multiplicadorAcabamento),
    };
  }, [inputs]);
};

// --- CABINET CALCULATION HOOK ---
export const useCabinetCalculations = (estrutura: Estrutura, vaos: Vao[]): CabinetCalculations => {
  return useMemo(() => {
    const bom: BomItem[] = [];
    const warnings: string[] = [];
    let allCalculatedVaos: CalculatedVao[] = [];
    const spaceCalculationDetails: CabinetCalculations['spaceCalculationDetails'] = {};
    
    let quadroWidthA = 0;
    let quadroWidthB = 0;
    let quadroWidthC = 0;

    // --- Common Calculations ---
    const alturaQuadro = round(estrutura.alturaTotal - (estrutura.possuiBase ? BASE_HEIGHT : 0));

    const generateFrentesAndVidros = (vao: CalculatedVao) => {
        const vaoLarguraUtil = vao.finalWidth - FOLGA_VÃO;
        const vaoAlturaUtil = alturaQuadro - 1.2; // Standard vertical gap

        let frentes: { w: number, h: number }[] = [];
        const polishing = '4 cantos';

        let isCornerDoor = false;
        let isSideBCornerDoor = false;
        
        // Check for Corner AB
        if ((estrutura.layout === LayoutType.EmL || estrutura.layout === LayoutType.EmU) && estrutura.possuiPortaCantoAB) {
            const vaosLadoA = vaos.filter(v => v.side === 'A');
            if (vaosLadoA.length > 0 && vaosLadoA[vaosLadoA.length - 1].id === vao.id) isCornerDoor = true;
            const vaosLadoB = vaos.filter(v => v.side === 'B');
            if (vaosLadoB.length > 0 && vaosLadoB[0].id === vao.id) {
                isCornerDoor = true;
                isSideBCornerDoor = true;
            }
        }
        // Check for Corner BC (U-Shape)
        if (estrutura.layout === LayoutType.EmU && estrutura.possuiPortaCantoBC) {
            const vaosLadoB = vaos.filter(v => v.side === 'B');
            if (vaosLadoB.length > 0 && vaosLadoB[vaosLadoB.length - 1].id === vao.id) isCornerDoor = true;
            const vaosLadoC = vaos.filter(v => v.side === 'C');
            if (vaosLadoC.length > 0 && vaosLadoC[0].id === vao.id) {
                isCornerDoor = true;
                isSideBCornerDoor = true;
            }
        }

        let vaoLabel = isCornerDoor ? 'Porta de Canto' : vaoTypeLabels[vao.tipo];

        if (isCornerDoor) {
            let frenteWidth = vaoLarguraUtil; 
            if (isSideBCornerDoor) {
                frenteWidth = round(vaoLarguraUtil - 2.0);
            }
            frentes.push({ w: frenteWidth, h: vaoAlturaUtil });
        } else {
            switch (vao.tipo) {
                case VaoType.PortaDupla:
                    const portaDuplaW = round((vaoLarguraUtil - FOLGA_ENTRE_FRENTES) / 2);
                    frentes.push({ w: portaDuplaW, h: vaoAlturaUtil }, { w: portaDuplaW, h: vaoAlturaUtil });
                    break;
                case VaoType.PortaUnica:
                case VaoType.PortaTempero:
                    frentes.push({ w: vaoLarguraUtil, h: vaoAlturaUtil });
                    break;
                case VaoType.Gavetas:
                    if (vao.numGavetas > 0) {
                        const gavetaH = round((vaoAlturaUtil - (FOLGA_ENTRE_FRENTES * (vao.numGavetas - 1))) / vao.numGavetas);
                        for (let i = 0; i < vao.numGavetas; i++) {
                            frentes.push({ w: vaoLarguraUtil, h: gavetaH });
                        }
                    }
                    break;
            }
        }

        if (frentes.length > 0) {
            const sideNote = (estrutura.layout === LayoutType.EmL || estrutura.layout === LayoutType.EmU) ? ` (Lado ${vao.side})` : '';
            bom.push({ id: `frentes-${vao.id}`, category: 'Frentes', item: 'FRENTES', quantity: frentes.length, width: frentes[0].w, height: frentes[0].h, notes: `${vaoLabel}${sideNote}` });
            
            const vidroW = round(frentes[0].w - (LARGURA_MOLDURA_FRENTE * 2));
            const vidroH = round(frentes[0].h - (LARGURA_MOLDURA_FRENTE * 2));

            bom.push({
                id: `vidro-${vao.id}`,
                category: 'Vidros',
                item: 'VIDRO',
                quantity: frentes.length,
                width: vidroW,
                height: vidroH,
                thickness: 4,
                notes: `${vaoLabel}${sideNote}`,
                polishingDescription: polishing
            });
        }
    };
    
    const processCornerSide = (side: 'A' | 'B' | 'C', possuiPortaCanto: boolean): { quadroWidth: number, breakdown: SpaceCalculationBreakdown } => {
        const sideVaos = vaos.filter(v => v.side === side);
        let comprimento = 0, temLateral = false, profundidadePedra = 0;
        
        switch(side) {
            case 'A':
                comprimento = estrutura.ladoAComprimento;
                temLateral = estrutura.ladoATemLateral;
                profundidadePedra = estrutura.profundidadePedraA;
                break;
            case 'B': // Only used in L-shape context
                comprimento = estrutura.ladoBComprimento;
                temLateral = estrutura.ladoBTemLateral;
                profundidadePedra = estrutura.profundidadePedraB;
                break;
            case 'C': // Only used in U-shape context
                comprimento = estrutura.ladoCComprimento;
                temLateral = estrutura.ladoCTemLateral;
                profundidadePedra = estrutura.profundidadePedraC;
                break;
        }
        
        const descontoExtremidade = temLateral ? PERFIL_RETO_THICKNESS : FOLGA_LADO_SEM_LATERAL;
        const numTravessas = sideVaos.length > 0 ? sideVaos.length - 1 : 0;
        const espacoTotalTravessas = numTravessas * TRAVESSA_THICKNESS;

        const descontoQuadro = temLateral ? PERFIL_RETO_THICKNESS : FOLGA_LADO_SEM_LATERAL;
        const quadroFinalWidth = round(comprimento - descontoQuadro + ACRESCIMO_PERFIL_L);
        
        const descontoCanto = possuiPortaCanto ? PERFIL_CANTO_THICKNESS : TRAVESSA_THICKNESS;

        const espacoParaVaos = round(
            comprimento -
            descontoExtremidade +
            ACRESCIMO_PERFIL_L -
            descontoCanto -
            espacoTotalTravessas -
            PERFIL_RETO_THICKNESS
        );

        const vaosFixos = sideVaos.filter(v => v.vaoLargura > 0);
        const vaosFlexiveis = sideVaos.filter(v => v.vaoLargura <= 0);
        const larguraFixaTotal = vaosFixos.reduce((sum, v) => sum + v.vaoLargura, 0);

        let larguraFlexivel = 0;
        if (vaosFlexiveis.length > 0) {
            const espacoRestante = espacoParaVaos - larguraFixaTotal;
            if (espacoRestante < -0.01) {
                warnings.push(`Lado ${side}: Vãos fixos (${larguraFixaTotal.toFixed(2)}cm) excedem espaço (${espacoParaVaos.toFixed(2)}cm).`);
            }
            larguraFlexivel = round(espacoRestante / vaosFlexiveis.length);
        } else if (sideVaos.length > 0) {
            const diff = Math.abs(espacoParaVaos - larguraFixaTotal);
             if (diff > 0.1) {
                warnings.push(`Lado ${side}: Soma dos vãos (${larguraFixaTotal.toFixed(2)}cm) difere do espaço (${espacoParaVaos.toFixed(2)}cm).`);
            }
        }

        const calculatedVaos = sideVaos.map(vao => ({ ...vao, finalWidth: round(vao.vaoLargura > 0 ? vao.vaoLargura : larguraFlexivel) }));
        allCalculatedVaos.push(...calculatedVaos);
        
        const somaVaosFinal = calculatedVaos.reduce((sum, v) => sum + v.finalWidth, 0);
        const diferenca = espacoParaVaos - somaVaosFinal;

        bom.push({ id: `perfil-frente-${side}`, category: 'Perfis', item: 'PERFIL QUADRO FRONTAL', quantity: 2, width: quadroFinalWidth, height: 0, notes: `Lado ${side}` });
        if(numTravessas > 0) {
          bom.push({ id: `travessas-${side}`, category: 'Perfis', item: 'TRAVESSA', quantity: numTravessas, width: alturaQuadro, height: 0, notes: `Divisórias Lado ${side}` });
        }
        if (temLateral && profundidadePedra > 0) {
          const lateralWidth = round(profundidadePedra - 2.0);
          const lateralHeight = round(alturaQuadro + 2.0);
          bom.push({ id: `vidro-lateral-${side}`, category: 'Vidros', item: 'VIDRO LATERAL', quantity: 1, width: lateralWidth, height: lateralHeight, thickness: 4, notes: `Painel Lateral Lado ${side}`, polishingDescription: '4 cantos'});
        }
        
        const breakdown: SpaceCalculationBreakdown = {
            medidaFrente: comprimento,
            acrescimoCanto: ACRESCIMO_PERFIL_L,
            descontoLateral: descontoExtremidade,
            descontoCanto: descontoCanto + PERFIL_RETO_THICKNESS,
            totalTravassas: espacoTotalTravessas,
            espacoUtil: espacoParaVaos,
            somaVaos: somaVaosFinal,
            diferenca: diferenca
        };
        
        return { quadroWidth: quadroFinalWidth, breakdown };
    };

    if (estrutura.layout === LayoutType.EmL) {
        const resultA = processCornerSide('A', estrutura.possuiPortaCantoAB);
        quadroWidthA = resultA.quadroWidth;
        spaceCalculationDetails.ladoA = resultA.breakdown;

        const resultB = processCornerSide('B', estrutura.possuiPortaCantoAB);
        quadroWidthB = resultB.quadroWidth;
        spaceCalculationDetails.ladoB = resultB.breakdown;

        allCalculatedVaos.forEach(generateFrentesAndVidros);

        if (estrutura.possuiPortaCantoAB) {
            bom.push({ id: 'acessorio-porta-canto', category: 'Acessórios', item: 'SISTEMA PORTA DE CANTO', quantity: 1, width: 0, height: 0, notes: 'Mecanismo articulado para canto A-B' });
        }
        if(estrutura.possuiBase) {
            bom.push({ id: 'base-aluminio-A', category: 'Base', item: 'BASE ALUMINIO', quantity: 1, width: quadroWidthA, height: BASE_HEIGHT, notes: 'Estrutura da base (Lado A)' });
            bom.push({ id: 'base-aluminio-B', category: 'Base', item: 'BASE ALUMINIO', quantity: 1, width: quadroWidthB, height: BASE_HEIGHT, notes: 'Estrutura da base (Lado B)' });
        }

    } else if (estrutura.layout === LayoutType.EmU) {
        // --- U-SHAPE LOGIC ---
        // Side A (Corner Logic)
        const resultA = processCornerSide('A', estrutura.possuiPortaCantoAB);
        quadroWidthA = resultA.quadroWidth;
        spaceCalculationDetails.ladoA = resultA.breakdown;

        // Side C (Corner Logic)
        const resultC = processCornerSide('C', estrutura.possuiPortaCantoBC);
        quadroWidthC = resultC.quadroWidth;
        spaceCalculationDetails.ladoC = resultC.breakdown;
        
        // Side B (Middle Logic)
        const sideBVaos = vaos.filter(v => v.side === 'B');
        const acrescimoTotalCantosB = ACRESCIMO_PERFIL_L * 2;
        quadroWidthB = round(estrutura.ladoBComprimento + acrescimoTotalCantosB);
        const descontoCantoAB = estrutura.possuiPortaCantoAB ? PERFIL_CANTO_THICKNESS : TRAVESSA_THICKNESS;
        const descontoCantoBC = estrutura.possuiPortaCantoBC ? PERFIL_CANTO_THICKNESS : TRAVESSA_THICKNESS;
        const numTravessasB = sideBVaos.length > 0 ? sideBVaos.length - 1 : 0;
        const espacoTotalTravessasB = numTravessasB * TRAVESSA_THICKNESS;
        const espacoParaVaosB = round(quadroWidthB - descontoCantoAB - descontoCantoBC - espacoTotalTravessasB);

        const vaosFixosB = sideBVaos.filter(v => v.vaoLargura > 0);
        const vaosFlexiveisB = sideBVaos.filter(v => v.vaoLargura <= 0);
        const larguraFixaTotalB = vaosFixosB.reduce((sum, v) => sum + v.vaoLargura, 0);

        let larguraFlexivelB = 0;
        if (vaosFlexiveisB.length > 0) {
            const espacoRestanteB = espacoParaVaosB - larguraFixaTotalB;
            if (espacoRestanteB < -0.01) warnings.push(`Lado B: Vãos fixos (${larguraFixaTotalB.toFixed(2)}cm) excedem espaço (${espacoParaVaosB.toFixed(2)}cm).`);
            larguraFlexivelB = round(espacoRestanteB / vaosFlexiveisB.length);
        } else if (sideBVaos.length > 0) {
            const diffB = Math.abs(espacoParaVaosB - larguraFixaTotalB);
            if (diffB > 0.1) warnings.push(`Lado B: Soma dos vãos (${larguraFixaTotalB.toFixed(2)}cm) difere do espaço (${espacoParaVaosB.toFixed(2)}cm).`);
        }
        
        const calculatedVaosB = sideBVaos.map(vao => ({ ...vao, finalWidth: round(vao.vaoLargura > 0 ? vao.vaoLargura : larguraFlexivelB) }));
        allCalculatedVaos.push(...calculatedVaosB);
        
        const somaVaosFinalB = calculatedVaosB.reduce((sum, v) => sum + v.finalWidth, 0);
        spaceCalculationDetails.ladoB = {
            medidaFrente: estrutura.ladoBComprimento,
            acrescimoCanto: acrescimoTotalCantosB,
            descontoLateral: 0,
            descontoCanto: descontoCantoAB + descontoCantoBC,
            totalTravassas: espacoTotalTravessasB,
            espacoUtil: espacoParaVaosB,
            somaVaos: somaVaosFinalB,
            diferenca: espacoParaVaosB - somaVaosFinalB,
        };
        bom.push({ id: `perfil-frente-B`, category: 'Perfis', item: 'PERFIL QUADRO FRONTAL', quantity: 2, width: quadroWidthB, height: 0, notes: `Lado B` });
        if(numTravessasB > 0) bom.push({ id: `travessas-B`, category: 'Perfis', item: 'TRAVESSA', quantity: numTravessasB, width: alturaQuadro, height: 0, notes: `Divisórias Lado B` });

        // --- Post-calculation processing for all sides ---
        allCalculatedVaos.sort((a,b) => a.id.localeCompare(b.id)).forEach(generateFrentesAndVidros);

        if (estrutura.possuiPortaCantoAB) bom.push({ id: 'acessorio-porta-canto-ab', category: 'Acessórios', item: 'SISTEMA PORTA DE CANTO', quantity: 1, width: 0, height: 0, notes: 'Mecanismo articulado para canto A-B' });
        if (estrutura.possuiPortaCantoBC) bom.push({ id: 'acessorio-porta-canto-bc', category: 'Acessórios', item: 'SISTEMA PORTA DE CANTO', quantity: 1, width: 0, height: 0, notes: 'Mecanismo articulado para canto B-C' });
        
        if(estrutura.possuiBase) {
            bom.push({ id: 'base-aluminio-A', category: 'Base', item: 'BASE ALUMINIO', quantity: 1, width: quadroWidthA, height: BASE_HEIGHT, notes: 'Estrutura da base (Lado A)' });
            bom.push({ id: 'base-aluminio-B', category: 'Base', item: 'BASE ALUMINIO', quantity: 1, width: quadroWidthB, height: BASE_HEIGHT, notes: 'Estrutura da base (Lado B)' });
            bom.push({ id: 'base-aluminio-C', category: 'Base', item: 'BASE ALUMINIO', quantity: 1, width: quadroWidthC, height: BASE_HEIGHT, notes: 'Estrutura da base (Lado C)' });
        }

    } else {
        // --- RETO (STRAIGHT) LOGIC ---
        const descontoLaterais = estrutura.numLaterais * PERFIL_RETO_THICKNESS;
        const quadroProfileWidth = round(estrutura.comprimentoPedra - descontoLaterais);
        const internoLargura = round(quadroProfileWidth - (PERFIL_RETO_THICKNESS * 2));
        const numTravessas = vaos.length > 1 ? vaos.length - 1 : 0;
        const espacoTotalTravessas = numTravessas * TRAVESSA_THICKNESS;
        const espacoParaVaos = round(internoLargura - espacoTotalTravessas);

        const vaosFixos = vaos.filter(v => v.vaoLargura > 0);
        const vaosFlexiveis = vaos.filter(v => v.vaoLargura <= 0);
        const larguraFixaTotal = vaosFixos.reduce((sum, v) => sum + v.vaoLargura, 0);

        let larguraFlexivel = 0;
        if (vaosFlexiveis.length > 0) {
            const espacoRestante = espacoParaVaos - larguraFixaTotal;
            if (espacoRestante < -0.01) {
                warnings.push(`Vãos fixos (${larguraFixaTotal.toFixed(2)}cm) excedem o espaço disponível (${espacoParaVaos.toFixed(2)}cm).`);
            }
            larguraFlexivel = round(espacoRestante / vaosFlexiveis.length);
        } else if (vaos.length > 0) {
            const diff = Math.abs(espacoParaVaos - larguraFixaTotal);
            if (diff > 0.1) {
                warnings.push(`Soma dos vãos (${larguraFixaTotal.toFixed(2)}cm) não corresponde ao espaço disponível (${espacoParaVaos.toFixed(2)}cm). Diferença: ${diff.toFixed(2)}cm.`);
            }
        }

        allCalculatedVaos = vaos.map(vao => ({ ...vao, finalWidth: round(vao.vaoLargura > 0 ? vao.vaoLargura : larguraFlexivel) }));

        const somaVaosFinal = allCalculatedVaos.reduce((sum, v) => sum + v.finalWidth, 0);
        const diferenca = espacoParaVaos - somaVaosFinal;
        spaceCalculationDetails.reto = {
            medidaFrente: estrutura.comprimentoPedra,
            descontoLateral: descontoLaterais + (PERFIL_RETO_THICKNESS * 2),
            descontoCanto: 0,
            totalTravassas: espacoTotalTravessas,
            espacoUtil: espacoParaVaos,
            somaVaos: somaVaosFinal,
            diferenca: diferenca,
        };

        bom.push({ id: `perfil-frente`, category: 'Perfis', item: 'PERFIL QUADRO FRONTAL', quantity: 2, width: quadroProfileWidth, height: 0, notes: `Armário Reto` });
        bom.push({ id: `perfil-tras`, category: 'Perfis', item: 'PERFIL QUADRO TRASEIRO', quantity: 2, width: quadroProfileWidth, height: 0, notes: `Armário Reto` });
        if(numTravessas > 0) {
            bom.push({ id: `travessas`, category: 'Perfis', item: 'TRAVESSA', quantity: numTravessas, width: alturaQuadro, height: 0, notes: `Divisórias Internas` });
        }
        if (estrutura.numLaterais > 0 && estrutura.profundidadePedra > 0) {
            const lateralWidth = round(estrutura.profundidadePedra - 2.0);
            const lateralHeight = round(alturaQuadro + 2.0);
            bom.push({ id: 'vidro-lateral', category: 'Vidros', item: 'VIDRO LATERAL', quantity: estrutura.numLaterais, width: lateralWidth, height: lateralHeight, thickness: 4, notes: 'Painel Lateral', polishingDescription: '4 cantos' });
        }

        allCalculatedVaos.forEach(generateFrentesAndVidros);
        
        if(estrutura.possuiBase) {
            bom.push({ id: 'base-aluminio', category: 'Base', item: 'BASE ALUMINIO', quantity: 1, width: quadroProfileWidth, height: BASE_HEIGHT, notes: 'Estrutura da base' });
        }
    }
    
    // Common final processing for all layouts
    const finalCalculations = estrutura.layout === LayoutType.Reto 
        ? {
            totalComprimentoUtil: round(estrutura.comprimentoPedra - (estrutura.numLaterais * PERFIL_RETO_THICKNESS)),
            alturaQuadro,
            calculatedVaos: allCalculatedVaos,
            bom,
            warnings,
            spaceCalculationDetails,
          }
        : (estrutura.layout === LayoutType.EmL 
            ? {
                alturaQuadro,
                calculatedVaos: allCalculatedVaos,
                bom,
                warnings,
                totalComprimentoUtil: 0,
                quadroWidthA: quadroWidthA,
                quadroWidthB: quadroWidthB,
                spaceCalculationDetails,
              }
            : { // EmU
                alturaQuadro,
                calculatedVaos: allCalculatedVaos,
                bom,
                warnings,
                totalComprimentoUtil: 0,
                quadroWidthA: quadroWidthA,
                quadroWidthB: quadroWidthB,
                quadroWidthC: quadroWidthC,
                spaceCalculationDetails,
            }
        );

    const categoryOrder = ['Perfis', 'Frentes', 'Vidros', 'Base', 'Acessórios'];
    const sortedBom = finalCalculations.bom.sort((a, b) => {
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return a.item.localeCompare(b.item);
    });
    
    return { ...finalCalculations, bom: sortedBom };

  }, [estrutura, vaos]);
};
