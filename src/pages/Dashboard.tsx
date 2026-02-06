/**
 * Página de Dashboard - Visualização de registros em tabela com seleção múltipla
 */

import { useState, useMemo } from 'react';
import { useRegistrations } from '@/hooks/queries/useRegistrations';
import { usePastas } from '@/hooks/queries/usePastas';
import { useQRUs } from '@/hooks/queries/useQRUs';
import { useUpdateRegistration } from '@/hooks/mutations/useUpdateRegistration';
import { useDeleteRegistration } from '@/hooks/mutations/useDeleteRegistration';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Loader2, Search, User, FileText, MapPin, Calendar, X, Pencil, Trash2 } from 'lucide-react';
import type { Registration } from '@/services/types';

export default function Dashboard() {
  const { data: registrations, isLoading: isLoadingRegistrations } = useRegistrations();
  const { data: pastas, isLoading: isLoadingPastas } = usePastas();
  const { data: qrus } = useQRUs();
  const { hasPermission, getAllowedPastas } = useAuth();

  // Permissões do usuário
  const canEdit = hasPermission('pode_editar');
  const canDelete = hasPermission('pode_deletar');

  // Filtrar pastas permitidas para o usuário
  const allowedPastas = useMemo(() => {
    if (!pastas) return [];
    return getAllowedPastas(pastas).filter(p => p.ativo);
  }, [pastas, getAllowedPastas]);

  const [selectedPasta, setSelectedPasta] = useState<string>('all');
  const [selectedQRU, setSelectedQRU] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'multiple';
    ids: string[];
    name?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit functionality
  const [editingRecord, setEditingRecord] = useState<Registration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    passaporte: '',
    nome: '',
    qru: '',
    pasta: '',
    data: '',
    imagem_url: '',
  });

  const { mutate: updateRegistration, isPending: isUpdating } = useUpdateRegistration();
  const { mutateAsync: deleteRegistration } = useDeleteRegistration();
  const { toast } = useToast();

  // Filtrar registros (case-insensitive e trim) considerando permissões de pasta
  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];

    // Nomes das pastas permitidas para comparação
    const allowedPastaNames = allowedPastas.map(p => p.nome.toLowerCase());

    return registrations.filter((reg) => {
      const regPasta = (reg.pasta || '').toString().trim().toLowerCase();
      const regQRU = (reg.qru || '').toString().trim().toLowerCase();
      const selectedPastaLower = selectedPasta.toLowerCase();
      const selectedQRULower = selectedQRU.toLowerCase();

      // Primeiro, verificar se o usuário tem acesso a esta pasta
      const hasAccessToPasta = allowedPastaNames.includes(regPasta);
      if (!hasAccessToPasta) return false;

      const matchPasta = selectedPasta === 'all' || regPasta === selectedPastaLower;
      const matchQRU = selectedQRU === 'all' || regQRU === selectedQRULower;
      const matchSearch =
        searchTerm === '' ||
        (reg.nome || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.passaporte || '').toString().toLowerCase().includes(searchTerm.toLowerCase());

      return matchPasta && matchQRU && matchSearch;
    });
  }, [registrations, allowedPastas, selectedPasta, selectedQRU, searchTerm]);

  const clearFilters = () => {
    setSelectedPasta('all');
    setSelectedQRU('all');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedPasta !== 'all' || selectedQRU !== 'all' || searchTerm !== '';

  // Selection functions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredRegistrations.map((r) => r.id);
    const allSelected = filteredIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      // Deselect all filtered
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        filteredIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all filtered
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        filteredIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected =
    filteredRegistrations.length > 0 &&
    filteredRegistrations.every((r) => selectedIds.has(r.id));

  const selectedCount = Array.from(selectedIds).filter((id) =>
    filteredRegistrations.some((r) => r.id === id)
  ).length;

  // Delete functions
  const handleDeleteSingle = (registration: Registration) => {
    setDeleteTarget({
      type: 'single',
      ids: [registration.id],
      name: registration.nome,
    });
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Array.from(selectedIds).filter((id) =>
      filteredRegistrations.some((r) => r.id === id)
    );
    setDeleteTarget({
      type: 'multiple',
      ids: idsToDelete,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      // Delete all selected records
      await Promise.all(deleteTarget.ids.map((id) => deleteRegistration(id)));

      toast({
        title: 'Registro(s) excluído(s) com sucesso!',
        description:
          deleteTarget.type === 'single'
            ? `O registro de ${deleteTarget.name} foi excluído.`
            : `${deleteTarget.ids.length} registro(s) foram excluídos.`,
      });

      // Clear selection for deleted items
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        deleteTarget.ids.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir registro(s)',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Handle edit button click
  const handleEdit = (registration: Registration) => {
    setEditingRecord(registration);
    setEditFormData({
      passaporte: registration.passaporte,
      nome: registration.nome,
      qru: registration.qru,
      pasta: registration.pasta,
      data: registration.data,
      imagem_url: registration.imagem_url || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    updateRegistration(
      {
        id: editingRecord.id,
        ...editFormData,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Registro atualizado com sucesso!',
            description: 'As alterações foram salvas.',
          });
          setIsEditDialogOpen(false);
          setEditingRecord(null);
        },
        onError: (error) => {
          toast({
            title: 'Erro ao atualizar registro',
            description: error instanceof Error ? error.message : 'Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header com título e estatísticas */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard de Registros</h1>
          <p className="text-gray-400">
            Visualize e filtre os registros cadastrados no sistema
          </p>
          <div className="mt-4 flex gap-4 flex-wrap">
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400">Total de Registros</p>
              <p className="text-2xl font-bold text-[#00ff87]">
                {registrations?.length || 0}
              </p>
            </div>
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400">Filtrados</p>
              <p className="text-2xl font-bold text-white">
                {filteredRegistrations.length}
              </p>
            </div>
            {selectedCount > 0 && (
              <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-[#00ff87]">
                <p className="text-xs text-gray-400">Selecionados</p>
                <p className="text-2xl font-bold text-[#00ff87]">{selectedCount}</p>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#1e293b] rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Filtros</h2>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de Pasta - mostra apenas pastas permitidas */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Pasta</label>
              <Select
                value={selectedPasta}
                onValueChange={setSelectedPasta}
                disabled={isLoadingPastas}
              >
                <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                  <SelectValue placeholder="Todas as pastas" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-gray-700">
                  <SelectItem value="all" className="text-white">
                    Todas as pastas
                  </SelectItem>
                  {allowedPastas.map((pasta) => (
                    <SelectItem key={pasta.id} value={pasta.nome} className="text-white">
                      {pasta.codigo} - {pasta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de QRU */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">QRU</label>
              <Select value={selectedQRU} onValueChange={setSelectedQRU}>
                <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                  <SelectValue placeholder="Todos os QRUs" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-gray-700">
                  <SelectItem value="all" className="text-white">
                    Todos os QRUs
                  </SelectItem>
                  {qrus?.filter(q => q.ativo).map((qru) => (
                    <SelectItem key={qru.id} value={qru.nome} className="text-white">
                      {qru.codigo} - {qru.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nome ou passaporte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0f172a] border-gray-600 text-white pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de ações em massa - só aparece se tem permissão de deletar */}
        {canDelete && selectedCount > 0 && (
          <div className="bg-[#1e293b] rounded-lg p-4 mb-6 border border-[#00ff87] flex items-center justify-between">
            <span className="text-white">
              {selectedCount} registro(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Limpar Seleção
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Selecionados ({selectedCount})
              </Button>
            </div>
          </div>
        )}

        {/* Tabela de Registros */}
        {isLoadingRegistrations ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00ff87]" />
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {hasActiveFilters
                ? 'Nenhum registro encontrado com os filtros aplicados.'
                : 'Nenhum registro cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-lg border border-gray-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                  {canDelete && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        className="border-gray-500 data-[state=checked]:bg-[#00ff87] data-[state=checked]:border-[#00ff87]"
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-16 text-gray-400">Foto</TableHead>
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">Passaporte</TableHead>
                  <TableHead className="text-gray-400">QRU</TableHead>
                  <TableHead className="text-gray-400">Pasta</TableHead>
                  <TableHead className="text-gray-400">Data</TableHead>
                  {(canEdit || canDelete) && (
                    <TableHead className="w-24 text-gray-400">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow
                    key={registration.id}
                    className="border-gray-700 hover:bg-[#0f172a]"
                    data-state={selectedIds.has(registration.id) ? 'selected' : undefined}
                  >
                    {canDelete && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(registration.id)}
                          onCheckedChange={() => toggleSelect(registration.id)}
                          className="border-gray-500 data-[state=checked]:bg-[#00ff87] data-[state=checked]:border-[#00ff87]"
                        />
                      </TableCell>
                    )}
                    <TableCell>
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
                        <User className={registration.imagem_url ? 'hidden' : 'h-5 w-5 text-gray-600'} />
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {registration.nome}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-gray-300 flex items-center gap-2">
                        <FileText className="h-3 w-3 text-[#00ff87]" />
                        {registration.passaporte}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-[#00ff87]" />
                        {registration.qru}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300 flex items-center gap-2">
                        <FileText className="h-3 w-3 text-[#00ff87]" />
                        {registration.pasta}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300 flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-[#00ff87]" />
                        {new Date(registration.data).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(registration)}
                              className="text-gray-400 hover:text-[#00ff87] hover:bg-[#00ff87]/10 h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSingle(registration)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
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
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1e293b] border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Editar Registro</DialogTitle>
            <DialogDescription className="text-gray-400">
              Faça as alterações necessárias e clique em salvar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Passaporte */}
              <div>
                <Label htmlFor="edit-passaporte" className="text-gray-300">
                  Passaporte
                </Label>
                <Input
                  id="edit-passaporte"
                  value={editFormData.passaporte}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, passaporte: e.target.value })
                  }
                  className="bg-[#0f172a] border-gray-600 text-white mt-1"
                  required
                />
              </div>

              {/* Nome */}
              <div>
                <Label htmlFor="edit-nome" className="text-gray-300">
                  Nome
                </Label>
                <Input
                  id="edit-nome"
                  value={editFormData.nome}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, nome: e.target.value })
                  }
                  className="bg-[#0f172a] border-gray-600 text-white mt-1"
                  required
                />
              </div>

              {/* QRU */}
              <div>
                <Label htmlFor="edit-qru" className="text-gray-300">
                  QRU
                </Label>
                <Select
                  value={editFormData.qru}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, qru: value })
                  }
                >
                  <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-gray-700">
                    {qrus?.filter(q => q.ativo).map((qru) => (
                      <SelectItem key={qru.id} value={qru.nome} className="text-white">
                        {qru.codigo} - {qru.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pasta - mostra apenas pastas permitidas */}
              <div>
                <Label htmlFor="edit-pasta" className="text-gray-300">
                  Pasta
                </Label>
                <Select
                  value={editFormData.pasta}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, pasta: value })
                  }
                >
                  <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-gray-700">
                    {allowedPastas.map((pasta) => (
                      <SelectItem key={pasta.id} value={pasta.nome} className="text-white">
                        {pasta.codigo} - {pasta.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data */}
              <div className="md:col-span-2">
                <Label htmlFor="edit-data" className="text-gray-300">
                  Data
                </Label>
                <Input
                  id="edit-data"
                  type="date"
                  value={editFormData.data}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, data: e.target.value })
                  }
                  className="bg-[#0f172a] border-gray-600 text-white mt-1"
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#00ff87] text-black hover:bg-[#00cc6a]"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#1e293b] border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {deleteTarget?.type === 'single'
                ? `Tem certeza que deseja excluir o registro de "${deleteTarget.name}"? Esta ação não pode ser desfeita.`
                : `Tem certeza que deseja excluir ${deleteTarget?.ids.length} registro(s)? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
