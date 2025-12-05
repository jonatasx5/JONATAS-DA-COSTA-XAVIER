
export enum VaoType {
  PortaDupla = 'porta-dupla',
  PortaUnica = 'porta-unica',
  Gavetas = 'gavetas',
  PortaTempero = 'porta-tempero',
}

export enum LayoutType {
  Reto = 'reto',
  EmL = 'em-l',
  EmU = 'em-u',
}

export interface Vao {
  id: string;
  tipo: VaoType;
  vaoLargura: number; // 0 for flexible width
  numGavetas: number;
  side: 'A' | 'B' | 'C';
}

export interface Estrutura {
  layout: LayoutType;
  
  // Reto props
  comprimentoPedra: number;
  numLaterais: 0 | 1 | 2;
  
  // L & U props
  ladoAComprimento: number;
  ladoATemLateral: boolean;
  profundidadePedraA: number;
  
  ladoBComprimento: number;
  ladoBTemLateral: boolean;
  profundidadePedraB: number;

  // U only props
  ladoCComprimento: number;
  ladoCTemLateral: boolean;
  profundidadePedraC: number;
  
  possuiPortaCantoAB: boolean;
  possuiPortaCantoBC: boolean;

  // Common props
  profundidadePedra: number;
  alturaTotal: number;
  possuiBase: boolean;
}

export interface CalculatedVao extends Vao {
  finalWidth: number;
}

export interface BomItem {
  id: string;
  category: string;
  item: string;
  quantity: number;
  width: number;
  height: number;
  thickness?: number;
  notes?: string;
  polishingDescription?: string;
}

export interface SpaceCalculationBreakdown {
  medidaFrente: number;
  acrescimoCanto?: number;
  descontoLateral: number;
  descontoCanto: number;
  totalTravassas: number;
  espacoUtil: number;
  somaVaos: number;
  diferenca: number;
}


export interface CabinetCalculations {
  alturaQuadro: number;
  calculatedVaos: CalculatedVao[];
  bom: BomItem[];
  warnings: string[];
  
  // Reto specific
  totalComprimentoUtil: number; 

  // Em L & U specific
  quadroWidthA?: number;
  quadroWidthB?: number;
  quadroWidthC?: number;

  // Calculation details for UI
  spaceCalculationDetails?: {
    reto?: SpaceCalculationBreakdown;
    ladoA?: SpaceCalculationBreakdown;
    ladoB?: SpaceCalculationBreakdown;
    ladoC?: SpaceCalculationBreakdown;
  };
}

export interface BudgetInputs {
  type: 'inferior' | 'superior';
  layout: LayoutType;
  medidas: {
    ladoA: number;
    ladoB: number;
    ladoC: number;
  };
  alturaCm: number;
  precoML: number;
  distancia: number; // Nova propriedade
  acm: boolean;
  tintaMetalica: boolean;
  vidroReflecta: boolean;
  perfisPintados: boolean;
  acessorios: {
    portaTempero: number;
    gavetao: number;
    gavetaDupla: number;
    escorredor: number;
    portaPano: number;
    portaCanto: number;
    lateral: number;
  };
}

export interface BudgetCalculations {
  comprimentoM: number;
  fatorAltura: number;
  precoMLAplicado: number;
  basePrice: number;
  acessoriosPrice: number;
  subtotal: number;
  frete: number; // Nova propriedade
  total: number;
  multiplicadorAcabamento: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  contact: string;
  logo: string | null;
}

export interface ProductionNotes {
  glass: string;
  profiles: string;
}

export interface VisitData {
  clientName: string;
  clientAddress: string;
  cabinetType: 'inferior' | 'superior';
  cabinetModel: LayoutType;
  cabinetLocation: string;
  
  measurements: {
    ladoA: number;
    ladoB: number;
    ladoC: number;
  };
  
  hasBase: boolean;
  baseDetails: {
    height: number;
    depthA: number;
    depthB: number;
    depthC: number;
  };

  photo: string | null;
  notes: string;
}

export interface SavedProject {
  id: string;
  createdAt: number;
  lastModified: number;
  clientName: string;
  clientAddress: string;
  totalValue: number;
  status: 'Orçamento' | 'Visita Realizada' | 'Em Produção';
  estrutura: Estrutura;
  vaos: Vao[];
  budgetInputs: BudgetInputs;
  visitData: VisitData;
  productionNotes: ProductionNotes;
}
