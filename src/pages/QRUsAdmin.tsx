/**
 * Página de administração de QRUs
 */

import { useState } from 'react';
import { useQRUs } from '@/hooks/queries/useQRUs';
import { useCreateQRU, useDeleteQRU, useToggleQRU } from '@/hooks/mutations/useQRUMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Power } from 'lucide-react';
import Header from '@/components/Header';

export default function QRUsAdmin() {
  const { toast } = useToast();
  const { data: qrus, isLoading } = useQRUs();
  const { mutate: createQRU, isPending: isCreating } = useCreateQRU();
  const { mutate: deleteQRU, isPending: isDeleting } = useDeleteQRU();
  const { mutate: toggleQRU, isPending: isToggling } = useToggleQRU();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ nome: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o nome',
        variant: 'destructive',
      });
      return;
    }

    createQRU({ codigo: formData.nome, nome: formData.nome }, {
      onSuccess: () => {
        toast({ title: 'QRU criado com sucesso!' });
        setFormData({ nome: '' });
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao criar QRU',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDelete = (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o QRU "${nome}"?`)) {
      return;
    }

    deleteQRU(id, {
      onSuccess: () => {
        toast({ title: 'QRU deletado com sucesso!' });
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao deletar QRU',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  const handleToggle = (id: string) => {
    toggleQRU(id, {
      onSuccess: (response) => {
        toast({
          title: response.ativo ? 'QRU ativado' : 'QRU desativado',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao alterar status',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Administração de QRUs</h1>
            <p className="text-gray-400 mt-1">
              Gerencie os Quadrantes de Responsabilidade Urbana
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00ff87] text-black hover:bg-[#00cc6e]">
                <Plus className="mr-2 h-4 w-4" />
                Novo QRU
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e293b] text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Criar Novo QRU</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Adicione um novo Quadrante de Responsabilidade Urbana
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Centro"
                    className="bg-[#0f172a] border-gray-600 text-white"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-[#00ff87] text-black hover:bg-[#00cc6e]"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar QRU'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-[#1e293b] rounded-lg shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00ff87]" />
            </div>
          ) : !qrus || qrus.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum QRU cadastrado ainda.</p>
              <p className="text-sm mt-2">Clique em "Novo QRU" para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrus.map((qru) => (
                  <TableRow
                    key={qru.id}
                    className="border-gray-700 hover:bg-[#0f172a]"
                  >
                    <TableCell className="font-medium text-white">{qru.nome}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          qru.ativo
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}
                      >
                        {qru.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(qru.id)}
                          disabled={isToggling}
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(qru.id, qru.nome)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
