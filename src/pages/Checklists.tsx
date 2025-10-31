import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ClipboardCheck, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Checklists = () => {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("checklists")
      .select(`
        *,
        vehicles (placa, modelo),
        profiles (nome_completo),
        checklist_templates (nome)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setChecklists(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "success";
      case "com_defeito":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ok":
        return "OK";
      case "com_defeito":
        return "Com Defeito";
      default:
        return "Pendente";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Checklists</h1>
            <p className="text-muted-foreground">
              Inspeções realizadas nos veículos
            </p>
          </div>
          <Button onClick={() => navigate("/checklists/novo")} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Checklist
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando checklists...</p>
          </div>
        ) : checklists.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum checklist realizado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro checklist
              </p>
              <Button onClick={() => navigate("/checklists/novo")} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Checklist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {checklists.map((checklist) => (
              <Card
                key={checklist.id}
                className="shadow-card hover:shadow-elegant transition-all cursor-pointer"
                onClick={() => navigate(`/checklists/${checklist.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {checklist.vehicles?.placa} - {checklist.vehicles?.modelo}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {checklist.checklist_templates?.nome}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{checklist.profiles?.nome_completo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(checklist.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(checklist.status)}>
                        {getStatusLabel(checklist.status)}
                      </Badge>
                      {checklist.assinado && (
                        <Badge variant="outline">Assinado</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Checklists;
