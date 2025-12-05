
import React, { useRef } from 'react';
import { VisitData, CompanyProfile, LayoutType } from '../types';
import { Card, Input, Button, Select, Checkbox, Textarea, CameraIcon } from '../components/ui';
import { VisitSheet } from './VisitSheet';

declare const html2canvas: any;

interface VisitModuleProps {
  visitData: VisitData;
  setVisitData: React.Dispatch<React.SetStateAction<VisitData>>;
  companyProfile: CompanyProfile;
  budgetNumber: string;
}

export const VisitModule: React.FC<VisitModuleProps> = ({ visitData, setVisitData, companyProfile, budgetNumber }) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith('measurements.')) {
        const key = name.split('.')[1];
        setVisitData(prev => ({ ...prev, measurements: { ...prev.measurements, [key]: parseFloat(value) || 0 }}));
    } else if (name.startsWith('baseDetails.')) {
        const key = name.split('.')[1];
        setVisitData(prev => ({ ...prev, baseDetails: { ...prev.baseDetails, [key]: parseFloat(value) || 0 }}));
    } else {
        setVisitData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setVisitData(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };
  
  const handleGenerateImage = () => {
    if (sheetRef.current) {
      html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `ficha_visita_${visitData.clientName.replace(/\s/g, '_') || 'cliente'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna de Inputs */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">1. Dados da Visita</h2>
            <div className="space-y-4">
                <Input label="Nome do Cliente" name="clientName" value={visitData.clientName} onChange={handleInputChange} />
                <Input label="Bairro / Endereço" name="clientAddress" value={visitData.clientAddress} onChange={handleInputChange} />
            </div>
        </Card>
        <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">2. Especificações do Armário</h2>
            <div className="space-y-4">
                <Select label="Tipo de Armário" name="cabinetType" value={visitData.cabinetType} onChange={handleInputChange}>
                    <option value="inferior">Inferior</option>
                    <option value="superior">Superior</option>
                </Select>
                <Select label="Modelo do Armário" name="cabinetModel" value={visitData.cabinetModel} onChange={handleInputChange}>
                    <option value={LayoutType.Reto}>Reto</option>
                    <option value={LayoutType.EmL}>Em L</option>
                    <option value={LayoutType.EmU}>Em U</option>
                </Select>
                 <Select label="Local do Armário" name="cabinetLocation" value={visitData.cabinetLocation} onChange={handleInputChange}>
                    <option>Cozinha</option>
                    <option>Banheiro</option>
                    <option>Área Gourmet</option>
                    <option>Guarda Roupa</option>
                    <option>Lavanderia</option>
                </Select>
            </div>
        </Card>
         <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">3. Medidas do Local</h2>
            <div className="space-y-4">
                <Input label={visitData.cabinetModel === LayoutType.Reto ? "Medida da Frente" : "Medida Lado A"} name="measurements.ladoA" type="number" unit="cm" value={visitData.measurements.ladoA} onChange={handleInputChange} />
                {(visitData.cabinetModel === LayoutType.EmL || visitData.cabinetModel === LayoutType.EmU) && (
                     <Input label="Medida Lado B" name="measurements.ladoB" type="number" unit="cm" value={visitData.measurements.ladoB} onChange={handleInputChange} />
                )}
                {visitData.cabinetModel === LayoutType.EmU && (
                     <Input label="Medida Lado C" name="measurements.ladoC" type="number" unit="cm" value={visitData.measurements.ladoC} onChange={handleInputChange} />
                )}
            </div>
        </Card>
        <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">4. Detalhes da Base</h2>
            <div className="space-y-4">
                <Checkbox label="Local possui base de alvenaria" name="hasBase" checked={visitData.hasBase} onChange={handleInputChange} />
                {visitData.hasBase && (
                    <div className="space-y-4 pt-2 border-t">
                        <Input label="Altura da Base" name="baseDetails.height" type="number" unit="cm" value={visitData.baseDetails.height} onChange={handleInputChange} />
                        <Input label={visitData.cabinetModel === LayoutType.Reto ? "Profundidade da Base" : "Profundidade Base (A)"} name="baseDetails.depthA" type="number" unit="cm" value={visitData.baseDetails.depthA} onChange={handleInputChange} />
                        {(visitData.cabinetModel === LayoutType.EmL || visitData.cabinetModel === LayoutType.EmU) && (
                            <Input label="Profundidade Base (B)" name="baseDetails.depthB" type="number" unit="cm" value={visitData.baseDetails.depthB} onChange={handleInputChange} />
                        )}
                        {visitData.cabinetModel === LayoutType.EmU && (
                             <Input label="Profundidade Base (C)" name="baseDetails.depthC" type="number" unit="cm" value={visitData.baseDetails.depthC} onChange={handleInputChange} />
                        )}
                    </div>
                )}
            </div>
        </Card>
         <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">5. Registro Fotográfico</h2>
            <input type="file" accept="image/*" capture="environment" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" />
            <Button className="w-full" variant="secondary" onClick={() => photoInputRef.current?.click()}>
                <CameraIcon className="h-5 w-5 mr-2" />
                Tirar Foto do Local
            </Button>
            {visitData.photo && <img src={visitData.photo} alt="Preview do local" className="mt-4 rounded-md w-full object-contain" />}
        </Card>
         <Card>
            <h2 className="text-xl font-bold mb-4 text-primary">6. Observações</h2>
            <Textarea label="" name="notes" value={visitData.notes} onChange={handleInputChange} placeholder="Anotações importantes sobre o local, pontos de água, eletricidade, etc." />
        </Card>
      </div>

      {/* Coluna da Ficha */}
      <div className="lg:col-span-2">
        <div className="sticky top-8">
            <div className="flex justify-end mb-4">
                 <Button onClick={handleGenerateImage}>
                    <CameraIcon className="h-4 w-4 mr-2" />
                    Gerar Imagem da Ficha
                 </Button>
            </div>
            <div className="overflow-auto" style={{maxHeight: 'calc(100vh - 8rem)'}}>
                <VisitSheet ref={sheetRef} visitData={visitData} companyProfile={companyProfile} budgetNumber={budgetNumber} />
            </div>
        </div>
      </div>
    </div>
  );
};
