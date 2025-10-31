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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCog, Loader2 } from "lucide-react";

interface User {
  id: string;
  nome_completo: string;
  role: string;
  created_at: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    
    // First, get all profiles with their roles
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

    // Then, get roles for each user
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      toast.error("Erro ao carregar funções dos usuários");
      console.error(rolesError);
      setLoading(false);
      return;
    }

    // Create a map of user roles
    const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

    // Combine the data
    const usersWithRoles: User[] = profilesData?.map(profile => ({
      id: profile.id,
      nome_completo: profile.nome_completo,
      role: rolesMap.get(profile.id) || "motorista",
      created_at: profile.created_at,
    })) || [];

    setUsers(usersWithRoles);
    setLoading(false);
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
        return <Badge variant="destructive">Administrador</Badge>;
      case "gestor":
        return <Badge variant="warning">Gestor</Badge>;
      default:
        return <Badge variant="secondary">Motorista</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os acessos dos usuários do sistema
            </p>
          </div>
          <UserCog className="h-8 w-8 text-primary" />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.nome_completo}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Users;
