import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Shield, FileText, Calendar, MapPin, FolderOpen } from "lucide-react";

// Opções configuráveis para QRU (podem ser alteradas conforme necessidade)
const QRU_OPTIONS = [
  { value: "qru1", label: "QRU Alpha" },
  { value: "qru2", label: "QRU Bravo" },
  { value: "qru3", label: "QRU Charlie" },
  { value: "qru4", label: "QRU Delta" },
  { value: "qru5", label: "QRU Echo" },
];

// Opções configuráveis para Pasta (podem ser alteradas conforme necessidade)
const PASTA_OPTIONS = [
  { value: "pasta1", label: "Pasta Operacional" },
  { value: "pasta2", label: "Pasta Tática" },
  { value: "pasta3", label: "Pasta Administrativa" },
  { value: "pasta4", label: "Pasta Especial" },
];

interface FormData {
  passaporte: string;
  nome: string;
  qru: string;
  pasta: string;
  data: string;
}

interface FormErrors {
  passaporte?: string;
  nome?: string;
  qru?: string;
  pasta?: string;
}

// Simula banco de dados local (preparado para integração futura)
const registeredPassports: Set<string> = new Set();

const RegistrationForm = () => {
  const [formData, setFormData] = useState<FormData>({
    passaporte: "",
    nome: "",
    qru: "",
    pasta: "",
    data: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualiza a data automaticamente
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData(prev => ({ ...prev, data: today }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validação do Passaporte
    if (!formData.passaporte.trim()) {
      newErrors.passaporte = "Passaporte é obrigatório";
    } else if (!/^\d+$/.test(formData.passaporte)) {
      newErrors.passaporte = "Passaporte deve conter apenas números";
    } else if (registeredPassports.has(formData.passaporte)) {
      newErrors.passaporte = "Passaporte já cadastrado no sistema";
    }

    // Validação do Nome
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = "Nome deve ter no mínimo 3 caracteres";
    }

    // Validação do QRU
    if (!formData.qru) {
      newErrors.qru = "Selecione um QRU";
    }

    // Validação da Pasta
    if (!formData.pasta) {
      newErrors.pasta = "Selecione uma Pasta";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os campos destacados.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simula envio para API/banco de dados
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Adiciona passaporte ao "banco de dados" local
      registeredPassports.add(formData.passaporte);

      toast({
        title: "Cadastro Realizado com Sucesso!",
        description: `Índice de ${formData.nome} registrado no sistema.`,
      });

      // Limpa o formulário
      setFormData({
        passaporte: "",
        nome: "",
        qru: "",
        pasta: "",
        data: new Date().toISOString().split("T")[0],
      });
      setErrors({});

    } catch (error) {
      toast({
        title: "Erro no Cadastro",
        description: "Ocorreu um erro ao processar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpa erro do campo quando usuário começa a digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6">
      <div className="gradient-card border border-border/50 rounded-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Header do Card */}
        <div className="bg-secondary/50 px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-mono font-semibold tracking-wide text-foreground">
              NOVO REGISTRO
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha os dados para cadastro no índice operacional
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Campo Passaporte */}
          <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.1s" }}>
            <Label htmlFor="passaporte" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Passaporte <span className="text-destructive">*</span>
            </Label>
            <Input
              id="passaporte"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Digite o número do passaporte"
              value={formData.passaporte}
              onChange={(e) => handleInputChange("passaporte", e.target.value.replace(/\D/g, ""))}
              className={errors.passaporte ? "border-destructive focus-visible:ring-destructive/50" : ""}
            />
            {errors.passaporte && (
              <p className="text-sm text-destructive animate-fade-in">{errors.passaporte}</p>
            )}
          </div>

          {/* Campo Nome */}
          <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.15s" }}>
            <Label htmlFor="nome" className="flex items-center gap-2 text-sm font-medium">
              <UserPlus className="h-4 w-4 text-primary" />
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Digite o nome completo"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              className={errors.nome ? "border-destructive focus-visible:ring-destructive/50" : ""}
            />
            {errors.nome && (
              <p className="text-sm text-destructive animate-fade-in">{errors.nome}</p>
            )}
          </div>

          {/* Campo QRU */}
          <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.2s" }}>
            <Label htmlFor="qru" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              QRU <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.qru} onValueChange={(value) => handleInputChange("qru", value)}>
              <SelectTrigger className={errors.qru ? "border-destructive focus:ring-destructive/50" : ""}>
                <SelectValue placeholder="Selecione o QRU" />
              </SelectTrigger>
              <SelectContent>
                {QRU_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.qru && (
              <p className="text-sm text-destructive animate-fade-in">{errors.qru}</p>
            )}
          </div>

          {/* Campo Pasta */}
          <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.25s" }}>
            <Label htmlFor="pasta" className="flex items-center gap-2 text-sm font-medium">
              <FolderOpen className="h-4 w-4 text-primary" />
              Pasta <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.pasta} onValueChange={(value) => handleInputChange("pasta", value)}>
              <SelectTrigger className={errors.pasta ? "border-destructive focus:ring-destructive/50" : ""}>
                <SelectValue placeholder="Selecione a Pasta" />
              </SelectTrigger>
              <SelectContent>
                {PASTA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pasta && (
              <p className="text-sm text-destructive animate-fade-in">{errors.pasta}</p>
            )}
          </div>

          {/* Campo Data */}
          <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.3s" }}>
            <Label htmlFor="data" className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              Data do Registro
            </Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => handleInputChange("data", e.target.value)}
            />
          </div>

          {/* Botão Cadastrar */}
          <div className="pt-4 animate-slide-in" style={{ animationDelay: "0.35s" }}>
            <Button
              type="submit"
              variant="neon"
              size="lg"
              className="w-full animate-pulse-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  CADASTRAR
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer do Card */}
        <div className="bg-secondary/30 px-6 py-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Sistema preparado para integração com API e banco de dados
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
