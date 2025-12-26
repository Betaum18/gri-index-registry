import { useState, useEffect, useRef, useCallback } from "react";
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
import { UserPlus, Shield, FileText, Calendar, MapPin, FolderOpen, ImagePlus, X, Upload } from "lucide-react";
import { useCreateRegistration } from "@/hooks/mutations/useCreateRegistration";
import { usePassportCheck } from "@/hooks/queries/usePassportCheck";
import { useQRUs } from "@/hooks/queries/useQRUs";
import { usePastas } from "@/hooks/queries/usePastas";
import { getErrorMessage } from "@/services/api.service";

interface FormData {
  passaporte: string;
  nome: string;
  qru: string;
  pasta: string;
  data: string;
  imagem: File | null;
}

interface FormErrors {
  passaporte?: string;
  nome?: string;
  qru?: string;
  pasta?: string;
  imagem?: string;
}

const RegistrationForm = () => {
  const [formData, setFormData] = useState<FormData>({
    passaporte: "",
    nome: "",
    qru: "",
    pasta: "",
    data: new Date().toISOString().split("T")[0],
    imagem: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks de API
  const { mutate: createRegistration, isPending } = useCreateRegistration();
  const { data: passportExists } = usePassportCheck(formData.passaporte);
  const { data: qrus, isLoading: isLoadingQRUs } = useQRUs();
  const { data: pastas, isLoading: isLoadingPastas } = usePastas();

  // Filtrar apenas QRUs e Pastas ativos
  const activeQRUs = qrus?.filter(qru => qru.ativo) || [];
  const activePastas = pastas?.filter(pasta => pasta.ativo) || [];

  // Atualiza a data automaticamente
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData(prev => ({ ...prev, data: today }));
  }, []);

  // Handler para processar arquivo de imagem
  const handleImageFile = useCallback((file: File) => {
    // Valida tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo JPEG ou PNG.",
        variant: "destructive",
      });
      return;
    }

    // Valida tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({ ...prev, imagem: file }));
    setErrors(prev => ({ ...prev, imagem: undefined }));

    // Cria preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handler para colar imagem (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            toast({
              title: "Imagem colada",
              description: "A imagem foi adicionada com sucesso.",
            });
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleImageFile]);

  // Handler para remover imagem
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imagem: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handlers para drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validação do Passaporte
    if (!formData.passaporte.trim()) {
      newErrors.passaporte = "Passaporte é obrigatório";
    } else if (!/^\d+$/.test(formData.passaporte)) {
      newErrors.passaporte = "Passaporte deve conter apenas números";
    } else if (passportExists) {
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

    // Preparar dados para envio (sem o campo imagem File, apenas URL se houver)
    const registrationData = {
      passaporte: formData.passaporte,
      nome: formData.nome,
      qru: formData.qru,
      pasta: formData.pasta,
      data: formData.data,
      imagem_url: '', // Por enquanto vazio, futuramente implementar upload de imagem
    };

    createRegistration(registrationData, {
      onSuccess: () => {
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
          imagem: null,
        });
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setErrors({});
      },
      onError: (error) => {
        toast({
          title: "Erro no Cadastro",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      },
    });
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
            <Select
              value={formData.qru}
              onValueChange={(value) => handleInputChange("qru", value)}
              disabled={isLoadingQRUs}
            >
              <SelectTrigger className={errors.qru ? "border-destructive focus:ring-destructive/50" : ""}>
                <SelectValue placeholder={isLoadingQRUs ? "Carregando..." : "Selecione o QRU"} />
              </SelectTrigger>
              <SelectContent>
                {activeQRUs.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum QRU disponível
                  </SelectItem>
                ) : (
                  activeQRUs.map((qru) => (
                    <SelectItem key={qru.id} value={qru.nome}>
                      {qru.codigo} - {qru.nome}
                    </SelectItem>
                  ))
                )}
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
            <Select
              value={formData.pasta}
              onValueChange={(value) => handleInputChange("pasta", value)}
              disabled={isLoadingPastas}
            >
              <SelectTrigger className={errors.pasta ? "border-destructive focus:ring-destructive/50" : ""}>
                <SelectValue placeholder={isLoadingPastas ? "Carregando..." : "Selecione a Pasta"} />
              </SelectTrigger>
              <SelectContent>
                {activePastas.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhuma Pasta disponível
                  </SelectItem>
                ) : (
                  activePastas.map((pasta) => (
                    <SelectItem key={pasta.id} value={pasta.nome}>
                      {pasta.codigo} - {pasta.nome}
                    </SelectItem>
                  ))
                )}
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

          {/* Campo Imagem */}
          <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.35s" }}>
            <Label className="flex items-center gap-2 text-sm font-medium">
              <ImagePlus className="h-4 w-4 text-primary" />
              Foto / Documento
            </Label>
            
            {/* Área de upload com drag & drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
                ${isDragging 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                }
                ${errors.imagem ? 'border-destructive' : ''}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className="hidden"
              />

              {imagePreview ? (
                /* Preview da imagem */
                <div className="relative p-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-contain rounded-md"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {formData.imagem?.name}
                  </p>
                </div>
              ) : (
                /* Área de upload vazia */
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="p-3 bg-secondary rounded-full mb-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-foreground font-medium mb-1">
                    Arraste uma imagem ou clique aqui
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Aceita JPEG e PNG • Máx. 5MB
                  </p>
                  <p className="text-xs text-primary mt-2">
                    Dica: Você pode colar uma imagem (Ctrl+V)
                  </p>
                </div>
              )}
            </div>

            {errors.imagem && (
              <p className="text-sm text-destructive animate-fade-in">{errors.imagem}</p>
            )}
          </div>

          {/* Botão Cadastrar */}
          <div className="pt-4 animate-slide-in" style={{ animationDelay: "0.4s" }}>
            <Button
              type="submit"
              variant="neon"
              size="lg"
              className="w-full animate-pulse-glow"
              disabled={isPending}
            >
              {isPending ? (
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
            Sistema integrado com Google Sheets via Apps Script
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
