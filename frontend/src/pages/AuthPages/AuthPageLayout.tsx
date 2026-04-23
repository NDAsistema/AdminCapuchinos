import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-row w-full overflow-hidden">
        
        {/* Columna Izquierda: Mensaje y Diseño (Visible en LG) */}
        <div className="relative hidden w-1/2 bg-blue-600 lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900 opacity-90"></div>
          <div className="relative flex flex-col items-center justify-center h-full px-12 text-white text-center">
            
            {/* Logo agregado manteniendo tu estructura */}
            <img 
              src="/logocapuchino.png" 
              alt="Logo Capuchinos" 
              className="w-32 h-32 mb-8 drop-shadow-2xl"
            />

            <h1 className="text-4xl font-bold mb-4">AdminCapuchinos</h1>
            <p className="text-lg text-blue-100 italic">
              "Paz y Bien. Gestionando nuestra fraternidad con eficiencia."
            </p>
            
            <div className="mt-12 w-64 h-64 bg-white/10 rounded-full blur-3xl absolute -bottom-10 -left-10"></div>
          </div>
        </div>

        {/* Columna Derecha: El Formulario */}
        <div className="flex flex-col justify-center w-full p-8 lg:w-1/2 sm:p-16">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}