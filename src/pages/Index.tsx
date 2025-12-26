import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import RegistrationForm from "@/components/RegistrationForm";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Cadastro Índice - GRI | Sistema de Registro Operacional</title>
        <meta 
          name="description" 
          content="Sistema de cadastro do Índice GRI - Grupo de Resposta Imediata. Registro operacional para controle interno policial." 
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        {/* Cabeçalho */}
        <Header />

        {/* Área principal com formulário */}
        <main className="flex-1 flex items-center justify-center py-8 px-4">
          <RegistrationForm />
        </main>

        {/* Rodapé */}
        <footer className="border-t border-border/50 py-4 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-mono tracking-wider">
              GRI © {new Date().getFullYear()} - SISTEMA INTERNO
            </span>
            <span className="font-mono tracking-wider">
              v1.0.0 | ACESSO RESTRITO
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
