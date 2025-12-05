
import React, { useState, useEffect } from 'react';
import { Estrutura, Vao, VaoType, CompanyProfile, BudgetInputs, ProductionNotes, LayoutType, VisitData } from './types';
import { useCabinetCalculations } from './hooks/useCalculations';
import { CalculationsModule } from './modules/CalculationsModule';
import { BudgetModule } from './modules/BudgetModule';
import { ProductionModule } from './modules/ProductionModule';
import { VisitModule } from './modules/VisitModule';
import { CompanyProfileModal } from './modules/CompanyProfileModal';
import { SettingsIcon, FileTextIcon, RulerIcon, CalculatorIcon, HammerIcon } from './components/ui';

type Tab = 'budget' | 'visita' | 'calculations' | 'production';

// Helper function to resize an image from a base64 string
const resizeImage = (base64Str: string, width: number, height: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = (errorEvent) => {
        console.error('Error loading image data:', errorEvent);
        reject(new Error('Failed to load image for resizing: ' + JSON.stringify(errorEvent, Object.getOwnPropertyNames(errorEvent))));
    }
  });

// Helper to update PWA icons and manifest
const updatePwaIcons = async (logoBase64: string, appName: string) => {
  try {
    const [icon192, icon512] = await Promise.all([
      resizeImage(logoBase64, 192, 192),
      resizeImage(logoBase64, 512, 512)
    ]);

    // Update favicon and apple-touch-icon
    let faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
    }
    faviconLink.href = icon192;

    let appleIconLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if(!appleIconLink) {
        appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleIconLink);
    }
    appleIconLink.href = icon192;


    // Fetch, update, and apply new manifest
    const response = await fetch('/manifest.json');
    const manifest = await response.json();

    manifest.name = appName;
    manifest.short_name = appName.length > 12 ? appName.substring(0, 9) + '...' : appName;
    manifest.icons = [
      { src: icon192, type: 'image/png', sizes: '192x192', purpose: 'any maskable' },
      { src: icon512, type: 'image/png', sizes: '512x512', purpose: 'any maskable' },
    ];

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);
    
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.href = manifestURL;
    }
  } catch (error) {
      console.error("Failed to update PWA icons:", error);
  }
};


