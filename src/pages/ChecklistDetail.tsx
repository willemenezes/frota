import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Car, User, Calendar, CheckCircle, XCircle, FileText, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useUserRole } from "@/hooks/useUserRole";
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

const ChecklistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isGestor } = useUserRole();
  const [checklist, setChecklist] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadChecklistData();
  }, [id]);

  const loadChecklistData = async () => {
    if (!id) return;

    setLoading(true);

    const [checklistResult, responsesResult] = await Promise.all([
      supabase
        .from("checklists")
        .select(`
          *,
          vehicles (placa, modelo),
          profiles (nome_completo),
          checklist_templates (nome, descricao)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("checklist_responses")
        .select(`
          *,
          checklist_template_items (nome, descricao, ordem)
        `)
        .eq("checklist_id", id)
        .order("checklist_template_items(ordem)"),
    ]);

    if (checklistResult.data) {
      setChecklist(checklistResult.data);
      setResponses(responsesResult.data || []);
    } else {
      toast.error("Checklist não encontrado");
      navigate("/checklists");
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
      case "concluido":
        return "Concluído";
      case "pendente":
        return "Pendente";
      default:
        return status;
    }
  };

  const handleApprove = async () => {
    if (!id) return;

    setApproving(true);

    try {
      const { error } = await supabase
        .from("checklists")
        .update({ status: "concluido" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Checklist aprovado com sucesso!");
      loadChecklistData();
    } catch (error) {
      console.error("Erro ao aprovar checklist:", error);
      toast.error("Erro ao aprovar checklist");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando checklist...</p>
        </div>
      </Layout>
    );
  }

  if (!checklist) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/checklists")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex gap-2">
            {checklist.status === 'pendente' && (
              <Button onClick={() => navigate(`/checklists/${id}/preencher`)} className="gap-2">
                <Edit className="h-4 w-4" />
                Preencher Checklist
              </Button>
            )}
            
            {isGestor && checklist.status === 'pendente' && responses.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Aprovar Checklist
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Aprovar Checklist</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja aprovar este checklist? O status será alterado para "Concluído".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove} disabled={approving}>
                      {approving ? "Aprovando..." : "Aprovar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">
                  {checklist.checklist_templates?.nome}
                </CardTitle>
                {checklist.checklist_templates?.descricao && (
                  <p className="text-muted-foreground">
                    {checklist.checklist_templates.descricao}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusColor(checklist.status)}>
                  {getStatusLabel(checklist.status)}
                </Badge>
                {checklist.assinado && (
                  <Badge variant="outline">Assinado</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Car className="h-4 w-4" />
                  <span className="text-sm">Veículo</span>
                </div>
                <p className="font-semibold">
                  {checklist.vehicles?.placa} - {checklist.vehicles?.modelo}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Motorista</span>
                </div>
                <p className="font-semibold">{checklist.profiles?.nome_completo}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Data</span>
                </div>
                <p className="font-semibold">
                  {new Date(checklist.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Odômetro Inicial</p>
                <p className="text-lg font-bold">
                  {checklist.odometro_inicial?.toLocaleString()} km
                </p>
              </div>
              {checklist.odometro_final && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Odômetro Final</p>
                  <p className="text-lg font-bold">
                    {checklist.odometro_final.toLocaleString()} km
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Itens do Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma resposta registrada ainda
              </p>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="mt-1">
                      {response.conforme ? (
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">
                        {response.checklist_template_items?.nome}
                      </h4>
                      {response.checklist_template_items?.descricao && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {response.checklist_template_items.descricao}
                        </p>
                      )}
                     {response.observacao && (
                        <div className="mt-2 p-2 bg-muted rounded">
                          <p className="text-sm">
                            <span className="font-medium">Observação:</span>{" "}
                            {response.observacao}
                          </p>
                        </div>
                      )}
                      {response.fotos_urls && response.fotos_urls.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium">Fotos:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {response.fotos_urls.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={url}
                                  alt={`Foto ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded border hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge variant={response.conforme ? "success" : "destructive"}>
                      {response.conforme ? "Conforme" : "Não Conforme"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {checklist.comentarios && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Comentários Finais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{checklist.comentarios}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ChecklistDetail;
