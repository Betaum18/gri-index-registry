/**
 * Página de Detalhes do Passaporte
 * Mostra todos os registros de um passaporte específico
 */

import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRegistrations } from '@/hooks/queries/useRegistrations';
import { useVehicles } from '@/hooks/queries/useVehicles';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowLeft, User, FileText, MapPin, Calendar, FolderOpen, Download, Car } from 'lucide-react';

export default function PassportDetails() {
  const { passaporte } = useParams<{ passaporte: string }>();
  const navigate = useNavigate();
  const { data: registrations, isLoading } = useRegistrations();
  const { data: vehicles } = useVehicles();
  const { getAllowedPastas } = useAuth();

  // Filtrar registros pelo passaporte
  const passportRegistrations = useMemo(() => {
    if (!registrations || !passaporte) return [];

    return registrations
      .filter((reg) => String(reg.passaporte).trim() === String(passaporte).trim())
      .sort((a, b) => {
        // Ordenar por data de cadastro (mais recente primeiro)
        const dateA = new Date(a.data_cadastro || (a.data + 'T12:00:00')).getTime();
        const dateB = new Date(b.data_cadastro || (b.data + 'T12:00:00')).getTime();
        return dateB - dateA;
      });
  }, [registrations, passaporte]);

  // Pegar a foto mais recente (primeiro item após ordenação)
  const latestPhoto = passportRegistrations.find((reg) => reg.imagem_url)?.imagem_url;

  // Pegar o nome do primeiro registro
  const personName = passportRegistrations[0]?.nome || 'Desconhecido';

  // Veículos vinculados a este passaporte
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
                    {passportRegistrations[passportRegistrations.length - 1]?.data
                      ? new Date(passportRegistrations[passportRegistrations.length - 1].data + 'T12:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </p>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Último Registro</p>
                  <p className="text-lg font-bold text-white">
                    {passportRegistrations[0]?.data
                      ? new Date(passportRegistrations[0].data + 'T12:00:00').toLocaleDateString('pt-BR')
                      : '—'}
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
                      {new Date(registration.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-400 text-sm">
                      {registration.data_cadastro
                        ? new Date(registration.data_cadastro).toLocaleString('pt-BR')
                        : '-'}
                    </span>
                  </TableCell>
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
    </div>
  );
}