const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('budget');
  const [budgetNumber, setBudgetNumber] = useState<string>('');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: 'PLANEJE-GO MOVEIS EM ALUMINIO E VIDRO',
    address: 'RUA U 45, VILA UNIÃO, QUADRA 29 LOTE 23 - CEP 74313-290',
    contact: '62995462653 (WhatsApp)',
    logo: null,
  });

  // Load from localStorage on initial render (Only Company Profile settings)
  useEffect(() => {
    const savedProfile = localStorage.getItem('companyProfile');
    if (savedProfile) {
      setCompanyProfile(JSON.parse(savedProfile));
    }
    handleNewBudget(true); // Generate initial budget number
  }, []);

  // Save to localStorage whenever profile changes
  useEffect(() => {
    localStorage.setItem('companyProfile', JSON.stringify(companyProfile));
    if (companyProfile.logo) {
      updatePwaIcons(companyProfile.logo, companyProfile.name);
    }
  }, [companyProfile]);


  const [estrutura, setEstrutura] = useState<Estrutura>({
    layout: LayoutType.Reto,
    comprimentoPedra: 300,
    numLaterais: 2,
    ladoAComprimento: 200,
    ladoATemLateral: true,
    profundidadePedraA: 60,
    ladoBComprimento: 150,
    ladoBTemLateral: true,
    profundidadePedraB: 60,
    ladoCComprimento: 100,
    ladoCTemLateral: true,
    profundidadePedraC: 60,
    possuiPortaCantoAB: false,
    possuiPortaCantoBC: false,
    profundidadePedra: 60,
    alturaTotal: 85,
    possuiBase: true,
  });

  const [vaos, setVaos] = useState<Vao[]>([
    { id: '1', tipo: VaoType.PortaDupla, vaoLargura: 0, numGavetas: 0, side: 'A' },
    { id: '2', tipo: VaoType.Gavetas, vaoLargura: 80, numGavetas: 4, side: 'A' },
    { id: '3', tipo: VaoType.PortaUnica, vaoLargura: 0, numGavetas: 0, side: 'A' },
  ]);

  const [productionNotes, setProductionNotes] = useState<ProductionNotes>({
    glass: '',
    profiles: '',
  });

  const [budgetInputs, setBudgetInputs] = useState<BudgetInputs>({
    type: 'inferior',
    layout: LayoutType.Reto,
    medidas: { ladoA: 300, ladoB: 0, ladoC: 0 },
    alturaCm: 85,
    precoML: 1400,
    distancia: 0,
    acm: false,
    tintaMetalica: false,
    vidroReflecta: false,
    perfisPintados: false,
    acessorios: { portaTempero: 0, gavetao: 0, gavetaDupla: 0, escorredor: 0, portaPano: 0, portaCanto: 0, lateral: 0 },
  });

  const [visitData, setVisitData] = useState<VisitData>({
    clientName: '',
    clientAddress: '',
    cabinetType: 'inferior',
    cabinetModel: LayoutType.Reto,
    cabinetLocation: 'Cozinha',
    measurements: { ladoA: 0, ladoB: 0, ladoC: 0 },
    hasBase: false,
    baseDetails: { height: 0, depthA: 0, depthB: 0, depthC: 0 },
    photo: null,
    notes: '',
  });
  
  const calculations = useCabinetCalculations(estrutura, vaos);

  const handleNewBudget = (force: boolean = false) => {
    if (!force) {
        if (!window.confirm("Tem certeza? Isso limpará todos os campos para um novo orçamento.")) {
            return;
        }
    }

    const now = new Date();
    const newId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    setBudgetNumber(newId);

    // Reset fields
    setBudgetInputs({
        type: 'inferior',
        layout: LayoutType.Reto,
        medidas: { ladoA: 300, ladoB: 0, ladoC: 0 },
        alturaCm: 85,
        precoML: 1400,
        distancia: 0,
        acm: false,
        tintaMetalica: false,
        vidroReflecta: false,
        perfisPintados: false,
        acessorios: { portaTempero: 0, gavetao: 0, gavetaDupla: 0, escorredor: 0, portaPano: 0, portaCanto: 0, lateral: 0 },
    });
    setVisitData({
        clientName: '',
        clientAddress: '',
        cabinetType: 'inferior',
        cabinetModel: LayoutType.Reto,
        cabinetLocation: 'Cozinha',
        measurements: { ladoA: 0, ladoB: 0, ladoC: 0 },
        hasBase: false,
        baseDetails: { height: 0, depthA: 0, depthB: 0, depthC: 0 },
        photo: null,
        notes: '',
    });
    setProductionNotes({ glass: '', profiles: '' });
    
    // Reset Estrutura/Vaos too if creating new
    setEstrutura({
        layout: LayoutType.Reto,
        comprimentoPedra: 300,
        numLaterais: 2,
        ladoAComprimento: 200,
        ladoATemLateral: true,
        profundidadePedraA: 60,
        ladoBComprimento: 150,
        ladoBTemLateral: true,
        profundidadePedraB: 60,
        ladoCComprimento: 100,
        ladoCTemLateral: true,
        profundidadePedraC: 60,
        possuiPortaCantoAB: false,
        possuiPortaCantoBC: false,
        profundidadePedra: 60,
        alturaTotal: 85,
        possuiBase: true,
    });
    setVaos([
        { id: '1', tipo: VaoType.PortaDupla, vaoLargura: 0, numGavetas: 0, side: 'A' },
    ]);
  };

  const TabButton: React.FC<{ tabId: Tab, label: string }> = ({ tabId, label }) => {
    const isActive = activeTab === tabId;
    return (
      <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground shadow'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {label}
      </button>
    );
  };
  
  const handleSaveProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    setIsCompanyModalOpen(false);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <CompanyProfileModal 
        isOpen={isCompanyModalOpen} 
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveProfile}
        currentProfile={companyProfile}
      />

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              {companyProfile.logo && <img src={companyProfile.logo} alt="Logo" className="h-10 w-auto" />}
              <h1 className="text-xl font-bold text-gray-800 hidden md:block">
                Planejador de Armários Pro
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleNewBudget(false)}
                className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
              >
                Novo
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden sm:flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                <TabButton tabId="budget" label="Orçamento" />
                <TabButton tabId="visita" label="Visita" />
                <TabButton tabId="calculations" label="Cálculos" />
                <TabButton tabId="production" label="Produção" />
              </nav>
              <button 
                onClick={() => setIsCompanyModalOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Configurações da Empresa"
              >
                  <SettingsIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24">
        {activeTab === 'budget' && (
            <BudgetModule 
                companyProfile={companyProfile}
                budgetInputs={budgetInputs}
                setBudgetInputs={setBudgetInputs}
                budgetNumber={budgetNumber}
            />
        )}
        {activeTab === 'visita' && (
            <VisitModule 
                visitData={visitData} 
                setVisitData={setVisitData} 
                companyProfile={companyProfile} 
                budgetNumber={budgetNumber}
            />
        )}
        {activeTab === 'calculations' && (
          <CalculationsModule 
            estrutura={estrutura} 
            setEstrutura={setEstrutura}
            vaos={vaos}
            setVaos={setVaos}
            calculations={calculations}
            budgetNumber={budgetNumber}
          />
        )}
        {activeTab === 'production' && <ProductionModule bom={calculations.bom} notes={productionNotes} setNotes={setProductionNotes} budgetNumber={budgetNumber} />}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
            onClick={() => setActiveTab('budget')}
            className={`flex flex-col items-center justify-center w-full py-1 ${activeTab === 'budget' ? 'text-primary' : 'text-gray-500'}`}
        >
            <FileTextIcon className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium">Orçamento</span>
        </button>
        <button
            onClick={() => setActiveTab('visita')}
            className={`flex flex-col items-center justify-center w-full py-1 ${activeTab === 'visita' ? 'text-primary' : 'text-gray-500'}`}
        >
            <RulerIcon className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium">Visita</span>
        </button>
        <button
            onClick={() => setActiveTab('calculations')}
            className={`flex flex-col items-center justify-center w-full py-1 ${activeTab === 'calculations' ? 'text-primary' : 'text-gray-500'}`}
        >
            <CalculatorIcon className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium">Cálculos</span>
        </button>
        <button
            onClick={() => setActiveTab('production')}
            className={`flex flex-col items-center justify-center w-full py-1 ${activeTab === 'production' ? 'text-primary' : 'text-gray-500'}`}
        >
            <HammerIcon className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium">Produção</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
