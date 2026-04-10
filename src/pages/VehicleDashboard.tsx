/**
 * Dashboard de Veículos
 * Pesquisa, edição e remoção de veículos registrados
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/queries/useVehicles';
import { usePastas } from '@/hooks/queries/usePastas';
import { useUpdateVehicle, useDeleteVehicle } from '@/hooks/mutations/useVehicleMutations';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Car,
  Search,
  FileText,
  X,
  Pencil,
  Trash2,
  Upload,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/services/image-upload.service';
import type { Vehicle } from '@/services/types';

interface EditForm {
  placa: string;
  modelo: string;
  cor: string;
  pasta: string;
  data: string;
  imagem_url: string;
  imagem_porta_malas: string;
  imagem_emplacamento: string;
}

interface PhotoEditSlot {
  file: File | null;
  preview: string;
  existingUrl: string;
}

function useEditPhotoSlot(initialUrl: string) {
  const [slot, setSlot] = useState<PhotoEditSlot>({ file: null, preview: '', existingUrl: initialUrl });
  const ref = useRef<HTMLInputElement>(null);

  const init = useCallback((url: string) => {
    setSlot({ file: null, preview: '', existingUrl: url });
  }, []);

  const handle = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setSlot(s => ({ ...s, file, preview: reader.result as string }));
    reader.readAsDataURL(file);
  }, []);

  const clear = useCallback(() => {
    setSlot(s => ({ ...s, file: null, preview: '', existingUrl: '' }));
    if (ref.current) ref.current.value = '';
  }, []);

  const currentUrl = slot.preview || slot.existingUrl;

  return { slot, init, handle, clear, ref, currentUrl };
}

export default function VehicleDashboard() {
  const navigate = useNavigate();
  const { data: vehicles, isLoading } = useVehicles();
  const { data: pastas } = usePastas();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const { hasPermission, getAllowedPastas } = useAuth();

  const canEdit = hasPermission('pode_editar');
  const canDelete = hasPermission('pode_deletar');

  const allowedPastas = useMemo(() => {
    if (!pastas) return [];
    return getAllowedPastas(pastas).filter(p => p.ativo);
  }, [pastas, getAllowedPastas]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPasta, setSelectedPasta] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edição
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    placa: '', modelo: '', cor: '', pasta: '', data: '',
    imagem_url: '', imagem_porta_malas: '', imagem_emplacamento: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const photoEdit = useEditPhotoSlot('');
  const photoPortaMalasEdit = useEditPhotoSlot('');
  const photoEmplacamentoEdit = useEditPhotoSlot('');

  // Exclusão
  const [deleteTargets, setDeleteTargets] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter(v => {
      const search = searchTerm.toLowerCase();
      const matchSearch = !searchTerm.trim() || (
        (v.passaporte || '').toLowerCase().includes(search) ||
        (v.placa || '').toLowerCase().includes(search) ||
        (v.modelo || '').toLowerCase().includes(search) ||
        (v.cor || '').toLowerCase().includes(search)
      );
      const matchPasta = selectedPasta === 'all' || (v.pasta || '').toLowerCase() === selectedPasta.toLowerCase();
      const vDateStr = (v.data || '').toString().substring(0, 10);
      const matchDateFrom = !dateFrom || vDateStr >= dateFrom;
      const matchDateTo = !dateTo || vDateStr <= dateTo;
      return matchSearch && matchPasta && matchDateFrom && matchDateTo;
    });
  }, [vehicles, searchTerm, selectedPasta, dateFrom, dateTo]);

  const visibleIds = new Set(filteredVehicles.map(v => v.id));
  const activeSelected = new Set([...selectedIds].filter(id => visibleIds.has(id)));
  const allVisibleSelected = filteredVehicles.length > 0 && filteredVehicles.every(v => activeSelected.has(v.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVehicles.map(v => v.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPasta('all');
    setDateFrom('');
    setDateTo('');
    setSelectedIds(new Set());
  };

  const hasActiveFilters = searchTerm !== '' || selectedPasta !== 'all' || dateFrom !== '' || dateTo !== '';

  // Abrir edição
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setEditForm({
      placa: vehicle.placa || '',
      modelo: vehicle.modelo || '',
      cor: vehicle.cor || '',
      pasta: vehicle.pasta || '',
      data: (vehicle.data || '').substring(0, 10),
      imagem_url: vehicle.imagem_url || '',
      imagem_porta_malas: vehicle.imagem_porta_malas || '',
      imagem_emplacamento: vehicle.imagem_emplacamento || '',
    });
    photoEdit.init(vehicle.imagem_url || '');
    photoPortaMalasEdit.init(vehicle.imagem_porta_malas || '');
    photoEmplacamentoEdit.init(vehicle.imagem_emplacamento || '');
  };

  const handleSaveEdit = async () => {
    if (!editingVehicle) return;
    setIsSaving(true);
    try {
      let imageUrl = photoEdit.slot.existingUrl;
      let imagePortaMalas = photoPortaMalasEdit.slot.existingUrl;
      let imageEmplacamento = photoEmplacamentoEdit.slot.existingUrl;

      if (photoEdit.slot.file) {
        const res = await uploadImage(photoEdit.slot.file);
        if (res.success && res.url) imageUrl = res.url;
      }
      if (photoPortaMalasEdit.slot.file) {
        const res = await uploadImage(photoPortaMalasEdit.slot.file);
        if (res.success && res.url) imagePortaMalas = res.url;
      }
      if (photoEmplacamentoEdit.slot.file) {
        const res = await uploadImage(photoEmplacamentoEdit.slot.file);
        if (res.success && res.url) imageEmplacamento = res.url;
      }

      await updateVehicle.mutateAsync({
        id: editingVehicle.id,
        placa: editForm.placa.toUpperCase(),
        modelo: editForm.modelo,
        cor: editForm.cor,
        pasta: editForm.pasta,
        data: editForm.data,
        imagem_url: imageUrl,
        imagem_porta_malas: imagePortaMalas,
        imagem_emplacamento: imageEmplacamento,
      });
      toast.success('Veículo atualizado com sucesso!');
      setEditingVehicle(null);
    } catch {
      toast.error('Erro ao atualizar veículo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTargets.length === 0) return;
    setIsDeleting(true);
    try {
      for (const id of deleteTargets) {
        await deleteVehicle.mutateAsync(id);
      }
      const total = deleteTargets.length;
      setSelectedIds(new Set());
      setDeleteTargets([]);
      toast.success(`${total} veículo${total > 1 ? 's' : ''} excluído${total > 1 ? 's' : ''} com sucesso!`);
    } catch {
      toast.error('Erro ao excluir veículos');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Car className="h-8 w-8 text-[#00ff87]" />
            Dashboard de Veículos
          </h1>
          <p className="text-gray-400">Pesquise, edite e gerencie os veículos cadastrados</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1e293b] rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-[#00ff87]" />
              Filtros
            </h2>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2 lg:col-span-2">
              <label className="text-sm text-gray-400 mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Passaporte, placa, modelo ou cor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0f172a] border-gray-600 text-white pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                Pasta
              </label>
              <Select value={selectedPasta} onValueChange={setSelectedPasta}>
                <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-gray-700">
                  <SelectItem value="all" className="text-white">Todas as pastas</SelectItem>
                  {allowedPastas.map((p) => (
                    <SelectItem key={p.id} value={p.nome} className="text-white">
                      {p.codigo} - {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  De
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Até
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar de ações em massa */}
        {canDelete && activeSelected.size > 0 && (
          <div className="bg-[#1e293b] border border-red-500/30 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-300">
              <span className="text-[#00ff87] font-bold">{activeSelected.size}</span> veículo{activeSelected.size > 1 ? 's' : ''} selecionado{activeSelected.size > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())} className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs">
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={() => setDeleteTargets([...activeSelected])} className="bg-red-600 hover:bg-red-700 text-white text-xs">
                <Trash2 className="h-3 w-3 mr-1" />
                Excluir selecionados
              </Button>
            </div>
          </div>
        )}

        {/* Tabela */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00ff87]" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {hasActiveFilters ? 'Nenhum veículo encontrado com os filtros aplicados' : 'Nenhum veículo cadastrado'}
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
                  {canDelete && (
                    <TableHead className="w-10">
                      <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} className="border-gray-500" />
                    </TableHead>
                  )}
                  <TableHead className="w-16 text-gray-400">Foto</TableHead>
                  <TableHead className="text-gray-400">Passaporte</TableHead>
                  <TableHead className="text-gray-400">Placa</TableHead>
                  <TableHead className="text-gray-400">Modelo</TableHead>
                  <TableHead className="text-gray-400">Cor</TableHead>
                  <TableHead className="text-gray-400">Pasta</TableHead>
                  <TableHead className="text-gray-400">Data</TableHead>
                  <TableHead className="text-gray-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className={`border-gray-700 hover:bg-[#0f172a] ${activeSelected.has(vehicle.id) ? 'bg-[#00ff87]/5' : ''}`}
                  >
                    {canDelete && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={activeSelected.has(vehicle.id)}
                          onCheckedChange={() => toggleSelect(vehicle.id)}
                          className="border-gray-500"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div
                        className="w-12 h-12 rounded-lg bg-[#0f172a] flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/passaporte/${vehicle.passaporte}`)}
                      >
                        {vehicle.imagem_url ? (
                          <img src={vehicle.imagem_url} alt={vehicle.modelo} className="w-full h-full object-cover" />
                        ) : (
                          <Car className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="font-mono text-gray-300 flex items-center gap-2 cursor-pointer hover:text-[#00ff87]"
                        onClick={() => navigate(`/passaporte/${vehicle.passaporte}`)}
                      >
                        <FileText className="h-3 w-3 text-[#00ff87]" />
                        {vehicle.passaporte}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-white font-semibold">{vehicle.placa}</span>
                    </TableCell>
                    <TableCell className="text-gray-300">{vehicle.modelo}</TableCell>
                    <TableCell className="text-gray-300">{vehicle.cor}</TableCell>
                    <TableCell className="text-gray-300">{vehicle.pasta || '—'}</TableCell>
                    <TableCell className="text-gray-300">
                      {vehicle.data ? new Date(vehicle.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(vehicle)}
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTargets([vehicle.id])}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal de Edição */}
        <Dialog open={!!editingVehicle} onOpenChange={(open) => { if (!open) setEditingVehicle(null); }}>
          <DialogContent className="bg-[#1e293b] border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Veículo</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Placa</label>
                <Input
                  value={editForm.placa}
                  onChange={(e) => setEditForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
                  className="bg-[#0f172a] border-gray-600 text-white uppercase"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Modelo</label>
                <Input
                  value={editForm.modelo}
                  onChange={(e) => setEditForm(f => ({ ...f, modelo: e.target.value }))}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Cor</label>
                <Input
                  value={editForm.cor}
                  onChange={(e) => setEditForm(f => ({ ...f, cor: e.target.value }))}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  Pasta
                </label>
                <Select value={editForm.pasta || '__none__'} onValueChange={(v) => setEditForm(f => ({ ...f, pasta: v === '__none__' ? '' : v }))}>
                  <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                    <SelectValue placeholder="Selecione uma pasta" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-gray-700">
                    <SelectItem value="__none__" className="text-gray-400">Nenhuma</SelectItem>
                    {allowedPastas.map((p) => (
                      <SelectItem key={p.id} value={p.nome} className="text-white">
                        {p.codigo} - {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Data do Registro</label>
                <Input
                  type="date"
                  value={editForm.data}
                  onChange={(e) => setEditForm(f => ({ ...f, data: e.target.value }))}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Fotos na edição */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EditPhotoSlot
                label="Foto do Veículo"
                currentUrl={photoEdit.currentUrl}
                fileRef={photoEdit.ref}
                onFile={photoEdit.handle}
                onClear={photoEdit.clear}
              />
              <EditPhotoSlot
                label="Porta-malas"
                currentUrl={photoPortaMalasEdit.currentUrl}
                fileRef={photoPortaMalasEdit.ref}
                onFile={photoPortaMalasEdit.handle}
                onClear={photoPortaMalasEdit.clear}
              />
              <EditPhotoSlot
                label="Emplacamento"
                currentUrl={photoEmplacamentoEdit.currentUrl}
                fileRef={photoEmplacamentoEdit.ref}
                onFile={photoEmplacamentoEdit.handle}
                onClear={photoEmplacamentoEdit.clear}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEditingVehicle(null)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-[#00ff87] text-[#0f172a] hover:bg-[#00ff87]/90 font-semibold">
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog de exclusão */}
        <AlertDialog open={deleteTargets.length > 0} onOpenChange={(open) => { if (!open) setDeleteTargets([]); }}>
          <AlertDialogContent className="bg-[#1e293b] border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Tem certeza que deseja excluir {deleteTargets.length} veículo{deleteTargets.length > 1 ? 's' : ''}? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 text-white hover:bg-red-700">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

// Componente de foto para modal de edição
interface EditPhotoSlotProps {
  label: string;
  currentUrl: string;
  fileRef: React.RefObject<HTMLInputElement>;
  onFile: (file: File) => void;
  onClear: () => void;
}

function EditPhotoSlot({ label, currentUrl, fileRef, onFile, onClear }: EditPhotoSlotProps) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div
        className="relative border-2 border-dashed border-gray-600 rounded-lg hover:border-[#00ff87]/50 hover:bg-gray-800/30 transition-all cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          className="hidden"
        />
        {currentUrl ? (
          <div className="relative p-2">
            <img src={currentUrl} alt="Preview" className="w-full h-24 object-contain rounded" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-5 px-2">
            <Upload className="h-5 w-5 text-gray-500 mb-1" />
            <p className="text-xs text-gray-500 text-center">Clique para adicionar</p>
          </div>
        )}
      </div>
    </div>
  );
}
