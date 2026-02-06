/**
 * Página de administração de Usuários
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/hooks/queries/useUsers';
import { usePastas } from '@/hooks/queries/usePastas';
import { useCreateUser } from '@/hooks/mutations/useCreateUser';
import { useUpdateUser } from '@/hooks/mutations/useUpdateUser';
import { useDeleteUser } from '@/hooks/mutations/useDeleteUser';
import { useToggleUser } from '@/hooks/mutations/useToggleUser';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Loader2, Plus, Trash2, Power, Eye, EyeOff, Pencil, Shield, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import type { UserAdmin } from '@/services/types';

interface UserFormData {
  usuario: string;
  senha: string;
  nome_completo: string;
  is_admin: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
  pode_gerenciar_usuarios: boolean;
  pastas_acesso: string[];
}

const defaultFormData: UserFormData = {
  usuario: '',
  senha: '',
  nome_completo: '',
  is_admin: false,
  pode_criar: false,
  pode_editar: false,
  pode_deletar: false,
  pode_gerenciar_usuarios: false,
  pastas_acesso: [],
};

export default function UsersAdmin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: users, isLoading } = useUsers();
  const { data: pastas } = usePastas();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { mutate: toggleUser, isPending: isToggling } = useToggleUser();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [editFormData, setEditFormData] = useState<UserFormData>(defaultFormData);

  // Verificar permissão de acesso
  useEffect(() => {
    if (!hasPermission('pode_gerenciar_usuarios')) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [hasPermission, navigate, toast]);

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
        setFormData(defaultFormData);
        setIsDialogOpen(false);
        setShowPassword(false);
      },
      onError: (error: Error) => {
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
      onError: (error: Error) => {
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
      onError: (error: Error) => {
        toast({
          title: 'Erro ao alterar status',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  const handleEdit = (user: UserAdmin) => {
    setEditingUser(user);
    setEditFormData({
      usuario: user.usuario,
      senha: '',
      nome_completo: user.nome_completo,
      is_admin: user.is_admin || false,
      pode_criar: user.pode_criar || false,
      pode_editar: user.pode_editar || false,
      pode_deletar: user.pode_deletar || false,
      pode_gerenciar_usuarios: user.pode_gerenciar_usuarios || false,
      pastas_acesso: user.pastas_acesso || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    if (!editFormData.usuario.trim() || !editFormData.nome_completo.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha usuário e nome completo',
        variant: 'destructive',
      });
      return;
    }

    if (editFormData.senha && editFormData.senha.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    const updateData = {
      id: editingUser.id,
      usuario: editFormData.usuario,
      nome_completo: editFormData.nome_completo,
      senha: editFormData.senha || undefined,
      is_admin: editFormData.is_admin,
      pode_criar: editFormData.pode_criar,
      pode_editar: editFormData.pode_editar,
      pode_deletar: editFormData.pode_deletar,
      pode_gerenciar_usuarios: editFormData.pode_gerenciar_usuarios,
      pastas_acesso: editFormData.pastas_acesso,
    };

    updateUser(updateData, {
      onSuccess: () => {
        toast({ title: 'Usuário atualizado com sucesso!' });
        setEditFormData(defaultFormData);
        setIsEditDialogOpen(false);
        setShowEditPassword(false);
        setEditingUser(null);
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro ao atualizar usuário',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
      },
    });
  };

  const togglePastaAccess = (pastaId: string, formType: 'create' | 'edit') => {
    if (formType === 'create') {
      setFormData(prev => ({
        ...prev,
        pastas_acesso: prev.pastas_acesso.includes(pastaId)
          ? prev.pastas_acesso.filter(id => id !== pastaId)
          : [...prev.pastas_acesso, pastaId]
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        pastas_acesso: prev.pastas_acesso.includes(pastaId)
          ? prev.pastas_acesso.filter(id => id !== pastaId)
          : [...prev.pastas_acesso, pastaId]
      }));
    }
  };

  const PermissionsSection = ({ data, onChange, formType }: {
    data: UserFormData;
    onChange: (data: UserFormData) => void;
    formType: 'create' | 'edit';
  }) => (
    <div className="space-y-4 border-t border-gray-700 pt-4 mt-4">
      <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Permissões
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            checked={data.is_admin}
            onCheckedChange={(checked) => onChange({ ...data, is_admin: checked === true })}
            className="border-gray-500 data-[state=checked]:bg-[#00ff87] data-[state=checked]:border-[#00ff87]"
          />
          <span className="text-sm text-gray-300">Administrador</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            checked={data.pode_criar}
            onCheckedChange={(checked) => onChange({ ...data, pode_criar: checked === true })}
            disabled={data.is_admin}
            className="border-gray-500 data-[state=checked]:bg-[#00ff87] data-[state=checked]:border-[#00ff87]"
          />
          <span className={`text-sm ${data.is_admin ? 'text-gray-500' : 'text-gray-300'}`}>Pode criar</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            checked={data.pode_editar}
            onCheckedChange={(checked) => onChange({ ...data, pode_editar: checked === true })}
            disabled={data.is_admin}
            className="border-gray-500 data-[state=checked]:bg-[#00ff87] data-[state=checked]:border-[#00ff87]"
          />
          <span className={`text-sm ${data.is_admin ? 'text-gray-500' : 'text-gray-300'}`}>Pode editar</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            checked={data.pode_deletar}
            onCheckedChange={(checked) => onChange({ ...data, pode_deletar: checked === true })}
            disabled={data.is_admin}
            className="border-gray-500 data-[state=checked]:bg-[#00ff87] data-[state=checked]:border-[#00ff87]"
          />
          <span className={`text-sm ${data.is_admin ? 'text-gray-500' : 'text-gray-300'}`}>Pode deletar</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer col-span-2">
          <Checkbox
            checked={data.pode_gerenciar_usuarios}
            onCheckedChange={(checked) => onChange({ ...data, pode_gerenciar_usuarios: checked === true })}
            disabled={data.is_admin}
            className="border-gray-500 data-[state=checked]:bg-[#00ff87] data-[state=checked]:border-[#00ff87]"
          />
          <span className={`text-sm ${data.is_admin ? 'text-gray-500' : 'text-gray-300'}`}>Pode gerenciar usuários</span>
        </label>
      </div>

      {data.is_admin && (
        <p className="text-xs text-gray-500 italic">
          Administradores têm acesso total ao sistema.
        </p>
      )}

      {!data.is_admin && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Acesso às Pastas</h4>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-[#0f172a] p-3 rounded-lg">
            {pastas?.filter(p => p.ativo).map((pasta) => (
              <label key={pasta.id} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={data.pastas_acesso.includes(pasta.id)}
                  onCheckedChange={() => togglePastaAccess(pasta.id, formType)}
                  className="border-gray-500 data-[state=checked]:bg-[#00ff87] data-[state=checked]:border-[#00ff87]"
                />
                <span className="text-xs text-gray-300">{pasta.codigo} - {pasta.nome}</span>
              </label>
            ))}
          </div>
          {data.pastas_acesso.length === 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              Nenhuma pasta selecionada. O usuário não verá registros.
            </p>
          )}
        </div>
      )}
    </div>
  );

  const getPermissionBadges = (user: UserAdmin) => {
    if (user.is_admin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300">
          <ShieldCheck className="h-3 w-3" />
          Admin
        </span>
      );
    }

    const badges = [];
    if (user.pode_criar) badges.push('C');
    if (user.pode_editar) badges.push('E');
    if (user.pode_deletar) badges.push('D');
    if (user.pode_gerenciar_usuarios) badges.push('U');

    if (badges.length === 0) {
      return <span className="text-xs text-gray-500">Sem permissões</span>;
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
        {badges.join(' | ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Administração de Usuários</h1>
            <p className="text-gray-400 mt-1">
              Gerencie os usuários e suas permissões
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00ff87] text-black hover:bg-[#00cc6e]">
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e293b] text-white border-gray-700 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Adicione um novo usuário e defina suas permissões
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

                <PermissionsSection
                  data={formData}
                  onChange={setFormData}
                  formType="create"
                />

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setShowPassword(false);
                      setFormData(defaultFormData);
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
                  <TableHead className="text-gray-300">Permissões</TableHead>
                  <TableHead className="text-gray-300">Pastas</TableHead>
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
                      {getPermissionBadges(user)}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      {user.is_admin ? (
                        <span className="text-purple-300">Todas</span>
                      ) : user.pastas_acesso && user.pastas_acesso.length > 0 ? (
                        <span>{user.pastas_acesso.length} pasta(s)</span>
                      ) : (
                        <span className="text-yellow-500">Nenhuma</span>
                      )}
                    </TableCell>
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
                          onClick={() => handleEdit(user)}
                          className="border-gray-600 text-white hover:bg-gray-700"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-[#1e293b] text-white border-gray-700 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription className="text-gray-400">
                Altere os dados e permissões do usuário
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-usuario">Usuário (Login)</Label>
                <Input
                  id="edit-usuario"
                  value={editFormData.usuario}
                  onChange={(e) => setEditFormData({ ...editFormData, usuario: e.target.value })}
                  placeholder="Ex: joao.silva"
                  className="bg-[#0f172a] border-gray-600 text-white"
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="edit-senha">Nova Senha (opcional)</Label>
                <div className="relative">
                  <Input
                    id="edit-senha"
                    type={showEditPassword ? 'text' : 'password'}
                    value={editFormData.senha}
                    onChange={(e) => setEditFormData({ ...editFormData, senha: e.target.value })}
                    placeholder="Deixe em branco para manter"
                    className="bg-[#0f172a] border-gray-600 text-white pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-nome_completo">Nome Completo</Label>
                <Input
                  id="edit-nome_completo"
                  value={editFormData.nome_completo}
                  onChange={(e) => setEditFormData({ ...editFormData, nome_completo: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="bg-[#0f172a] border-gray-600 text-white"
                  autoComplete="off"
                />
              </div>

              <PermissionsSection
                data={editFormData}
                onChange={setEditFormData}
                formType="edit"
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setShowEditPassword(false);
                    setEditFormData(defaultFormData);
                  }}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-[#00ff87] text-black hover:bg-[#00cc6e]"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      </main>
    </div>
  );
}
