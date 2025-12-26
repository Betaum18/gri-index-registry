/**
 * Página de administração de Pastas
 */

import { useState } from 'react';
import { usePastas } from '@/hooks/queries/usePastas';
import { useCreatePasta, useDeletePasta, useTogglePasta } from '@/hooks/mutations/usePastaMutations';
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
import { Header } from '@/components/Header';

export default function PastasAdmin() {
  const { toast } = useToast();
  const { data: pastas, isLoading } = usePastas();
  const { mutate: createPasta, isPending: isCreating } = useCreatePasta();
  const { mutate: deletePasta, isPending: isDeleting } = useDeletePasta();
  const { mutate: togglePasta, isPending: isToggling } = useTogglePasta();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ codigo: '', nome: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo.trim() || !formData.nome.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha código e nome',
        variant: 'destructive',
      });
      return;
    }

    createPasta(formData, {
      onSuccess: () => {
        toast({ title: 'Pasta criada com sucesso!' });
        setFormData({ codigo: '', nome: '' });
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao criar Pasta',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDelete = (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar a Pasta "${nome}"?`)) {
      return;
    }

    deletePasta(id, {
      onSuccess: () => {
        toast({ title: 'Pasta deletada com sucesso!' });
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao deletar Pasta',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  const handleToggle = (id: string) => {
    togglePasta(id, {
      onSuccess: (response) => {
        toast({
          title: response.ativo ? 'Pasta ativada' : 'Pasta desativada',
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
            <h1 className="text-3xl font-bold text-white">Administração de Pastas</h1>
            <p className="text-gray-400 mt-1">
              Gerencie as Pastas do sistema
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00ff87] text-black hover:bg-[#00cc6e]">
                <Plus className="mr-2 h-4 w-4" />
                Nova Pasta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e293b] text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Criar Nova Pasta</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Adicione uma nova Pasta ao sistema
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: P01"
                    className="bg-[#0f172a] border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Homicídios"
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
                      'Criar Pasta'
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
          ) : !pastas || pastas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhuma Pasta cadastrada ainda.</p>
              <p className="text-sm mt-2">Clique em "Nova Pasta" para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                  <TableHead className="text-gray-300">Código</TableHead>
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastas.map((pasta) => (
                  <TableRow
                    key={pasta.id}
                    className="border-gray-700 hover:bg-[#0f172a]"
                  >
                    <TableCell className="font-medium text-white">
                      {pasta.codigo}
                    </TableCell>
                    <TableCell className="text-gray-300">{pasta.nome}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pasta.ativo
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}
                      >
                        {pasta.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(pasta.id)}
                          disabled={isToggling}
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(pasta.id, pasta.nome)}
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
