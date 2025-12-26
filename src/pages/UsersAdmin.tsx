/**
 * Página de administração de Usuários
 */

import { useState } from 'react';
import { useUsers } from '@/hooks/queries/useUsers';
import { useCreateUser } from '@/hooks/mutations/useCreateUser';
import { useDeleteUser } from '@/hooks/mutations/useDeleteUser';
import { useToggleUser } from '@/hooks/mutations/useToggleUser';
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
import { Loader2, Plus, Trash2, Power, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';

export default function UsersAdmin() {
  const { toast } = useToast();
  const { data: users, isLoading } = useUsers();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { mutate: toggleUser, isPending: isToggling } = useToggleUser();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    usuario: '',
    senha: '',
    nome_completo: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuario.trim() || !formData.senha.trim() || !formData.nome_completo.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    if (formData.senha.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    createUser(formData, {
      onSuccess: () => {
        toast({ title: 'Usuário criado com sucesso!' });
        setFormData({ usuario: '', senha: '', nome_completo: '' });
        setIsDialogOpen(false);
        setShowPassword(false);
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao criar usuário',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDelete = (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário "${nome}"?`)) {
      return;
    }

    deleteUser(id, {
      onSuccess: () => {
        toast({ title: 'Usuário deletado com sucesso!' });
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao deletar usuário',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  const handleToggle = (id: string) => {
    toggleUser(id, {
      onSuccess: (response) => {
        toast({
          title: response.ativo ? 'Usuário ativado' : 'Usuário desativado',
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
            <h1 className="text-3xl font-bold text-white">Administração de Usuários</h1>
            <p className="text-gray-400 mt-1">
              Gerencie os usuários do sistema
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00ff87] text-black hover:bg-[#00cc6e]">
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e293b] text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Adicione um novo usuário ao sistema
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="usuario">Usuário (Login)</Label>
                  <Input
                    id="usuario"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    placeholder="Ex: joao.silva"
                    className="bg-[#0f172a] border-gray-600 text-white"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-[#0f172a] border-gray-600 text-white pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome_completo">Nome Completo</Label>
                  <Input
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="bg-[#0f172a] border-gray-600 text-white"
                    autoComplete="off"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setShowPassword(false);
                    }}
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
                      'Criar Usuário'
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
          ) : !users || users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum usuário cadastrado ainda.</p>
              <p className="text-sm mt-2">Clique em "Novo Usuário" para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-[#0f172a]">
                  <TableHead className="text-gray-300">Usuário</TableHead>
                  <TableHead className="text-gray-300">Nome Completo</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-gray-700 hover:bg-[#0f172a]"
                  >
                    <TableCell className="font-medium text-white">
                      {user.usuario}
                    </TableCell>
                    <TableCell className="text-gray-300">{user.nome_completo}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.ativo
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}
                      >
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(user.id)}
                          disabled={isToggling}
                          className="border-gray-600 text-white hover:bg-gray-700"
                          title={user.ativo ? 'Desativar' : 'Ativar'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id, user.usuario)}
                          disabled={isDeleting}
                          title="Deletar"
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
