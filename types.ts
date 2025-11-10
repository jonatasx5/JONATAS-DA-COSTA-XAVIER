export enum VaoType {
  PortaDupla = 'porta-dupla',
  PortaUnica = 'porta-unica',
  Gavetas = 'gavetas',
  PortaTempero = 'porta-tempero',
}

export interface Vao {
  id: string;
  tipo: VaoType;
  vaoLargura: number; // 0 for flexible width
  numGavetas: number;
}

export interface Estrutura {
  pedraComprimento: number;
  alturaTotal: number;
  lateraisComVidro: number;
  possuiBase: boolean;
  pedraProfundidade: number;
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
}

export interface CabinetCalculations {
  comprimentoUtil: number;
  alturaQuadro: number;
  internoLargura: number;
  internoAltura: number;
  nDivisorias: number;
  larguraUtilVãos: number;
  larguraFixos: number;
  resto: number;
  unidadeDistribuicao: number;
  calculatedVaos: CalculatedVao[];
  bom: BomItem[];
  warnings: string[];
}

export interface BudgetInputs {
  larguraCm: number;
  alturaCm: number;
  precoML: number;
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
    lateria: number;
  };
}

export interface BudgetCalculations {
  comprimentoM: number;
  fatorAltura: number;
  precoMLAplicado: number;
  basePrice: number;
  acessoriosPrice: number;
  subtotal: number;
  total: number;
  multiplicadorAcabamento: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  contact: string;
  logo: string | null;
}