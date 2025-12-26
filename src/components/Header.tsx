import griLogo from "@/assets/gri-logo.png";
import brasaoInstitucional from "@/assets/brasao-institucional.png";

const Header = () => {
  return (
    <header className="w-full gradient-header border-b border-border/50 py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo GRI à esquerda */}
        <div className="flex items-center gap-3">
          <img 
            src={griLogo} 
            alt="Logo GRI - Grupo de Resposta Imediata" 
            className="h-12 w-12 object-contain drop-shadow-lg"
          />
          <span className="hidden sm:block text-sm font-mono text-muted-foreground tracking-wider">
            GRUPO DE RESPOSTA IMEDIATA
          </span>
        </div>

        {/* Título central */}
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-mono font-bold tracking-wider text-foreground text-glow">
            CADASTRO ÍNDICE – GRI
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest mt-1">
            SISTEMA DE REGISTRO OPERACIONAL
          </p>
        </div>

        {/* Brasão institucional à direita */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs font-mono text-muted-foreground text-right tracking-wider">
            POLÍCIA<br />INSTITUCIONAL
          </span>
          <img 
            src={brasaoInstitucional} 
            alt="Brasão Institucional" 
            className="h-12 w-12 object-contain"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
