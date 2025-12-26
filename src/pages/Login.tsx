/**
 * Login Page - Página de Login
 *
 * Permite que usuários não autenticados façam login
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import LoginForm from '@/components/auth/LoginForm';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Helmet>
        <title>Login - GRI | Sistema de Registro Operacional</title>
        <meta name="description" content="Acesso ao sistema GRI - Grupo de Resposta Imediata" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <Header />

        {/* Área de Login */}
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <LoginForm />
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-4 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-mono tracking-wider">
              GRI © {new Date().getFullYear()} - SISTEMA INTERNO
            </span>
            <span className="font-mono tracking-wider">v1.0.0 | ACESSO RESTRITO</span>
          </div>
        </footer>
      </div>
    </>
  );
}
