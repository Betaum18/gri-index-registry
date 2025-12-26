import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, LogOut, User, FileText, MapPin, FolderOpen } from "lucide-react";
import griLogo from "@/assets/gri-logo-new.png";
import pmLogo from "@/assets/pm-logo-new.png";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    {
      path: "/",
      label: "Cadastro",
      icon: FileText,
    },
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: User,
    },
    {
      path: "/qrus",
      label: "QRUs",
      icon: MapPin,
    },
    {
      path: "/pastas",
      label: "Pastas",
      icon: FolderOpen,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="w-full gradient-header border-b border-border/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header principal */}
        <div className="flex items-center justify-between py-3">
          {/* Logo GRI à esquerda */}
          <div className="flex items-center gap-3">
            <img
              src={griLogo}
              alt="Logo GRI - Grupamento Investigativo"
              className="h-10 sm:h-12 w-10 sm:w-12 object-contain drop-shadow-lg"
            />
            <div className="hidden lg:block">
              <span className="text-xs font-mono text-muted-foreground tracking-wider block">
                GRUPAMENTO INVESTIGATIVO
              </span>
              <span className="text-xs text-primary font-mono tracking-wider">
                SISTEMA DE REGISTRO
              </span>
            </div>
          </div>

          {/* Título central - hidden on mobile */}
          <div className="hidden md:block text-center">
            <h1 className="text-base sm:text-lg md:text-xl font-mono font-bold tracking-wider text-foreground text-glow">
              CADASTRO ÍNDICE – GRI
            </h1>
          </div>

          {/* User menu e menu mobile */}
          <div className="flex items-center gap-3">
            {/* Logo PM - hidden on small screens */}
            <img
              src={pmLogo}
              alt="Logo Polícia Militar"
              className="hidden sm:block h-10 sm:h-12 w-10 sm:w-12 object-contain"
            />

            {/* User dropdown - desktop */}
            {user && (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-border hover:bg-secondary/80"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {user.nome_completo}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1e293b] border-gray-700"
                  >
                    <DropdownMenuLabel className="text-white">
                      {user.nome_completo}
                    </DropdownMenuLabel>
                    <DropdownMenuLabel className="font-normal text-xs text-gray-400">
                      @{user.usuario}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden border-border"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1 pb-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${
                    active
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all
                      ${
                        active
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* User info and logout - mobile */}
            {user && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-foreground">
                    {user.nome_completo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{user.usuario}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2 text-red-400 border-red-400/30 hover:bg-red-900/20 hover:text-red-300"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
