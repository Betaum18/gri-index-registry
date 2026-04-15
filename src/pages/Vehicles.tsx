/**
 * Página de Cadastro de Veículos
 * Vincula veículos a passaportes com placa, modelo, cor, pasta, data e até 3 fotos
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useVehicles } from '@/hooks/queries/useVehicles';
import { usePastas } from '@/hooks/queries/usePastas';
import { useCreateVehicle, useDeleteVehicle } from '@/hooks/mutations/useVehicleMutations';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Car,
  Plus,
  Trash2,
  Search,
  FileText,
  Upload,
  X,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/services/image-upload.service';

interface PhotoSlot {
  file: File | null;
  preview: string;
}

function usePhotoSlot() {
  const [slot, setSlot] = useState<PhotoSlot>({ file: null, preview: '' });
  const ref = useRef<HTMLInputElement>(null);

  const handle = useCallback((file: File) => {
    setSlot({ file, preview: '' });
    const reader = new FileReader();
    reader.onloadend = () => setSlot({ file, preview: reader.result as string });
    reader.readAsDataURL(file);
  }, []);

  const clear = useCallback(() => {
    setSlot({ file: null, preview: '' });
    if (ref.current) ref.current.value = '';
  }, []);

  return { slot, handle, clear, ref };
}

export default function Vehicles() {
  const { data: vehicles, isLoading } = useVehicles();
  const { data: pastas } = usePastas();
  const createVehicle = useCreateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const { hasPermission, getAllowedPastas } = useAuth();

  const canCreate = hasPermission('pode_criar');
  const canDelete = hasPermission('pode_deletar');

  const allowedPastas = useMemo(() => {
    if (!pastas) return [];
    return getAllowedPastas(pastas).filter(p => p.ativo);
  }, [pastas, getAllowedPastas]);

  // Form state
  const [passaporte, setPassaporte] = useState('');
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [pasta, setPasta] = useState('');
  const [data, setData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoVeiculo = usePhotoSlot();
  const photoPortaMalas = usePhotoSlot();
  const photoEmplacamento = usePhotoSlot();

  // Paste (Ctrl+V) -> foto do veículo
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            photoVeiculo.handle(file);
            toast.success('Imagem colada na foto do veículo!');
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [photoVeiculo]);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    if (!searchTerm.trim()) return vehicles;
    const search = searchTerm.toLowerCase();
    return vehicles.filter(
      v =>
        (v.passaporte || '').toString().toLowerCase().includes(search) ||
        (v.placa || '').toString().toLowerCase().includes(search) ||
        (v.modelo || '').toString().toLowerCase().includes(search) ||
        (v.cor || '').toString().toLowerCase().includes(search)
    );
  }, [vehicles, searchTerm]);

  const resetForm = () => {
    setPassaporte('');
    setPlaca('');
    setModelo('');
    setCor('');
    setPasta('');
    setData('');
    photoVeiculo.clear();
    photoPortaMalas.clear();
    photoEmplacamento.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passaporte.trim() || !cor.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!pasta) {
      toast.error('A pasta é obrigatória');
      return;
    }

    if (!photoVeiculo.slot.file) {
      toast.error('A foto do veículo é obrigatória');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload foto principal (obrigatória)
      const uploadPrincipal = await uploadImage(photoVeiculo.slot.file);
      if (!uploadPrincipal.success || !uploadPrincipal.url) {
        toast.error('Erro ao fazer upload da foto do veículo: ' + (uploadPrincipal.error || ''));
        setIsSubmitting(false);
        return;
      }

      // Upload foto porta-malas (opcional)
      let urlPortaMalas = '';
      if (photoPortaMalas.slot.file) {
        const res = await uploadImage(photoPortaMalas.slot.file);
        if (res.success && res.url) urlPortaMalas = res.url;
      }

      // Upload foto emplacamento (opcional)
      let urlEmplacamento = '';
      if (photoEmplacamento.slot.file) {
        const res = await uploadImage(photoEmplacamento.slot.file);
        if (res.success && res.url) urlEmplacamento = res.url;
      }

      await createVehicle.mutateAsync({
        passaporte: passaporte.trim(),
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        cor: cor.trim(),
        pasta: pasta,
        data: data,
        imagem_url: uploadPrincipal.url,
        imagem_porta_malas: urlPortaMalas,
        imagem_emplacamento: urlEmplacamento,
      });

      toast.success('Veículo cadastrado com sucesso!');
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar veículo');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVehicle.mutateAsync(deleteId);
      toast.success('Veículo removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover veículo');
      console.error(error);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Car className="h-8 w-8 text-[#00ff87]" />
            Veículos
          </h1>
          <p className="text-gray-400">
            Cadastro de veículos vinculados a passaportes
          </p>
        </div>

        {/* Formulário de Cadastro */}
        {canCreate && (
          <div className="bg-[#1e293b] rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#00ff87]" />
              Novo Veículo
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Passaporte *</label>
                  <Input
                    type="text"
                    placeholder="Número do passaporte"
                    value={passaporte}
                    onChange={(e) => setPassaporte(e.target.value)}
                    className="bg-[#0f172a] border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Placa</label>
                  <Input
                    type="text"
                    placeholder="Ex: ABC1D23"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    className="bg-[#0f172a] border-gray-600 text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Modelo</label>
                  <Input
                    type="text"
                    placeholder="Ex: Honda Civic"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="bg-[#0f172a] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Cor *</label>
                  <Input
                    type="text"
                    placeholder="Ex: Preto"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="bg-[#0f172a] border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    Pasta *
                  </label>
                  <Select value={pasta} onValueChange={setPasta}>
                    <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                      <SelectValue placeholder="Selecione uma pasta" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-gray-700">
                      {allowedPastas.map((p) => (
                        <SelectItem key={p.id} value={p.nome} className="text-white">
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Data do Registro</label>
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="bg-[#0f172a] border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Upload de fotos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <PhotoUpload
                  label="Foto do Veículo *"
                  slot={photoVeiculo.slot}
                  fileRef={photoVeiculo.ref}
                  onFile={photoVeiculo.handle}
                  onClear={photoVeiculo.clear}
                  hint="Obrigatório • Ctrl+V para colar"
                />
                <PhotoUpload
                  label="Porta-malas (opcional)"
                  slot={photoPortaMalas.slot}
                  fileRef={photoPortaMalas.ref}
                  onFile={photoPortaMalas.handle}
                  onClear={photoPortaMalas.clear}
                />
                <PhotoUpload
                  label="Emplacamento (opcional)"
                  slot={photoEmplacamento.slot}
                  fileRef={photoEmplacamento.ref}
                  onFile={photoEmplacamento.handle}
                  onClear={photoEmplacamento.clear}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#00ff87] text-[#0f172a] hover:bg-[#00ff87]/90 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Veículo
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Busca */}
        <div className="bg-[#1e293b] rounded-lg p-4 mb-6 border border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por passaporte, placa, modelo ou cor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0f172a] border-gray-600 text-white pl-12"
            />
          </div>
        </div>

        {/* Lista de Veículos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00ff87]" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}
            </p>
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <p className="text-sm text-gray-400">
                {filteredVehicles.length} veículo{filteredVehicles.length !== 1 ? 's' : ''} encontrado{filteredVehicles.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                  <TableHead className="w-16 text-gray-400">Foto</TableHead>
                  <TableHead className="text-gray-400">Passaporte</TableHead>
                  <TableHead className="text-gray-400">Placa</TableHead>
                  <TableHead className="text-gray-400">Modelo</TableHead>
                  <TableHead className="text-gray-400">Cor</TableHead>
                  <TableHead className="text-gray-400">Pasta</TableHead>
                  <TableHead className="text-gray-400">Data</TableHead>
                  {canDelete && (
                    <TableHead className="w-20 text-gray-400">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="border-gray-700 hover:bg-[#0f172a]">
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg bg-[#0f172a] flex items-center justify-center overflow-hidden">
                        {vehicle.imagem_url ? (
                          <img
                            src={vehicle.imagem_url}
                            alt={vehicle.modelo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Car className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-gray-300 flex items-center gap-2">
                        <FileText className="h-3 w-3 text-[#00ff87]" />
                        {vehicle.passaporte}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-white font-semibold">
                        {vehicle.placa}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-300">{vehicle.modelo}</TableCell>
                    <TableCell className="text-gray-300">{vehicle.cor}</TableCell>
                    <TableCell className="text-gray-300">{vehicle.pasta || '—'}</TableCell>
                    <TableCell className="text-gray-300">
                      {vehicle.data ? new Date(vehicle.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                    {canDelete && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteId(vehicle.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="bg-[#1e293b] border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

// Componente reutilizável para slot de foto
interface PhotoUploadProps {
  label: string;
  slot: PhotoSlot;
  fileRef: React.RefObject<HTMLInputElement>;
  onFile: (file: File) => void;
  onClear: () => void;
  hint?: string;
}

function PhotoUpload({ label, slot, fileRef, onFile, onClear, hint }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) onFile(files[0]);
  };

  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-[#00ff87] bg-[#00ff87]/10'
            : 'border-gray-600 hover:border-[#00ff87]/50 hover:bg-gray-800/30'
          }
        `}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          className="hidden"
        />

        {slot.preview ? (
          <div className="relative p-3">
            <img
              src={slot.preview}
              alt="Preview"
              className="w-full h-32 object-contain rounded-md"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-3">
            <div className="p-2 bg-[#0f172a] rounded-full mb-2">
              <Upload className="h-5 w-5 text-[#00ff87]" />
            </div>
            <p className="text-xs text-gray-300 font-medium mb-1 text-center">
              Arraste ou clique
            </p>
            {hint && <p className="text-xs text-[#00ff87] text-center">{hint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
