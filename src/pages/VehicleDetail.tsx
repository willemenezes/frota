import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Car, Calendar, Gauge, FileText, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isGestor } = useUserRole();
  const [vehicle, setVehicle] = useState<any>(null);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicleData();
  }, [id]);

  const loadVehicleData = async () => {
    if (!id) return;
    
    setLoading(true);
    
    const [vehicleResult, checklistsResult, defectsResult] = await Promise.all([
      supabase.from("vehicles").select("*").eq("id", id).single(),
      supabase
        .from("checklists")
        .select("*, profiles(nome_completo)")
        .eq("vehicle_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("defects")
        .select("*")
        .eq("vehicle_id", id)
        .eq("status", "aberto")
        .order("created_at", { ascending: false }),
    ]);

    if (vehicleResult.data) {
      setVehicle(vehicleResult.data);
    } else {
      toast.error("Veículo não encontrado");
      navigate("/veiculos");
    }

    setChecklists(checklistsResult.data || []);
    setDefects(defectsResult.data || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;

    const { error } = await supabase.from("vehicles").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir veículo");
    } else {
      toast.success("Veículo excluído com sucesso");
      navigate("/veiculos");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critico":
        return "destructive";
      case "moderado":
        return "default";
      default:
        return "secondary";
    }
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

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando veículo...</p>
        </div>
      </Layout>
    );
  }

  if (!vehicle) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/veiculos")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          {isGestor && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Car className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{vehicle.modelo}</CardTitle>
                  <p className="text-muted-foreground">Placa: {vehicle.placa}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Ano</span>
                </div>
                <p className="text-2xl font-bold">{vehicle.ano}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="h-4 w-4" />
                  <span className="text-sm">Quilometragem</span>
                </div>
                <p className="text-2xl font-bold">{vehicle.quilometragem_atual.toLocaleString()} km</p>
              </div>
              {vehicle.chassi && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Chassi</span>
                  </div>
                  <p className="text-lg font-mono">{vehicle.chassi}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Checklists Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklists.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  Nenhum checklist realizado
                </p>
              ) : (
                <div className="space-y-3">
                  {checklists.map((checklist) => (
                    <div
                      key={checklist.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/checklists/${checklist.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{checklist.profiles?.nome_completo}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(checklist.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(checklist.status)}>
                        {checklist.status === "ok" ? "OK" : checklist.status === "com_defeito" ? "Com Defeito" : "Pendente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Defeitos Abertos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {defects.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  Nenhum defeito em aberto
                </p>
              ) : (
                <div className="space-y-3">
                  {defects.map((defect) => (
                    <div
                      key={defect.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={getSeverityColor(defect.severidade)}>
                          {defect.severidade}
                        </Badge>
                      </div>
                      <p className="text-sm">{defect.descricao}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(defect.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default VehicleDetail;
