import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '../types';
import { Input, Button, Textarea } from '../components/ui';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: CompanyProfile) => void;
  currentProfile: CompanyProfile;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({ isOpen, onClose, onSave, currentProfile }) => {
  const [profile, setProfile] = useState<CompanyProfile>(currentProfile);

  useEffect(() => {
    setProfile(currentProfile);
  }, [currentProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    onSave(profile);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-primary">Dados da Empresa</h2>
          </div>
          <div className="p-6 space-y-4">
            <Input label="Nome da Empresa" name="name" value={profile.name} onChange={handleInputChange} />
            <Textarea label="Endereço da Empresa" name="address" value={profile.address} onChange={handleInputChange} />
            <Input label="Contato (E-mail / Telefone)" name="contact" value={profile.contact} onChange={handleInputChange} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <div className="flex items-center gap-4">
                {profile.logo && <img src={profile.logo} alt="Logo Preview" className="h-16 w-16 object-contain border p-1 rounded-md" />}
                <Input type="file" accept="image/*" onChange={handleLogoChange} />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Informações</Button>
          </div>
        </div>
      </div>
    </>
  );
};