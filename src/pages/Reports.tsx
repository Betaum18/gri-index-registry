/**
 * Página de Relatórios - Gera PDF com registros filtrados
 * Filtros combinados: período + pasta + QRU + seleção de passaportes
 */

import { useState, useMemo } from 'react';
import { useRegistrations } from '@/hooks/queries/useRegistrations';
import { usePastas } from '@/hooks/queries/usePastas';
import { useQRUs } from '@/hooks/queries/useQRUs';
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
  Loader2,
  FileDown,
  Search,
  User,
  FileText,
  Calendar,
  MapPin,
  FolderOpen,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

/** Helper para converter qualquer valor para string segura */
const str = (val: unknown): string => (val ?? '').toString().trim();

interface GroupedPassport {
  passaporte: string;
  nome: string;
  latestPhoto: string;
  totalRegistros: number;
  latestDate: number;
  latestPhotoDate: number;
}

interface ReportPerson {
  passaporte: string;
  nome: string;
  photo: string;
}

async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function Reports() {
  const { data: registrations, isLoading: isLoadingRegistrations } = useRegistrations();
  const { data: pastas, isLoading: isLoadingPastas } = usePastas();
  const { data: qrus } = useQRUs();
  const { getAllowedPastas } = useAuth();

  const allowedPastas = useMemo(() => {
    if (!pastas) return [];
    return getAllowedPastas(pastas).filter(p => p.ativo);
  }, [pastas, getAllowedPastas]);

  // Filtros combinados
  const [selectedPasta, setSelectedPasta] = useState<string>('');
  const [selectedQRU, setSelectedQRU] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [passportSearch, setPassportSearch] = useState('');
  const [selectedPassports, setSelectedPassports] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  // Passaportes agrupados com todos os filtros ativos (pasta, QRU, período)
  const allGroupedPassports = useMemo(() => {
    if (!registrations) return [];

    const allowedPastaNames = allowedPastas.map(p => p.nome.toLowerCase());
    const grouped = new Map<string, GroupedPassport>();

    registrations.forEach((reg) => {
      const regPasta = str(reg.pasta).toLowerCase();
      if (!allowedPastaNames.includes(regPasta)) return;

      // Filtro por pasta
      if (selectedPasta && regPasta !== selectedPasta.toLowerCase()) return;

      // Filtro por QRU
      if (selectedQRU && str(reg.qru).toLowerCase() !== selectedQRU.toLowerCase()) return;

      // Filtro por período
      const regDateStr = str(reg.data).substring(0, 10);
      if (dateFrom && regDateStr < dateFrom) return;
      if (dateTo && regDateStr > dateTo) return;

      const passaporte = str(reg.passaporte);
      const nome = str(reg.nome);
      const regDate = new Date(reg.data_cadastro || reg.data).getTime() || 0;
      const existing = grouped.get(passaporte);

      if (!existing) {
        grouped.set(passaporte, {
          passaporte,
          nome,
          latestPhoto: str(reg.imagem_url),
          totalRegistros: 1,
          latestDate: regDate,
          latestPhotoDate: reg.imagem_url ? regDate : 0,
        });
      } else {
        existing.totalRegistros++;
        if (reg.imagem_url && regDate > existing.latestPhotoDate) {
          existing.latestPhoto = str(reg.imagem_url);
          existing.latestPhotoDate = regDate;
        }
        if (regDate > existing.latestDate) {
          existing.nome = nome;
          existing.latestDate = regDate;
        }
      }
    });

    return Array.from(grouped.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [registrations, allowedPastas, selectedPasta, selectedQRU, dateFrom, dateTo]);

  // Passaportes filtrados pela busca de texto
  const filteredPassports = useMemo(() => {
    if (!passportSearch.trim()) return allGroupedPassports;
    const search = passportSearch.toLowerCase();
    return allGroupedPassports.filter(
      p => p.nome.toLowerCase().includes(search) || p.passaporte.toLowerCase().includes(search)
    );
  }, [allGroupedPassports, passportSearch]);

  // Registros do relatório: passaportes selecionados dentro dos filtros ativos
  const reportGrouped = useMemo((): ReportPerson[] => {
    return allGroupedPassports
      .filter(p => selectedPassports.has(p.passaporte))
      .map(p => ({ passaporte: p.passaporte, nome: p.nome, photo: p.latestPhoto }));
  }, [allGroupedPassports, selectedPassports]);

  const togglePassport = (passaporte: string) => {
    setSelectedPassports(prev => {
      const next = new Set(prev);
      if (next.has(passaporte)) next.delete(passaporte);
      else next.add(passaporte);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedPassports(prev => {
      const next = new Set(prev);
      filteredPassports.forEach(p => next.add(p.passaporte));
      return next;
    });
  };

  const clearSelectedPassports = () => setSelectedPassports(new Set());

  const getReportTitle = () => {
    const parts: string[] = [];
    if (selectedPasta) parts.push(`Pasta: ${selectedPasta}`);
    if (selectedQRU) parts.push(`QRU: ${selectedQRU}`);
    parts.push(`${reportGrouped.length} pessoa(s)`);
    return parts.join(' | ');
  };

  const getReportPeriod = () => {
    if (dateFrom && dateTo) return `Período: ${new Date(dateFrom + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(dateTo + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    if (dateFrom) return `A partir de: ${new Date(dateFrom + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    if (dateTo) return `Até: ${new Date(dateTo + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    return 'Todo o período';
  };

  const generatePDF = async () => {
    if (reportGrouped.length === 0) return;
    setIsGenerating(true);

    try {
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // Header
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 35, 'F');

      pdf.setTextColor(0, 255, 135);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO GRI', pageWidth / 2, 15, { align: 'center' });

      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(getReportTitle(), pageWidth / 2, 23, { align: 'center' });
      pdf.text(getReportPeriod(), pageWidth / 2, 29, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, 33, { align: 'right' });

      let yPos = 45;

      const drawTableHeader = () => {
        pdf.setFillColor(30, 41, 59);
        pdf.rect(margin, yPos, contentWidth, 10, 'F');
        pdf.setTextColor(200, 200, 200);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Foto', margin + 15, yPos + 7, { align: 'center' });
        pdf.text('Nome', margin + 40, yPos + 7);
        pdf.text('Passaporte', pageWidth - margin - 30, yPos + 7);
        yPos += 12;
      };

      drawTableHeader();

      // Carregar fotos em paralelo com timeout
      const photos: (string | null)[] = [];
      const photoUrls = reportGrouped.map(p => p.photo);
      const batchSize = 5;
      for (let i = 0; i < photoUrls.length; i += batchSize) {
        const batch = photoUrls.slice(i, i + batchSize).map(url =>
          url ? imageUrlToBase64(url) : Promise.resolve(null)
        );
        const results = await Promise.all(batch);
        photos.push(...results);
      }

      // Renderizar cada pessoa
      for (let i = 0; i < reportGrouped.length; i++) {
        const person = reportGrouped[i];
        const photo = photos[i];
        const rowHeight = 25;

        if (yPos + rowHeight > pageHeight - 20) {
          pdf.setFontSize(7);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`Página ${pdf.getNumberOfPages()}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
          pdf.addPage();
          yPos = 15;
          drawTableHeader();
        }

        // Fundo alternado - todas as linhas tem fundo
        if (i % 2 === 0) {
          pdf.setFillColor(15, 23, 42); // azul escuro
        } else {
          pdf.setFillColor(30, 41, 59); // azul médio
        }
        pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');

        // Foto
        let photoDrawn = false;
        if (photo) {
          try {
            pdf.addImage(photo, 'JPEG', margin + 5, yPos + 2, 20, 20);
            photoDrawn = true;
          } catch {
            // Falha ao adicionar imagem
          }
        }
        if (!photoDrawn) {
          pdf.setFillColor(50, 50, 70);
          pdf.roundedRect(margin + 5, yPos + 2, 20, 20, 2, 2, 'F');
          pdf.setTextColor(100, 100, 120);
          pdf.setFontSize(7);
          pdf.text('Sem foto', margin + 15, yPos + 13, { align: 'center' });
        }

        // Nome
        pdf.setTextColor(230, 230, 230);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const nomeText = person.nome.length > 35 ? person.nome.substring(0, 35) + '...' : person.nome;
        pdf.text(nomeText, margin + 40, yPos + 14);

        // Passaporte
        pdf.setTextColor(0, 200, 100);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(person.passaporte), pageWidth - margin - 5, yPos + 14, { align: 'right' });

        yPos += rowHeight + 2;
      }

      // Footer última página
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Página ${pdf.getNumberOfPages()} | Total: ${reportGrouped.length} pessoa(s)`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );

      const dateStr = new Date().toISOString().substring(0, 10);
      pdf.save(`relatorio-gri-${dateStr}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Relatórios</h1>
          <p className="text-gray-400">
            Selecione os filtros e gere um relatório em PDF
          </p>
        </div>

        {/* Configuração do Relatório */}
        <div className="bg-[#1e293b] rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileDown className="h-5 w-5 text-[#00ff87]" />
            Configuração
          </h2>

          {/* Filtros combinados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Pasta */}
            <div>
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                Pasta
              </label>
              <Select
                value={selectedPasta || '__all__'}
                onValueChange={(v) => { setSelectedPasta(v === '__all__' ? '' : v); setSelectedPassports(new Set()); }}
                disabled={isLoadingPastas}
              >
                <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-gray-700">
                  <SelectItem value="__all__" className="text-gray-400">Todas</SelectItem>
                  {allowedPastas.map((pasta) => (
                    <SelectItem key={pasta.id} value={pasta.nome} className="text-white">
                      {pasta.codigo} - {pasta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* QRU */}
            <div>
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                QRU
              </label>
              <Select
                value={selectedQRU || '__all__'}
                onValueChange={(v) => { setSelectedQRU(v === '__all__' ? '' : v); setSelectedPassports(new Set()); }}
              >
                <SelectTrigger className="bg-[#0f172a] border-gray-600 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-gray-700">
                  <SelectItem value="__all__" className="text-gray-400">Todos</SelectItem>
                  {qrus?.filter(q => q.ativo).map((qru) => (
                    <SelectItem key={qru.id} value={qru.nome} className="text-white">
                      {qru.codigo} - {qru.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período: De */}
            <div>
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                De
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setSelectedPassports(new Set()); }}
                className="bg-[#0f172a] border-gray-600 text-white"
              />
            </div>

            {/* Período: Até */}
            <div>
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Até
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setSelectedPassports(new Set()); }}
                className="bg-[#0f172a] border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Seleção de passaportes */}
          <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-400">
                  Selecionar passaportes ({selectedPassports.size} selecionado{selectedPassports.size !== 1 ? 's' : ''})
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllFiltered}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                  >
                    Selecionar todos
                  </Button>
                  {selectedPassports.size > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearSelectedPassports}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              {/* Busca de passaportes */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou passaporte..."
                  value={passportSearch}
                  onChange={(e) => setPassportSearch(e.target.value)}
                  className="bg-[#0f172a] border-gray-600 text-white pl-10"
                />
              </div>

              {/* Lista de passaportes */}
              <div className="max-h-64 overflow-y-auto bg-[#0f172a] rounded-lg border border-gray-700">
                {isLoadingRegistrations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00ff87]" />
                  </div>
                ) : filteredPassports.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Nenhum passaporte encontrado</p>
                ) : (
                  filteredPassports.map((person) => (
                    <label
                      key={person.passaporte}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e293b] cursor-pointer border-b border-gray-800 last:border-b-0"
                    >
                      <Checkbox
                        checked={selectedPassports.has(person.passaporte)}
                        onCheckedChange={() => togglePassport(person.passaporte)}
                      />
                      <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {person.latestPhoto ? (
                          <img src={person.latestPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{person.nome}</p>
                        <p className="text-gray-500 text-xs font-mono">{person.passaporte}</p>
                      </div>
                      <span className="text-xs text-gray-500">{person.totalRegistros} reg.</span>
                    </label>
                  ))
                )}
              </div>
            </div>
        </div>

        {/* Preview e Gerar PDF */}
        {reportGrouped.length > 0 && (
          <div className="bg-[#1e293b] rounded-lg border border-gray-700 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Preview do Relatório
                </h2>
                <p className="text-sm text-gray-400">
                  {reportGrouped.length} pessoa(s) | {getReportPeriod()}
                </p>
              </div>
              <Button
                onClick={generatePDF}
                disabled={isGenerating}
                className="bg-[#00ff87] text-[#0f172a] hover:bg-[#00ff87]/90 font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                  <TableHead className="w-16 text-gray-400">Foto</TableHead>
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">Passaporte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportGrouped.map((person) => (
                  <TableRow key={person.passaporte} className="border-gray-700 hover:bg-[#0f172a]">
                    <TableCell>
                      <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
                        {person.photo ? (
                          <img src={person.photo} alt={person.nome} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">{person.nome}</TableCell>
                    <TableCell>
                      <span className="font-mono text-gray-300 flex items-center gap-2">
                        <FileText className="h-3 w-3 text-[#00ff87]" />
                        {person.passaporte}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Mensagem quando não há resultados */}
        {!isLoadingRegistrations && reportGrouped.length === 0 && (
          <div className="text-center py-12">
            <FileDown className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              {selectedPassports.size === 0
                ? 'Selecione os passaportes para o relatório'
                : 'Nenhum registro encontrado com os filtros aplicados'
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
