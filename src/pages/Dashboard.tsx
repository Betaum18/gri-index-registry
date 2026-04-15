/**
 * Página de Dashboard - Pesquisa de registros
 * Mostra resultados agrupados por passaporte sem duplicatas
 * Suporta seleção múltipla, edição individual e exclusão individual/coletiva
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistrations } from '@/hooks/queries/useRegistrations';
import { usePastas } from '@/hooks/queries/usePastas';
import { useQRUs } from '@/hooks/queries/useQRUs';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteRegistration } from '@/hooks/mutations/useDeleteRegistration';
import { useUpdateRegistration } from '@/hooks/mutations/useUpdateRegistration';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  Search,
  User,
  FileText,
  MapPin,
  X,
  Eye,
  AlertTriangle,
  Calendar,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Registration } from '@/services/types';

interface GroupedPerson {
  passaporte: string;
  nome: string;
  latestPhoto: string;
  totalRegistros: number;
  lastQRU: string;
  lastPasta: string;
  lastDate: string;
  allPastas: string[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: registrations, isLoading: isLoadingRegistrations } = useRegistrations();
  const { data: pastas, isLoading: isLoadingPastas } = usePastas();
  const { data: qrus } = useQRUs();
  const { getAllowedPastas, hasPermission } = useAuth();
  const deleteRegistration = useDeleteRegistration();
  const updateRegistration = useUpdateRegistration();

  const canEdit = hasPermission('pode_editar');
  const canDelete = hasPermission('pode_deletar');

  // Filtrar pastas permitidas para o usuário
  const allowedPastas = useMemo(() => {
    if (!pastas) return [];
    return getAllowedPastas(pastas).filter(p => p.ativo);
  }, [pastas, getAllowedPastas]);

  // Filtros
  const [selectedPasta, setSelectedPasta] = useState<string>('all');
  const [selectedQRU, setSelectedQRU] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMultiplePastas, setShowMultiplePastas] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Seleção múltipla
  const [selectedPassportes, setSelectedPassportes] = useState<Set<string>>(new Set());

  // Edição individual
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', qru: '', pasta: '', data: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Exclusão
  const [deleteTargets, setDeleteTargets] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSearching = searchTerm.trim().length >= 2 || selectedPasta !== 'all' || selectedQRU !== 'all' || showMultiplePastas || dateFrom !== '' || dateTo !== '';

  const groupedResults = useMemo(() => {
    if (!registrations || !isSearching) return [];

    const allowedPastaNames = allowedPastas.map(p => p.nome.toLowerCase());

    const allPastasMap = new Map<string, string[]>();
    if (showMultiplePastas) {
      registrations.forEach((reg) => {
        const regPasta = (reg.pasta || '').toString().trim().toLowerCase();
        if (!allowedPastaNames.includes(regPasta)) return;
        // "Não Associados" não conta como afiliação para fins de múltiplas pastas
        if (regPasta === 'não associados' || regPasta === 'nao associados') return;
        const pastas = allPastasMap.get(reg.passaporte) || [];
        if (!pastas.includes(reg.pasta)) pastas.push(reg.pasta);
        allPastasMap.set(reg.passaporte, pastas);
      });
    }

    const filtered = registrations.filter((reg) => {
      const regPasta = (reg.pasta || '').toString().trim().toLowerCase();
      const regQRU = (reg.qru || '').toString().trim().toLowerCase();
      if (!allowedPastaNames.includes(regPasta)) return false;
      const matchPasta = selectedPasta === 'all' || regPasta === selectedPasta.toLowerCase();
      const matchQRU = selectedQRU === 'all' || regQRU === selectedQRU.toLowerCase();
      const matchSearch =
        searchTerm.trim() === '' ||
        (reg.nome || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.passaporte || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
      const regDateStr = (reg.data || '').toString().substring(0, 10);
      const matchDateFrom = dateFrom === '' || regDateStr >= dateFrom;
      const matchDateTo = dateTo === '' || regDateStr <= dateTo;
      return matchPasta && matchQRU && matchSearch && matchDateFrom && matchDateTo;
    });

    const grouped = new Map<string, GroupedPerson>();
    filtered.forEach((reg) => {
      const existing = grouped.get(reg.passaporte);
      const regDate = new Date(reg.data_cadastro || (reg.data + 'T12:00:00')).getTime();
      if (!existing) {
        grouped.set(reg.passaporte, {
          passaporte: reg.passaporte,
          nome: reg.nome,
          latestPhoto: reg.imagem_url || '',
          totalRegistros: 1,
          lastQRU: reg.qru,
          lastPasta: reg.pasta,
          lastDate: reg.data_cadastro || reg.data,
          allPastas: showMultiplePastas ? (allPastasMap.get(reg.passaporte) || [reg.pasta]) : [reg.pasta],
          _latestPhotoDate: reg.imagem_url ? regDate : 0,
        } as GroupedPerson & { _latestPhotoDate: number });
      } else {
        existing.totalRegistros++;
        if (!showMultiplePastas && !existing.allPastas.includes(reg.pasta)) existing.allPastas.push(reg.pasta);
        const existingPhotoDate = (existing as GroupedPerson & { _latestPhotoDate: number })._latestPhotoDate || 0;
        if (reg.imagem_url && regDate > existingPhotoDate) {
          existing.latestPhoto = reg.imagem_url;
          (existing as GroupedPerson & { _latestPhotoDate: number })._latestPhotoDate = regDate;
        }
        const existingDate = new Date(existing.lastDate.includes('T') ? existing.lastDate : existing.lastDate + 'T12:00:00').getTime();
        if (regDate > existingDate) {
          existing.nome = reg.nome;
          existing.lastQRU = reg.qru;
          existing.lastPasta = reg.pasta;
          existing.lastDate = reg.data_cadastro || reg.data;
        }
      }
    });

    let results = Array.from(grouped.values());
    if (showMultiplePastas) results = results.filter(p => p.allPastas.length >= 2);
    return results.sort((a, b) => {
      const dateB = new Date(b.lastDate.includes('T') ? b.lastDate : b.lastDate + 'T12:00:00').getTime();
      const dateA = new Date(a.lastDate.includes('T') ? a.lastDate : a.lastDate + 'T12:00:00').getTime();
      return dateB - dateA;
    });
  }, [registrations, allowedPastas, selectedPasta, selectedQRU, searchTerm, isSearching, showMultiplePastas, dateFrom, dateTo]);

  // Quando os resultados mudam, limpar seleções que saíram da lista
  const visiblePassportes = new Set(groupedResults.map(p => p.passaporte));
  const activeSelected = new Set([...selectedPassportes].filter(p => visiblePassportes.has(p)));

  const clearFilters = () => {
    setSelectedPasta('all');
    setSelectedQRU('all');
    setSearchTerm('');
    setShowMultiplePastas(false);
    setDateFrom('');
    setDateTo('');
    setSelectedPassportes(new Set());
  };

  const hasActiveFilters = selectedPasta !== 'all' || selectedQRU !== 'all' || searchTerm !== '' || showMultiplePastas || dateFrom !== '' || dateTo !== '';

  // Seleção
  const allVisibleSelected = groupedResults.length > 0 && groupedResults.every(p => activeSelected.has(p.passaporte));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedPassportes(new Set());
    } else {
      setSelectedPassportes(new Set(groupedResults.map(p => p.passaporte)));
    }
  };

  const toggleSelect = (passaporte: string) => {
    setSelectedPassportes(prev => {
      const next = new Set(prev);
      if (next.has(passaporte)) next.delete(passaporte);
      else next.add(passaporte);
      return next;
    });
  };

  // Encontrar registro mais recente de um passaporte
  const getLatestRegistration = (passaporte: string): Registration | null => {
    if (!registrations) return null;
    const regs = registrations.filter(r => String(r.passaporte) === String(passaporte));
    if (!regs.length) return null;
    return regs.sort((a, b) =>
      new Date(b.data_cadastro || (b.data + 'T12:00:00')).getTime() - new Date(a.data_cadastro || (a.data + 'T12:00:00')).getTime()
    )[0];
  };

  // Abrir edição
  const handleEdit = (passaporte: string) => {
    const reg = getLatestRegistration(passaporte);
    if (!reg) return;
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

  // Exclusão — recebe lista de passaportes e deleta TODOS os registros de cada um
  const handleDelete = async () => {
    if (!registrations || deleteTargets.length === 0) return;
    setIsDeleting(true);
    try {
      for (const passaporte of deleteTargets) {
        const regs = registrations.filter(r => String(r.passaporte) === String(passaporte));
        for (const reg of regs) {
          await deleteRegistration.mutateAsync(reg.id);
        }
      }
      const total = deleteTargets.length;
      setSelectedPassportes(new Set());
      setDeleteTargets([]);
      toast.success(`${total} passaporte${total > 1 ? 's' : ''} excluído${total > 1 ? 's' : ''} com sucesso!`);
    } catch {
      toast.error('Erro ao excluir registros');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pesquisa de Registros</h1>
          <p className="text-gray-400">Digite o nome ou passaporte para buscar registros no sistema</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1e293b] rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-[#00ff87]" />
              Buscar
            </h2>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="text-sm text-gray-400 mb-2 block">Nome ou Passaporte</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Digite pelo menos 2 caracteres para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0f172a] border-gray-600 text-white pl-12 py-6 text-lg"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Filtrar por Pasta</label>
              <Select value={selectedPasta} onValueChange={setSelectedPasta} disabled={isLoadingPastas}>
                <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                  <SelectValue placeholder="Todas as pastas" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-gray-700">
                  <SelectItem value="all" className="text-white">Todas as pastas</SelectItem>
                  {allowedPastas.map((pasta) => (
                    <SelectItem key={pasta.id} value={pasta.nome} className="text-white">
                      {pasta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Filtrar por QRU</label>
              <Select value={selectedQRU} onValueChange={setSelectedQRU}>
                <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                  <SelectValue placeholder="Todos os QRUs" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-gray-700">
                  <SelectItem value="all" className="text-white">Todos os QRUs</SelectItem>
                  {qrus?.filter(q => q.ativo).map((qru) => (
                    <SelectItem key={qru.id} value={qru.nome} className="text-white">
                      {qru.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                De
              </label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-[#0f172a] border-gray-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Até
              </label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-[#0f172a] border-gray-600 text-white" />
            </div>

            <div className="flex flex-col gap-3 justify-end">
              <Button
                variant={showMultiplePastas ? 'default' : 'outline'}
                onClick={() => setShowMultiplePastas(!showMultiplePastas)}
                className={showMultiplePastas
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                  : 'border-amber-600 text-amber-400 hover:bg-amber-600/10'
                }
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Múltiplas Pastas
              </Button>
              {isSearching && (
                <div className="bg-[#0f172a] px-4 py-2 rounded-lg border border-gray-700 w-full">
                  <p className="text-xs text-gray-400">Resultados encontrados</p>
                  <p className="text-2xl font-bold text-[#00ff87]">{groupedResults.length}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar de ações em massa */}
        {canDelete && activeSelected.size > 0 && (
          <div className="bg-[#1e293b] border border-red-500/30 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-300">
              <span className="text-[#00ff87] font-bold">{activeSelected.size}</span> passaporte{activeSelected.size > 1 ? 's' : ''} selecionado{activeSelected.size > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPassportes(new Set())}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => setDeleteTargets([...activeSelected])}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Excluir selecionados
              </Button>
            </div>
          </div>
        )}

        {/* Resultados */}
        {isLoadingRegistrations ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00ff87]" />
          </div>
        ) : !isSearching ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Digite um nome ou passaporte para iniciar a busca</p>
            <p className="text-gray-500 text-sm">Ou use os filtros de pasta e QRU para refinar os resultados</p>
          </div>
        ) : groupedResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum registro encontrado com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-lg border border-gray-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                  {canDelete && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={toggleSelectAll}
                        className="border-gray-500"
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-16 text-gray-400">Foto</TableHead>
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">Passaporte</TableHead>
                  <TableHead className="text-gray-400">Registros</TableHead>
                  <TableHead className="text-gray-400">Último QRU</TableHead>
                  <TableHead className="text-gray-400">Última Pasta</TableHead>
                  <TableHead className="text-gray-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedResults.map((person) => (
                  <TableRow
                    key={person.passaporte}
                    className={`border-gray-700 hover:bg-[#0f172a] ${activeSelected.has(person.passaporte) ? 'bg-[#00ff87]/5' : ''}`}
                  >
                    {canDelete && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={activeSelected.has(person.passaporte)}
                          onCheckedChange={() => toggleSelect(person.passaporte)}
                          className="border-gray-500"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div
                        className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/passaporte/${person.passaporte}`)}
                      >
                        {person.latestPhoto ? (
                          <img
                            src={person.latestPhoto}
                            alt={person.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <User className={person.latestPhoto ? 'hidden' : 'h-5 w-5 text-gray-600'} />
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium cursor-pointer" onClick={() => navigate(`/passaporte/${person.passaporte}`)}>
                      {person.nome}
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => navigate(`/passaporte/${person.passaporte}`)}>
                      <span className="font-mono text-gray-300 flex items-center gap-2">
                        <FileText className="h-3 w-3 text-[#00ff87]" />
                        {person.passaporte}
                      </span>
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => navigate(`/passaporte/${person.passaporte}`)}>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30">
                        {person.totalRegistros} {person.totalRegistros === 1 ? 'registro' : 'registros'}
                      </span>
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => navigate(`/passaporte/${person.passaporte}`)}>
                      <span className="text-gray-300 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-[#00ff87]" />
                        {person.lastQRU}
                      </span>
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => navigate(`/passaporte/${person.passaporte}`)}>
                      {person.allPastas.length >= 2 ? (
                        <div className="flex flex-wrap gap-1">
                          {person.allPastas.map((pasta) => (
                            <Badge key={pasta} variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 text-xs">
                              {pasta}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 flex items-center gap-2">
                          <FileText className="h-3 w-3 text-[#00ff87]" />
                          {person.lastPasta}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/passaporte/${person.passaporte}`)}
                          className="border-[#00ff87] text-[#00ff87] hover:bg-[#00ff87]/10"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(person.passaporte)}
                            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                            title="Editar registro"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTargets([person.passaporte])}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            title="Excluir registros"
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
                  onChange={(e) => setEditForm(f => ({ ...f, nome: e.target.value }))}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 mb-1 block text-sm">QRU *</Label>
                  <Select value={editForm.qru} onValueChange={(v) => setEditForm(f => ({ ...f, qru: v }))}>
                    <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-gray-700">
                      {qrus?.filter(q => q.ativo).map((qru) => (
                        <SelectItem key={qru.id} value={qru.nome} className="text-white">
                          {qru.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 mb-1 block text-sm">Pasta *</Label>
                  <Select value={editForm.pasta} onValueChange={(v) => setEditForm(f => ({ ...f, pasta: v }))}>
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
                  onChange={(e) => setEditForm(f => ({ ...f, data: e.target.value }))}
                  className="bg-[#0f172a] border-gray-600 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReg(null)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteTargets.length > 0} onOpenChange={(open) => { if (!open) setDeleteTargets([]); }}>
        <AlertDialogContent className="bg-[#1e293b] border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {deleteTargets.length === 1
                ? 'Todos os registros deste passaporte serão excluídos permanentemente. Esta ação não pode ser desfeita.'
                : `Todos os registros de ${deleteTargets.length} passaportes serão excluídos permanentemente. Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteTargets([])}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
