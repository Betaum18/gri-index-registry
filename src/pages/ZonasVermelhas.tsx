import { useRef, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api.service';
import {
  useCreateZonaVermelha,
  useUpdateZonaVermelha,
  useDeleteZonaVermelha,
} from '@/hooks/mutations/useZonasVermelhasMutations';
import type { ZonaVermelha } from '@/services/types';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Trash2, X, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Pencil } from 'lucide-react';
import gtaMap from '@/assets/gta-map.jpg';

// ── tipos internos ──────────────────────────────────────────────────────────
interface PendingPoint {
  x: number;
  y: number;
}

interface ModalState {
  mode: 'view' | 'edit' | 'create';
  zona: ZonaVermelha | null;
  pending: PendingPoint | null;
}

// ── constantes ──────────────────────────────────────────────────────────────
const ZOOM_STEP = 1.2;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;
const CACHE_KEY = ['zonas-vermelhas'];

// ── componente principal ────────────────────────────────────────────────────
const ZonasVermelhas = () => {
  const { user, isAdmin } = useAuth();
  const admin = isAdmin();

  // ── dados ──
  const { data: zonas = [], isLoading } = useQuery<ZonaVermelha[]>({
    queryKey: CACHE_KEY,
    queryFn: api.getZonasVermelhas,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useCreateZonaVermelha();
  const updateMutation = useUpdateZonaVermelha();
  const deleteMutation = useDeleteZonaVermelha();

  // ── mapa pan/zoom ──
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const [addMode, setAddMode] = useState(false);

  // ── modal ──
  const [modal, setModal] = useState<ModalState | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFoto, setFormFoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  // ── toast ──
  const showToast = useCallback((msg: string, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // ── reset view ao carregar imagem ──
  const resetView = useCallback(() => {
    const wrapper = wrapperRef.current;
    const img = imgRef.current;
    if (!wrapper || !img || !img.naturalWidth) return;
    const scaleX = wrapper.clientWidth / img.naturalWidth;
    const scaleY = wrapper.clientHeight / img.naturalHeight;
    const scale = Math.max(scaleX, scaleY);
    const x = (wrapper.clientWidth - img.naturalWidth * scale) / 2;
    const y = (wrapper.clientHeight - img.naturalHeight * scale) / 2;
    setTransform({ x, y, scale });
  }, []);

  // ── zoom ──
  const applyZoom = useCallback((factor: number, cx?: number, cy?: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const pivotX = cx !== undefined ? cx - rect.left : wrapper.clientWidth / 2;
    const pivotY = cy !== undefined ? cy - rect.top : wrapper.clientHeight / 2;

    setTransform(prev => {
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.scale * factor));
      const ratio = newScale / prev.scale;
      return {
        scale: newScale,
        x: pivotX - ratio * (pivotX - prev.x),
        y: pivotY - ratio * (pivotY - prev.y),
      };
    });
  }, []);

  // ── eventos do wrapper ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    applyZoom(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, e.clientX, e.clientY);
  }, [applyZoom]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTransform(prev => ({ ...prev, x: dragRef.current!.tx + dx, y: dragRef.current!.ty + dy }));
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = Math.abs(e.clientX - dragRef.current.startX);
    const dy = Math.abs(e.clientY - dragRef.current.startY);
    dragRef.current = null;

    // click (não drag) no modo de adição
    if (addMode && dx < 5 && dy < 5 && admin) {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const px = (e.clientX - rect.left - transform.x) / transform.scale;
      const py = (e.clientY - rect.top - transform.y) / transform.scale;
      setAddMode(false);
      openCreateModal(px, py);
    }
  }, [addMode, admin, transform]);

  // ── abrir modais ──
  const openCreateModal = (x: number, y: number) => {
    setFormNome('');
    setFormDesc('');
    setFormFoto('');
    setModal({ mode: 'create', zona: null, pending: { x, y } });
  };

  const openViewModal = (zona: ZonaVermelha) => {
    setModal({ mode: 'view', zona, pending: null });
  };

  const openEditModal = (zona: ZonaVermelha) => {
    setFormNome(zona.nome);
    setFormDesc(zona.descricao);
    setFormFoto(zona.foto_url);
    setModal({ mode: 'edit', zona, pending: null });
  };

  const closeModal = () => {
    setModal(null);
    setSaving(false);
  };

  // ── salvar ──
  const handleSave = async () => {
    if (!formNome.trim()) {
      showToast('Nome é obrigatório', true);
      return;
    }
    setSaving(true);
    try {
      if (modal?.mode === 'create' && modal.pending) {
        const res = await createMutation.mutateAsync({
          nome: formNome.trim(),
          descricao: formDesc.trim(),
          x: modal.pending.x,
          y: modal.pending.y,
          foto_url: formFoto.trim(),
          criado_por: user?.nome_completo || user?.usuario || '',
        });
        if (!res.success) throw new Error(res.error || 'Erro ao criar');
        showToast('Zona criada com sucesso!');
      } else if (modal?.mode === 'edit' && modal.zona) {
        const res = await updateMutation.mutateAsync({
          id: modal.zona.id,
          nome: formNome.trim(),
          descricao: formDesc.trim(),
          foto_url: formFoto.trim(),
        });
        if (!res.success) throw new Error(res.error || 'Erro ao salvar');
        showToast('Zona atualizada!');
      }
      closeModal();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', true);
    } finally {
      setSaving(false);
    }
  };

  // ── deletar ──
  const handleDelete = async (id: string) => {
    closeModal();
    try {
      const res = await deleteMutation.mutateAsync(id);
      if (!res.success) throw new Error(res.error || 'Erro ao deletar');
      showToast('Zona removida.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao deletar', true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header />

      {/* ── barra de controles ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-mono font-bold tracking-wider text-red-400 uppercase">
            Zonas Vermelhas
          </span>
        </div>

        <Badge variant="outline" className="font-mono text-xs border-red-500/40 text-red-400">
          {isLoading ? '...' : `${zonas.length} zona${zonas.length !== 1 ? 's' : ''}`}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          {admin && (
            <Button
              size="sm"
              variant={addMode ? 'destructive' : 'outline'}
              className={`font-mono text-xs tracking-wider ${addMode ? '' : 'border-red-500/40 text-red-400 hover:bg-red-950/30 hover:text-red-300'}`}
              onClick={() => setAddMode(v => !v)}
            >
              {addMode ? (
                <><X className="h-3 w-3 mr-1" /> Cancelar</>
              ) : (
                <><Plus className="h-3 w-3 mr-1" /> Adicionar zona</>
              )}
            </Button>
          )}
          <Button size="sm" variant="outline" className="border-border" onClick={() => applyZoom(ZOOM_STEP)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="border-border" onClick={() => applyZoom(1 / ZOOM_STEP)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="border-border" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {addMode && (
        <div className="bg-red-950/30 border-b border-red-500/30 px-4 py-1.5 text-xs font-mono text-red-300 tracking-wider flex items-center gap-2 flex-shrink-0">
          <MapPin className="h-3 w-3" />
          MODO ADIÇÃO ATIVO — clique no mapa para inserir uma nova zona vermelha
        </div>
      )}

      {/* ── área do mapa ── */}
      <div
        ref={wrapperRef}
        className={`flex-1 overflow-hidden relative select-none ${addMode ? 'cursor-crosshair' : dragRef.current ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { dragRef.current = null; }}
      >
        {/* container transformável */}
        <div
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          <img
            ref={imgRef}
            src={gtaMap}
            alt="Mapa GTA V"
            draggable={false}
            style={{ display: 'block', pointerEvents: 'none' }}
            onLoad={resetView}
          />

          {/* marcadores */}
          {zonas.map(zona => (
            <ZonaMarker
              key={zona.id}
              zona={zona}
              scale={transform.scale}
              onClick={() => openViewModal(zona)}
            />
          ))}
        </div>

        {/* loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <div className="font-mono text-sm text-red-400 animate-pulse tracking-widest">
              CARREGANDO INTEL...
            </div>
          </div>
        )}
      </div>

      {/* ── modal view ── */}
      {modal?.mode === 'view' && modal.zona && (
        <MapModal onClose={closeModal}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-mono font-bold tracking-widest text-red-400 uppercase">
                {modal.zona.nome}
              </h2>
              <span className="text-xs font-mono text-muted-foreground">
                X:{Math.round(modal.zona.x)} Y:{Math.round(modal.zona.y)}
              </span>
            </div>
            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {modal.zona.foto_url && (
            <img
              src={modal.zona.foto_url}
              alt={modal.zona.nome}
              className="w-full rounded border border-border/50 mb-4 max-h-52 object-cover"
            />
          )}

          {modal.zona.descricao && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {modal.zona.descricao}
            </p>
          )}

          <div className="text-xs font-mono text-muted-foreground mb-4">
            {modal.zona.criado_por && <span>Registrado por <span className="text-foreground">{modal.zona.criado_por}</span></span>}
          </div>

          {admin && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-border font-mono text-xs"
                onClick={() => { closeModal(); openEditModal(modal.zona!); }}
              >
                <Pencil className="h-3 w-3 mr-1" /> Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-500/40 text-red-400 hover:bg-red-950/30 font-mono text-xs"
                onClick={() => handleDelete(modal.zona!.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Remover
              </Button>
            </div>
          )}
        </MapModal>
      )}

      {/* ── modal criar/editar ── */}
      {(modal?.mode === 'create' || modal?.mode === 'edit') && (
        <MapModal onClose={closeModal}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-mono font-bold tracking-widest text-red-400 uppercase">
              {modal.mode === 'create' ? 'Nova Zona Vermelha' : 'Editar Zona'}
            </h2>
            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {modal.pending && (
            <p className="text-xs font-mono text-muted-foreground mb-4">
              Coordenadas: X:{Math.round(modal.pending.x)} Y:{Math.round(modal.pending.y)}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
                Nome *
              </Label>
              <Input
                value={formNome}
                onChange={e => setFormNome(e.target.value)}
                placeholder="Ex: Bairro Madrazo"
                className="mt-1 font-mono text-sm bg-secondary/30 border-border"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
                Descrição
              </Label>
              <Textarea
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Informações sobre a zona..."
                className="mt-1 font-mono text-sm bg-secondary/30 border-border resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
                URL da foto
              </Label>
              <Input
                value={formFoto}
                onChange={e => setFormFoto(e.target.value)}
                placeholder="https://..."
                className="mt-1 font-mono text-sm bg-secondary/30 border-border"
              />
              {formFoto && (
                <img
                  src={formFoto}
                  alt="preview"
                  className="mt-2 w-full max-h-32 object-cover rounded border border-border/50"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              size="sm"
              className="flex-1 bg-red-700 hover:bg-red-600 text-white font-mono text-xs tracking-wider"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            {modal.mode === 'edit' && modal.zona && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-950/30 font-mono text-xs"
                onClick={() => handleDelete(modal.zona!.id)}
                disabled={saving}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-border font-mono text-xs"
              onClick={closeModal}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </MapModal>
      )}

      {/* ── toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded font-mono text-sm border tracking-wide shadow-lg transition-all
            ${toast.err
              ? 'bg-card border-red-500/60 text-red-400'
              : 'bg-card border-border text-foreground'
            }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

// ── marcador no mapa ────────────────────────────────────────────────────────
interface ZonaMarkerProps {
  zona: ZonaVermelha;
  scale: number;
  onClick: () => void;
}

const ZonaMarker = ({ zona, scale, onClick }: ZonaMarkerProps) => {
  const size = Math.max(10, 14 / scale);

  return (
    <div
      title={zona.nome}
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        position: 'absolute',
        left: zona.x,
        top: zona.y,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        pointerEvents: 'all',
        zIndex: 10,
      }}
    >
      {/* anel de pulso */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          width: size,
          height: size,
          background: 'rgba(239,68,68,0.45)',
          animation: 'zona-pulse 1.8s ease-out infinite',
          transform: 'translate(-50%, -50%) translate(50%, 50%)',
        }}
      />
      {/* ponto central */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#ef4444',
          border: `${Math.max(1.5, 2 / scale)}px solid rgba(255,255,255,0.75)`,
          position: 'relative',
          zIndex: 2,
          transition: 'transform 0.15s',
        }}
        className="hover:scale-150"
      />
      {/* tooltip com nome */}
      {zona.nome && (
        <div
          style={{
            position: 'absolute',
            bottom: `calc(100% + ${6 / scale}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15,19,24,0.92)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
            fontFamily: 'monospace',
            fontSize: Math.max(9, 11 / scale),
            letterSpacing: '1px',
            padding: `${3 / scale}px ${8 / scale}px`,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: 0,
          }}
          className="group-hover:opacity-100 zona-tooltip"
        />
      )}

      <style>{`
        @keyframes zona-pulse {
          0%   { transform: translate(-50%,-50%) translate(50%,50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) translate(50%,50%) scale(3.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ── wrapper do modal ────────────────────────────────────────────────────────
const MapModal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="bg-card border border-border w-full max-w-md mx-4 rounded-sm p-6 shadow-2xl">
      {children}
    </div>
  </div>
);

export default ZonasVermelhas;
