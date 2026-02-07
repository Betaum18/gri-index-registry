/**
 * Página de Dashboard - Pesquisa de registros
 * Mostra resultados agrupados por passaporte sem duplicatas
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistrations } from '@/hooks/queries/useRegistrations';
import { usePastas } from '@/hooks/queries/usePastas';
import { useQRUs } from '@/hooks/queries/useQRUs';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Loader2, Search, User, FileText, MapPin, X, Eye, AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const { getAllowedPastas } = useAuth();

  // Filtrar pastas permitidas para o usuário
  const allowedPastas = useMemo(() => {
    if (!pastas) return [];
    return getAllowedPastas(pastas).filter(p => p.ativo);
  }, [pastas, getAllowedPastas]);

  const [selectedPasta, setSelectedPasta] = useState<string>('all');
  const [selectedQRU, setSelectedQRU] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMultiplePastas, setShowMultiplePastas] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Verificar se o usuário está pesquisando
  const isSearching = searchTerm.trim().length >= 2 || selectedPasta !== 'all' || selectedQRU !== 'all' || showMultiplePastas || dateFrom !== '' || dateTo !== '';

  // Agrupar registros por passaporte (sem duplicatas)
  const groupedResults = useMemo(() => {
    if (!registrations || !isSearching) return [];

    // Nomes das pastas permitidas para comparação
    const allowedPastaNames = allowedPastas.map(p => p.nome.toLowerCase());

    // Quando showMultiplePastas está ativo, primeiro mapear TODAS as pastas
    // de cada passaporte (considerando todas as pastas permitidas)
    const allPastasMap = new Map<string, string[]>();
    if (showMultiplePastas) {
      registrations.forEach((reg) => {
        const regPasta = (reg.pasta || '').toString().trim().toLowerCase();
        if (!allowedPastaNames.includes(regPasta)) return;
        const pastas = allPastasMap.get(reg.passaporte) || [];
        if (!pastas.includes(reg.pasta)) {
          pastas.push(reg.pasta);
        }
        allPastasMap.set(reg.passaporte, pastas);
      });
    }

    // Filtrar os registros
    const filtered = registrations.filter((reg) => {
      const regPasta = (reg.pasta || '').toString().trim().toLowerCase();
      const regQRU = (reg.qru || '').toString().trim().toLowerCase();
      const selectedPastaLower = selectedPasta.toLowerCase();
      const selectedQRULower = selectedQRU.toLowerCase();

      // Verificar se o usuário tem acesso a esta pasta
      const hasAccessToPasta = allowedPastaNames.includes(regPasta);
      if (!hasAccessToPasta) return false;

      const matchPasta = selectedPasta === 'all' || regPasta === selectedPastaLower;
      const matchQRU = selectedQRU === 'all' || regQRU === selectedQRULower;
      const matchSearch =
        searchTerm.trim() === '' ||
        (reg.nome || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.passaporte || '').toString().toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de período
      const regDateStr = (reg.data || '').toString().substring(0, 10);
      const matchDateFrom = dateFrom === '' || regDateStr >= dateFrom;
      const matchDateTo = dateTo === '' || regDateStr <= dateTo;

      return matchPasta && matchQRU && matchSearch && matchDateFrom && matchDateTo;
    });

    // Agrupar por passaporte
    const grouped = new Map<string, GroupedPerson>();

    filtered.forEach((reg) => {
      const existing = grouped.get(reg.passaporte);
      const regDate = new Date(reg.data_cadastro || reg.data).getTime();

      if (!existing) {
        grouped.set(reg.passaporte, {
          passaporte: reg.passaporte,
          nome: reg.nome,
          latestPhoto: reg.imagem_url || '',
          totalRegistros: 1,
          lastQRU: reg.qru,
          lastPasta: reg.pasta,
          lastDate: reg.data_cadastro || reg.data,
          // Usar o mapa completo de pastas quando filtro ativo
          allPastas: showMultiplePastas
            ? (allPastasMap.get(reg.passaporte) || [reg.pasta])
            : [reg.pasta],
          _latestPhotoDate: reg.imagem_url ? regDate : 0,
        } as GroupedPerson & { _latestPhotoDate: number });
      } else {
        existing.totalRegistros++;
        // Coletar pastas únicas (dos resultados filtrados)
        if (!showMultiplePastas && !existing.allPastas.includes(reg.pasta)) {
          existing.allPastas.push(reg.pasta);
        }
        // Atualizar foto com a mais recente que tenha imagem
        const existingPhotoDate = (existing as GroupedPerson & { _latestPhotoDate: number })._latestPhotoDate || 0;
        if (reg.imagem_url && regDate > existingPhotoDate) {
          existing.latestPhoto = reg.imagem_url;
          (existing as GroupedPerson & { _latestPhotoDate: number })._latestPhotoDate = regDate;
        }
        // Atualizar com dados mais recentes
        const existingDate = new Date(existing.lastDate).getTime();
        if (regDate > existingDate) {
          existing.nome = reg.nome;
          existing.lastQRU = reg.qru;
          existing.lastPasta = reg.pasta;
          existing.lastDate = reg.data_cadastro || reg.data;
        }
      }
    });

    let results = Array.from(grouped.values());

    // Filtrar apenas passaportes em múltiplas pastas
    if (showMultiplePastas) {
      results = results.filter(p => p.allPastas.length >= 2);
    }

    return results.sort((a, b) => {
      // Ordenar por data mais recente
      return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime();
    });
  }, [registrations, allowedPastas, selectedPasta, selectedQRU, searchTerm, isSearching, showMultiplePastas, dateFrom, dateTo]);

  const clearFilters = () => {
    setSelectedPasta('all');
    setSelectedQRU('all');
    setSearchTerm('');
    setShowMultiplePastas(false);
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = selectedPasta !== 'all' || selectedQRU !== 'all' || searchTerm !== '' || showMultiplePastas || dateFrom !== '' || dateTo !== '';

  const handleViewDetails = (passaporte: string) => {
    navigate(`/passaporte/${passaporte}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header com título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pesquisa de Registros</h1>
          <p className="text-gray-400">
            Digite o nome ou passaporte para buscar registros no sistema
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1e293b] rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-[#00ff87]" />
              Buscar
            </h2>
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
            {/* Busca principal */}
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

            {/* Filtro de Pasta */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Filtrar por Pasta</label>
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
              <label className="text-sm text-gray-400 mb-2 block">Filtrar por QRU</label>
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

            {/* Filtro de Período */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
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
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1">
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

            {/* Filtro múltiplas pastas + Estatísticas */}
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
                  <p className="text-2xl font-bold text-[#00ff87]">
                    {groupedResults.length}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resultados */}
        {isLoadingRegistrations ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00ff87]" />
          </div>
        ) : !isSearching ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              Digite um nome ou passaporte para iniciar a busca
            </p>
            <p className="text-gray-500 text-sm">
              Ou use os filtros de pasta e QRU para refinar os resultados
            </p>
          </div>
        ) : groupedResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Nenhum registro encontrado com os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-lg border border-gray-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                  <TableHead className="w-16 text-gray-400">Foto</TableHead>
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">Passaporte</TableHead>
                  <TableHead className="text-gray-400">Registros</TableHead>
                  <TableHead className="text-gray-400">Último QRU</TableHead>
                  <TableHead className="text-gray-400">Última Pasta</TableHead>
                  <TableHead className="w-32 text-gray-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedResults.map((person) => (
                  <TableRow
                    key={person.passaporte}
                    className="border-gray-700 hover:bg-[#0f172a] cursor-pointer"
                    onClick={() => handleViewDetails(person.passaporte)}
                  >
                    <TableCell>
                      <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
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
                    <TableCell className="text-white font-medium">
                      {person.nome}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-gray-300 flex items-center gap-2">
                        <FileText className="h-3 w-3 text-[#00ff87]" />
                        {person.passaporte}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30">
                        {person.totalRegistros} {person.totalRegistros === 1 ? 'registro' : 'registros'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-[#00ff87]" />
                        {person.lastQRU}
                      </span>
                    </TableCell>
                    <TableCell>
                      {person.allPastas.length >= 2 ? (
                        <div className="flex flex-wrap gap-1">
                          {person.allPastas.map((pasta) => (
                            <Badge
                              key={pasta}
                              variant="outline"
                              className="border-amber-500/50 text-amber-400 bg-amber-500/10 text-xs"
                            >
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(person.passaporte);
                        }}
                        className="border-[#00ff87] text-[#00ff87] hover:bg-[#00ff87]/10"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver mais
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
