import React from 'react';
import { BuildingIcon } from './icons/BuildingIcon';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-full shadow-md">
            <BuildingIcon />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Guías de Procesos Constructivos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Obtén descripciones, pasos críticos y normas aplicables para tus proyectos.
          </p>
        </div>
      </div>
    </header>
  );
};