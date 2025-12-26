/**
 * LoginForm - Formulário de Login
 *
 * Permite que o usuário faça login no sistema
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/services/api.service';
import { LogIn, User, Lock } from 'lucide-react';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.username.trim() || !formData.password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha usuário e senha',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData.username.trim(), formData.password);

      toast({
        title: 'Login realizado!',
        description: `Bem-vindo(a) de volta!`,
      });

      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="gradient-card border border-border/50 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-secondary/50 px-6 py-5 border-b border-border/50">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-mono font-bold text-center tracking-wide text-foreground">
            ACESSO RESTRITO
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Sistema de Registro Operacional GRI
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Campo Usuário */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-primary" />
              Usuário
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Digite seu usuário"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isSubmitting}
              autoComplete="username"
              autoFocus
            />
          </div>

          {/* Campo Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-primary" />
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          {/* Botão Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="neon"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  ENTRAR
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-secondary/30 px-6 py-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Credenciais padrão: <code className="text-primary">admin / admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
