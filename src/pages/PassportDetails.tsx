/**
 * Página de Detalhes do Passaporte
 * Mostra todos os registros de um passaporte específico
 */

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRegistrations } from '@/hooks/queries/useRegistrations';
import { useVehicles } from '@/hooks/queries/useVehicles';
import { useQRUs } from '@/hooks/queries/useQRUs';
import { usePastas } from '@/hooks/queries/usePastas';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteRegistration } from '@/hooks/mutations/useDeleteRegistration';
import { useUpdateRegistration } from '@/hooks/mutations/useUpdateRegistration';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  User,
  FileText,
  MapPin,
  Calendar,
  FolderOpen,
  Download,
  Car,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Registration } from '@/services/types';

/** Formata uma data vinda do campo `data` (YYYY-MM-DD) sem risco de "Invalid date" */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const iso = dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

/** Formata um campo datetime (ISO) */
function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('pt-BR');
}

export default function PassportDetails() {
  const { passaporte } = useParams<{ passaporte: string }>();
  const navigate = useNavigate();
  const { data: registrations, isLoading } = useRegistrations();
  const { data: vehicles } = useVehicles();
  const { data: qrus } = useQRUs();
  const { data: pastas } = usePastas();
  const { getAllowedPastas, hasPermission } = useAuth();
  const deleteRegistration = useDeleteRegistration();
  const updateRegistration = useUpdateRegistration();

  const canEdit = hasPermission('pode_editar');
  const canDelete = hasPermission('pode_deletar');

  // Pastas permitidas ao usuário
  const allowedPastas = useMemo(() => {
    if (!pastas) return [];
    return getAllowedPastas(pastas).filter((p) => p.ativo);
  }, [pastas, getAllowedPastas]);

  // Edição individual
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', qru: '', pasta: '', data: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Exclusão individual
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrar registros pelo passaporte
  const passportRegistrations = useMemo(() => {
    if (!registrations || !passaporte) return [];

    return registrations
      .filter((reg) => String(reg.passaporte).trim() === String(passaporte).trim())
      .sort((a, b) => {
        const dateA = new Date(a.data_cadastro || (a.data + 'T12:00:00')).getTime();
        const dateB = new Date(b.data_cadastro || (b.data + 'T12:00:00')).getTime();
        return dateB - dateA;
      });
  }, [registrations, passaporte]);

  // Pegar a foto mais recente
  const latestPhoto = passportRegistrations.find((reg) => reg.imagem_url)?.imagem_url;

  // Nome do primeiro registro
  const personName = passportRegistrations[0]?.nome || 'Desconhecido';

  // Veículos vinculados
  const passportVehicles = useMemo(() => {
    if (!vehicles || !passaporte) return [];
    return vehicles.filter(
      (v) => String(v.passaporte).trim() === String(passaporte).trim()
    );
  }, [vehicles, passaporte]);

  const handleDownloadPhoto = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleOpenEdit = (reg: Registration) => {
    setEditingReg(reg);
    setEditForm({
      nome: reg.nome || '',
      qru: reg.qru || '',
      pasta: reg.pasta || '',
      data: (reg.data || '').substring(0, 10),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReg) return;
    setIsSaving(true);
    try {
      await updateRegistration.mutateAsync({
        id: editingReg.id,
        nome: editForm.nome,
        qru: editForm.qru,
        pasta: editForm.pasta,
        data: editForm.data,
      });
      toast.success('Registro atualizado com sucesso!');
      setEditingReg(null);
    } catch {
      toast.error('Erro ao atualizar registro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRegistration.mutateAsync(deleteTarget);
      toast.success('Registro removido com sucesso!');
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao remover registro');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00ff87]" />
          </div>
        </main>
      </div>
    );
  }

  if (passportRegistrations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="mb-6 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Dashboard
          </Button>
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Nenhum registro encontrado para o passaporte {passaporte}.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const firstReg = passportRegistrations[passportRegistrations.length - 1];
  const lastReg  = passportRegistrations[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="mb-6 border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Dashboard
        </Button>

        {/* Card principal com foto e informações */}
        <div className="bg-[#1e293b] rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Foto */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-lg bg-[#0f172a] flex items-center justify-center overflow-hidden border-2 border-gray-700">
                {latestPhoto ? (
                  <img
                    src={latestPhoto}
                    alt={personName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User className={latestPhoto ? 'hidden' : 'h-24 w-24 text-gray-600'} />
              </div>
              {latestPhoto && (
                <div className="flex flex-col items-center gap-1 mt-2">
                  <p className="text-xs text-gray-500">Foto mais recente</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPhoto(latestPhoto, `foto-${passaporte}-${personName}.jpg`)}
                    className="border-[#00ff87] text-[#00ff87] hover:bg-[#00ff87]/10 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Baixar Foto
                  </Button>
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{personName}</h1>

              <div className="flex items-center gap-2 text-gray-400 mb-6">
                <FileText className="h-5 w-5 text-[#00ff87]" />
                <span className="font-mono text-xl">Passaporte: {passaporte}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0f172a] p-4 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Total de Registros</p>
                  <p className="text-2xl font-bold text-[#00ff87]">
                    {passportRegistrations.length}
                  </p>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Primeiro Registro</p>
                  <p className="text-lg font-bold text-white">
                    {formatDate(firstReg?.data)}
                  </p>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Último Registro</p>
                  <p className="text-lg font-bold text-white">
                    {formatDate(lastReg?.data)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de histórico */}
        <div className="bg-[#1e293b] rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Histórico de Registros</h2>
            <p className="text-sm text-gray-400">
              Todos os registros ordenados do mais recente para o mais antigo
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                <TableHead className="w-16 text-gray-400">Foto</TableHead>
                <TableHead className="text-gray-400">QRU</TableHead>
                <TableHead className="text-gray-400">Pasta</TableHead>
                <TableHead className="text-gray-400">Data do Registro</TableHead>
                <TableHead className="text-gray-400">Data de Cadastro</TableHead>
                {(canEdit || canDelete) && (
                  <TableHead className="text-gray-400 w-24">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {passportRegistrations.map((registration, index) => (
                <TableRow
                  key={registration.id}
                  className={`border-gray-700 hover:bg-[#0f172a] ${
                    index === 0 ? 'bg-[#00ff87]/5' : ''
                  }`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
                        {registration.imagem_url ? (
                          <img
                            src={registration.imagem_url}
                            alt={registration.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <User
                          className={registration.imagem_url ? 'hidden' : 'h-5 w-5 text-gray-600'}
                        />
                      </div>
                      {registration.imagem_url && (
                        <button
                          onClick={() => handleDownloadPhoto(registration.imagem_url, `foto-${passaporte}-${registration.data}.jpg`)}
                          className="text-[#00ff87] hover:text-[#00ff87]/80 transition-colors"
                          title="Baixar foto"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-300 flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-[#00ff87]" />
                      {registration.qru}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-300 flex items-center gap-2">
                      <FolderOpen className="h-3 w-3 text-[#00ff87]" />
                      {registration.pasta}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-300 flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-[#00ff87]" />
                      {formatDate(registration.data)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-400 text-sm">
                      {formatDateTime(registration.data_cadastro)}
                    </span>
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(registration)}
                            className="border-blue-500 text-blue-400 hover:bg-blue-500/10 h-8 w-8 p-0"
                            title="Editar registro"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTarget(registration.id)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                            title="Remover registro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Veículos vinculados */}
        {passportVehicles.length > 0 && (
          <div className="bg-[#1e293b] rounded-lg border border-gray-700 overflow-hidden mt-8">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Car className="h-5 w-5 text-[#00ff87]" />
                Veículos Vinculados
              </h2>
              <p className="text-sm text-gray-400">
                {passportVehicles.length} veículo{passportVehicles.length !== 1 ? 's' : ''} registrado{passportVehicles.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {passportVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-[#0f172a] rounded-lg border border-gray-700 overflow-hidden"
                >
                  <div className="h-40 bg-gray-800 flex items-center justify-center">
                    {vehicle.imagem_url ? (
                      <img
                        src={vehicle.imagem_url}
                        alt={vehicle.modelo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-12 w-12 text-gray-600" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white font-semibold font-mono text-lg">{vehicle.placa}</p>
                    <p className="text-gray-300 text-sm">{vehicle.modelo}</p>
                    <p className="text-gray-400 text-sm">Cor: {vehicle.cor}</p>
                    {vehicle.pasta && (
                      <p className="text-[#00ff87]/80 text-xs mt-1 flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {vehicle.pasta}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Edição */}
      <Dialog open={!!editingReg} onOpenChange={(open) => { if (!open) setEditingReg(null); }}>
        <DialogContent className="bg-[#1e293b] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Registro</DialogTitle>
          </DialogHeader>
          {editingReg && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-gray-400 mb-1 block text-sm">Passaporte</Label>
                <Input value={editingReg.passaporte} disabled className="bg-[#0f172a] border-gray-600 text-gray-500" />
              </div>
              <div>
                <Label className="text-gray-400 mb-1 block text-sm">Nome *</Label>
                <Input
                  value={editForm.nome}
                  onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 mb-1 block text-sm">QRU *</Label>
                  <Select value={editForm.qru} onValueChange={(v) => setEditForm((f) => ({ ...f, qru: v }))}>
                    <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-gray-700">
                      {qrus?.filter((q) => q.ativo).map((qru) => (
                        <SelectItem key={qru.id} value={qru.nome} className="text-white">
                          {qru.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 mb-1 block text-sm">Pasta *</Label>
                  <Select value={editForm.pasta} onValueChange={(v) => setEditForm((f) => ({ ...f, pasta: v }))}>
                    <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-gray-700">
                      {allowedPastas.map((pasta) => (
                        <SelectItem key={pasta.id} value={pasta.nome} className="text-white">
                          {pasta.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-400 mb-1 block text-sm">Data *</Label>
                <Input
                  type="date"
                  value={editForm.data}
                  onChange={(e) => setEditForm((f) => ({ ...f, data: e.target.value }))}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingReg(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving || !editForm.nome || !editForm.qru || !editForm.pasta || !editForm.data}
              className="bg-[#00ff87] text-[#0f172a] hover:bg-[#00ff87]/90 font-semibold"
            >
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão individual */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#1e293b] border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Este registro será removido permanentemente do histórico deste passaporte. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteTarget(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Removendo...</> : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
