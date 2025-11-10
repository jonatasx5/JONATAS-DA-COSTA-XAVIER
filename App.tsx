import React, { useState, useEffect } from 'react';
import { Estrutura, Vao, VaoType, CompanyProfile } from './types';
import { useCabinetCalculations } from './hooks/useCalculations';
import { CalculationsModule } from './modules/CalculationsModule';
import { BudgetModule } from './modules/BudgetModule';
import { ProductionModule } from './modules/ProductionModule';
import { CompanyProfileModal } from './modules/CompanyProfileModal';
import { SettingsIcon } from './components/ui';

type Tab = 'calculations' | 'budget' | 'production';

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
    img.onerror = (error) => reject(error);
  });

// Helper to update PWA icons and manifest
const updatePwaIcons = async (logoBase64: string, appName: string) => {
  try {
    const [icon192, icon512] = await Promise.all([
      resizeImage(logoBase64, 192, 192),
      resizeImage(logoBase64, 512, 512)
    ]);

    // Update favicon and apple-touch-icon
    const faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']") || document.createElement('link');
    faviconLink.rel = 'icon';
    faviconLink.href = icon192;
    document.head.appendChild(faviconLink);

    const appleIconLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']") || document.createElement('link');
    appleIconLink.rel = 'apple-touch-icon';
    appleIconLink.href = icon192;
    document.head.appendChild(appleIconLink);


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


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('calculations');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: 'Sua Empresa de Móveis',
    address: 'Rua Exemplo, 123, Cidade',
    contact: 'email@exemplo.com | (00) 1234-5678',
    logo: null,
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('companyProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setCompanyProfile(profile);
      if (profile.logo) {
        updatePwaIcons(profile.logo, profile.name || 'Planejador de Armários Pro');
      }
    }
  }, []);

  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    localStorage.setItem('companyProfile', JSON.stringify(profile));
    if (profile.logo) {
      updatePwaIcons(profile.logo, profile.name || 'Planejador de Armários Pro');
    }
    setIsCompanyModalOpen(false);
  };


  const [estrutura, setEstrutura] = useState<Estrutura>({
    pedraComprimento: 200,
    alturaTotal: 85,
    lateraisComVidro: 1,
    possuiBase: true,
    pedraProfundidade: 60,
  });

  const [vaos, setVaos] = useState<Vao[]>([
      { id: '1', tipo: VaoType.PortaTempero, vaoLargura: 15, numGavetas: 0 },
      { id: '2', tipo: VaoType.Gavetas, vaoLargura: 40, numGavetas: 4 },
      { id: '3', tipo: VaoType.PortaDupla, vaoLargura: 0, numGavetas: 0 },
      { id: '4', tipo: VaoType.PortaUnica, vaoLargura: 0, numGavetas: 0 },
  ]);

  const calculations = useCabinetCalculations(estrutura, vaos);

  const renderContent = () => {
    switch (activeTab) {
      case 'calculations':
        return <CalculationsModule estrutura={estrutura} setEstrutura={setEstrutura} vaos={vaos} setVaos={setVaos} calculations={calculations} />;
      case 'budget':
        return <BudgetModule cabinetCalculations={calculations} companyProfile={companyProfile} />;
      case 'production':
        return <ProductionModule bom={calculations.bom} />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tabId: Tab; label: string}> = ({tabId, label}) => {
    const isActive = activeTab === tabId;
    return (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
    )
  }

  return (
    <>
    <CompanyProfileModal 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompanyProfile}
        currentProfile={companyProfile}
    />
    <div className="min-h-screen bg-secondary text-secondary-foreground">
      <header className="bg-white shadow-sm sticky top-0 z-10 no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-primary mb-4 sm:mb-0">
            Planejador de Armários <span className="text-base font-normal text-muted-foreground">Pro</span>
          </h1>
          <div className="flex items-center gap-4">
            <nav className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                <TabButton tabId='calculations' label="Cálculos" />
                <TabButton tabId='budget' label="Orçamento" />
                <TabButton tabId='production' label="Produção" />
            </nav>
            <button onClick={() => setIsCompanyModalOpen(true)} className="text-gray-500 hover:text-primary transition-colors">
                <SettingsIcon className="w-6 h-6"/>
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
    </>
  );
};

export default App;