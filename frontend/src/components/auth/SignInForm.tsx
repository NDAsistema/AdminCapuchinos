import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import authService, { LoginData } from "../../services/authService";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: ""
  });
  
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones básicas
    if (!formData.email || !formData.password) {
      setError("Email y password son requeridos");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.login(formData);
      
      if (response.success) {
        // Login exitoso - redirigir al dashboard
        navigate("/");
      } else {
        setError(response.message || "Error en el login");
      }
    } catch (error: any) {
      setError(error.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto ">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Ingresar al Sistema
            </h1>
          </div>
          
          {/* Mensaje de error */}
          {error && (
            <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    placeholder="info@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Button 
                    className="w-full" 
                    size="sm"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Ingresando..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Enlace de registro si es necesario */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}