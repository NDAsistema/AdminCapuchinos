import { useState } from "react";
import { useNavigate } from "react-router";
import authService from "../../services/authService";
import { useAuth } from "../UserProfile/AuthProvider"; // <--- Ruta corregida
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login(formData);
      if (response.success) {
        login(response.user, response.token);
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Error login", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Label>Email</Label>
      <Input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
      <Label>Password</Label>
      <Input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
      <Button className="w-full" type="submit" disabled={loading}>Ingresar</Button>
    </form>
  );
}