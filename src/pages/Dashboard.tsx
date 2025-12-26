/**
 * Página de Dashboard - Visualização de registros por Pasta
 */

import { useState } from 'react';
import { useRegistrations } from '@/hooks/queries/useRegistrations';
import { usePastas } from '@/hooks/queries/usePastas';
import { useQRUs } from '@/hooks/queries/useQRUs';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, User, FileText, MapPin, Calendar, X } from 'lucide-react';

export default function Dashboard() {
  const { data: registrations, isLoading: isLoadingRegistrations } = useRegistrations();
  const { data: pastas, isLoading: isLoadingPastas } = usePastas();
  const { data: qrus } = useQRUs();

  const [selectedPasta, setSelectedPasta] = useState<string>('all');
  const [selectedQRU, setSelectedQRU] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Debug: valores únicos de Pasta e QRU nos registros
  const uniquePastas = [...new Set(registrations?.map(r => r.pasta) || [])];
  const uniqueQRUs = [...new Set(registrations?.map(r => r.qru) || [])];

  console.log('Pastas nos registros:', uniquePastas);
  console.log('Pastas cadastradas:', pastas?.map(p => p.codigo));
  console.log('QRUs nos registros:', uniqueQRUs);
  console.log('QRUs cadastrados:', qrus?.map(q => q.codigo));

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
      reg.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.passaporte.toLowerCase().includes(searchTerm.toLowerCase());

    return matchPasta && matchQRU && matchSearch;
  }) || [];

  const clearFilters = () => {
    setSelectedPasta('all');
    setSelectedQRU('all');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedPasta !== 'all' || selectedQRU !== 'all' || searchTerm !== '';

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

          {/* Debug info - valores nos registros */}
          {uniquePastas.length > 0 && (
            <div className="mt-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <p className="text-sm text-yellow-300 font-semibold mb-2">
                ℹ️ Diagnóstico de Dados:
              </p>
              <div className="text-xs text-yellow-100 space-y-1">
                <p><strong>Pastas nos registros:</strong> {uniquePastas.join(', ')}</p>
                <p><strong>QRUs nos registros:</strong> {uniqueQRUs.join(', ')}</p>
              </div>
              <p className="text-xs text-yellow-200 mt-2">
                💡 Se os filtros não funcionarem, verifique se os códigos acima coincidem com os cadastrados em QRUs e Pastas.
              </p>
            </div>
          )}
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
                    <SelectItem key={pasta.id} value={pasta.codigo} className="text-white">
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
                    <SelectItem key={qru.id} value={qru.codigo} className="text-white">
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
                  <CardTitle className="text-white text-lg">
                    {registration.nome}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="h-3 w-3" />
                      <span className="font-mono">{registration.passaporte}</span>
                    </div>
                  </CardDescription>
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
    </div>
  );
}
