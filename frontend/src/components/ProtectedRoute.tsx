import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: number; // 1=admin, 2=usuario, 3=comunicaciones
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Verificar token de forma segura
  const verifyToken = (): boolean => {
    try {
      const token = localStorage.getItem('token');
      
      // 1. ¿Existe token?
      if (!token) return false;
      
      // 2. ¿Está expirado?
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convertir a milisegundos
      const currentTime = Date.now();
      
      if (expirationTime < currentTime) {
        console.log('⏰ Token expirado');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      // 3. ¿Tiene los campos mínimos?
      if (!payload.id || !payload.id_brotther) {
        console.log('❌ Token sin datos de usuario');
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.log('❌ Error verificando token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  };

  // Obtener el rol del usuario de forma segura
  const getUserRole = (): number | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.type_user || null;
      }
    } catch (error) {
      console.log('❌ Error obteniendo rol:', error);
    }
    return null;
  };

  // Verificar al montar y periódicamente
  useEffect(() => {
    const checkToken = () => {
      setIsValidToken(verifyToken());
    };
    
    // Verificar inmediatamente
    checkToken();
    
    // Verificar cada minuto
    const interval = setInterval(checkToken, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Mostrar carga mientras verifica
  if (isValidToken === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Token inválido o expirado
  if (!isValidToken) {
    return <Navigate to="/signin" replace />;
  }

  // Verificar rol si es requerido
  if (requiredRole !== undefined) {
    const userRole = getUserRole();
    if (userRole !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;