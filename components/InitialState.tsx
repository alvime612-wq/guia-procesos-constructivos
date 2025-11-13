import React from 'react';

export const InitialState: React.FC = () => {
  return (
    <div className="text-center p-8 sm:p-12 bg-white rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-800">Bienvenido a la Guía de Procesos Constructivos</h2>
      <p className="mt-2 text-slate-600 max-w-md mx-auto">
        Ingresa una actividad o proceso de construcción en la barra de búsqueda para comenzar.
      </p>
      <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
        <div className="p-4 bg-blue-100 rounded-lg">
          <h3 className="font-semibold text-blue-800">Descripción Experta</h3>
          <p className="mt-1 text-xs text-blue-700">Análisis concisos generados por IA.</p>
        </div>
        <div className="p-4 bg-blue-100 rounded-lg">
          <h3 className="font-semibold text-blue-800">Pasos Clave</h3>
          <p className="mt-1 text-xs text-blue-700">Listas de acciones críticas para el éxito.</p>
        </div>
        <div className="p-4 bg-blue-100 rounded-lg">
          <h3 className="font-semibold text-blue-800">Normativa Aplicable</h3>
          <p className="mt-1 text-xs text-blue-700">Regulaciones técnicas y de seguridad.</p>
        </div>
      </div>
    </div>
  );
};