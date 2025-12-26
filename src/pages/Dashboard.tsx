/**
 * Página de Dashboard - Visualização de registros por Pasta
 */

import { useState } from 'react';
import { useRegistrations } from '@/hooks/queries/useRegistrations';
import { usePastas } from '@/hooks/queries/usePastas';
import { useQRUs } from '@/hooks/queries/useQRUs';
import { useUpdateRegistration } from '@/hooks/mutations/useUpdateRegistration';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Search, User, FileText, MapPin, Calendar, X, Pencil } from 'lucide-react';
import type { Registration } from '@/services/types';

export default function Dashboard() {
  const { data: registrations, isLoading: isLoadingRegistrations } = useRegistrations();
  const { data: pastas, isLoading: isLoadingPastas } = usePastas();
  const { data: qrus } = useQRUs();

  const [selectedPasta, setSelectedPasta] = useState<string>('all');
  const [selectedQRU, setSelectedQRU] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
  const { toast } = useToast();

  // Filtrar registros (case-insensitive e trim)
  const filteredRegistrations = registrations?.filter((reg) => {
    const regPasta = (reg.pasta || '').toString().trim().toLowerCase();
    const regQRU = (reg.qru || '').toString().trim().toLowerCase();
    const selectedPastaLower = selectedPasta.toLowerCase();
    const selectedQRULower = selectedQRU.toLowerCase();

    const matchPasta = selectedPasta === 'all' || regPasta === selectedPastaLower;
    const matchQRU = selectedQRU === 'all' || regQRU === selectedQRULower;
    const matchSearch =
      searchTerm === '' ||
      (reg.nome || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.passaporte || '').toString().toLowerCase().includes(searchTerm.toLowerCase());

    return matchPasta && matchQRU && matchSearch;
  }) || [];

  const clearFilters = () => {
    setSelectedPasta('all');
    setSelectedQRU('all');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedPasta !== 'all' || selectedQRU !== 'all' || searchTerm !== '';

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
            {/* Filtro de Pasta */}
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
                  {pastas?.filter(p => p.ativo).map((pasta) => (
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

        {/* Lista de Registros */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRegistrations.map((registration) => (
              <Card
                key={registration.id}
                className="bg-[#1e293b] border-gray-700 hover:border-[#00ff87] transition-all overflow-hidden"
              >
                {/* Imagem */}
                <div className="h-48 bg-[#0f172a] flex items-center justify-center overflow-hidden">
                  {registration.imagem_url ? (
                    <img
                      src={registration.imagem_url}
                      alt={registration.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Se a imagem falhar ao carregar, mostra o placeholder
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={registration.imagem_url ? 'hidden' : ''}>
                    <User className="h-16 w-16 text-gray-600" />
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">
                        {registration.nome}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        <div className="flex items-center gap-2 mt-1">
                          <FileText className="h-3 w-3" />
                          <span className="font-mono">{registration.passaporte}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(registration)}
                      className="text-gray-400 hover:text-[#00ff87] hover:bg-[#00ff87]/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="h-4 w-4 text-[#00ff87]" />
                    <span>{registration.qru}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <FileText className="h-4 w-4 text-[#00ff87]" />
                    <span>{registration.pasta}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar className="h-4 w-4 text-[#00ff87]" />
                    <span>{new Date(registration.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
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

              {/* Pasta */}
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
                    {pastas?.filter(p => p.ativo).map((pasta) => (
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
    </div>
  );
}
