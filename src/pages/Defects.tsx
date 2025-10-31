import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Calendar, Car as CarIcon, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Defects = () => {
  const navigate = useNavigate();
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDefects();
  }, []);

  const loadDefects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("defects")
      .select(`
        *,
        vehicles (placa, modelo)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDefects(data);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critico":
        return "destructive";
      case "moderado":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "destructive";
      case "em_analise":
        return "warning";
      default:
        return "success";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critico":
        return "Crítico";
      case "moderado":
        return "Moderado";
      default:
        return "Leve";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto":
        return "Aberto";
      case "em_analise":
        return "Em Análise";
      default:
        return "Resolvido";
    }
  };

  const filterDefects = (status: string) => {
    if (status === "todos") return defects;
    return defects.filter((d) => d.status === status);
  };

  const DefectCard = ({ defect }: { defect: any }) => (
    <Card className="shadow-card hover:shadow-elegant transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={getSeverityColor(defect.severidade)}>
                  {getSeverityLabel(defect.severidade)}
                </Badge>
                <Badge variant={getStatusColor(defect.status)}>
                  {getStatusLabel(defect.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CarIcon className="h-4 w-4" />
                <span>
                  {defect.vehicles?.placa} - {defect.vehicles?.modelo}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-foreground mb-3">{defect.descricao}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date(defect.created_at).toLocaleDateString("pt-BR")}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Defeitos</h1>
            <p className="text-muted-foreground">
              Gerencie os defeitos identificados na frota
            </p>
          </div>
          <Button onClick={() => navigate("/defeitos/novo")}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Defeito
          </Button>
        </div>

        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="aberto">Abertos</TabsTrigger>
            <TabsTrigger value="em_analise">Em Análise</TabsTrigger>
            <TabsTrigger value="resolvido">Resolvidos</TabsTrigger>
          </TabsList>

          {["todos", "aberto", "em_analise", "resolvido"].map((status) => (
            <TabsContent key={status} value={status} className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Carregando defeitos...</p>
                </div>
              ) : filterDefects(status).length === 0 ? (
                <Card className="shadow-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Nenhum defeito {status === "todos" ? "" : getStatusLabel(status).toLowerCase()}
                    </h3>
                    <p className="text-muted-foreground">
                      {status === "aberto"
                        ? "Ótimo! Nenhum defeito em aberto no momento"
                        : "Não há defeitos nesta categoria"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filterDefects(status).map((defect) => (
                    <DefectCard key={defect.id} defect={defect} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Defects;
