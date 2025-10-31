import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Loader2, Search, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TableSkeleton } from "@/components/common/TableSkeleton";

interface User {
  id: string;
  nome_completo: string;
  role: string;
  created_at: string;
  email?: string;
}

const newUserSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["motorista", "gestor", "administrador"]),
});

type NewUserFormData = z.infer<typeof newUserSchema>;

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      role: "motorista",
    },
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const loadUsers = async () => {
    setLoading(true);

    // Get all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        nome_completo,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast.error("Erro ao carregar usuários");
      console.error(profilesError);
      setLoading(false);
      return;
    }

    // Get roles
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      toast.error("Erro ao carregar funções dos usuários");
      console.error(rolesError);
      setLoading(false);
      return;
    }

    // Get emails from function (apenas administradores podem ver)
    // Se a função não funcionar, continuar sem emails (não crítico)
    let emailsMap = new Map<string, string>();
    try {
      const { data: emailsData, error: emailsError } = await supabase.rpc("get_user_emails");
      
      if (emailsError) {
        console.warn("[Users] Erro ao buscar emails (não crítico):", emailsError);
        // Continuar sem emails - não é crítico para o funcionamento
      } else if (emailsData) {
        emailsMap = new Map(emailsData.map(u => [u.id, u.email]));
      }
    } catch (error) {
      console.warn("[Users] Erro ao chamar função get_user_emails (não crítico):", error);
      // Continuar sem emails - não é crítico para o funcionamento
    }

    const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

    const usersWithRoles: User[] = profilesData?.map(profile => ({
      id: profile.id,
      nome_completo: profile.nome_completo,
      role: rolesMap.get(profile.id) || "motorista",
      created_at: profile.created_at,
      email: emailsMap.get(profile.id),
    })) || [];

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const onSubmitNewUser = async (data: NewUserFormData) => {
    try {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      // Chamar Edge Function para criar usuário
      const { data: functionData, error: functionError } = await supabase.functions.invoke("create-user", {
        body: {
          email: data.email,
          password: data.password,
          nome_completo: data.nome_completo,
          role: data.role,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || "Erro ao chamar função de criação de usuário");
      }

      if (functionData?.error) {
        throw new Error(functionData.message || "Erro ao criar usuário");
      }

      toast.success("Usuário criado com sucesso!");
      setDialogOpen(false);
      reset();
      loadUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Erro ao criar usuário");
    }
  };

  const promoteToGestor = async (userId: string, currentRole: string) => {
    if (currentRole === "gestor" || currentRole === "administrador") {
      toast.info("Este usuário já é gestor ou administrador");
      return;
    }

    setUpdatingUser(userId);

    const { error } = await supabase
      .from("user_roles")
      .update({ role: "gestor" })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao promover usuário");
      console.error(error);
    } else {
      toast.success("Usuário promovido a gestor com sucesso");
      loadUsers();
    }

    setUpdatingUser(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrador":
        return <Badge variant="destructive" className="shadow-sm">Administrador</Badge>;
      case "gestor":
        return <Badge className="bg-accent shadow-sm">Gestor</Badge>;
      default:
        return <Badge variant="secondary" className="shadow-sm">Motorista</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os acessos dos usuários do sistema
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os perfis</SelectItem>
                  <SelectItem value="motorista">Motorista</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Usuários Cadastrados ({filteredUsers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : filteredUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold">E-mail</TableHead>
                      <TableHead className="font-semibold">Perfil</TableHead>
                      <TableHead className="font-semibold">Cadastrado em</TableHead>
                      <TableHead className="text-right font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{user.nome_completo}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => promoteToGestor(user.id, user.role)}
                            disabled={
                              user.role === "gestor" ||
                              user.role === "administrador" ||
                              updatingUser === user.id
                            }
                            className="transition-all hover:scale-105"
                          >
                            {updatingUser === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Promover a Gestor"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating Action Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:rotate-90 z-50 animate-fadeIn"
            >
              <UserPlus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitNewUser)}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    {...register("nome_completo")}
                    placeholder="João da Silva"
                  />
                  {errors.nome_completo && (
                    <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="joao@exemplo.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil *</Label>
                  <Select
                    defaultValue="motorista"
                    onValueChange={(value) =>
                      setValue("role", value as "motorista" | "gestor" | "administrador")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorista">Motorista</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Users;
