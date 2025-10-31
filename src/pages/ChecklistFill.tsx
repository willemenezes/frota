import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ChecklistItemForm } from "@/components/checklist/ChecklistItemForm";
import { Progress } from "@/components/ui/progress";

const ChecklistFill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<any>(null);
  const [templateItems, setTemplateItems] = useState<any[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklistData();
  }, [id]);

  const loadChecklistData = async () => {
    if (!id) return;

    setLoading(true);

    const [checklistResult, templateItemsResult, responsesResult] = await Promise.all([
      supabase
        .from("checklists")
        .select(`
          *,
          vehicles (placa, modelo),
          checklist_templates (nome, descricao)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("checklist_template_items")
        .select("*")
        .order("ordem"),
      supabase
        .from("checklist_responses")
        .select("item_id")
        .eq("checklist_id", id),
    ]);

    if (checklistResult.data) {
      setChecklist(checklistResult.data);
      
      // Filtrar apenas itens do template do checklist
      const items = (templateItemsResult.data || []).filter(
        item => item.template_id === checklistResult.data.template_id
      );
      setTemplateItems(items);

      // Marcar itens já respondidos
      const completed = new Set(
        (responsesResult.data || []).map(r => r.item_id)
      );
      setCompletedItems(completed);

      // Encontrar primeiro item não completado
      const firstIncomplete = items.findIndex(
        item => !completed.has(item.id)
      );
      if (firstIncomplete !== -1) {
        setCurrentItemIndex(firstIncomplete);
      }
    } else {
      toast.error("Checklist não encontrado");
      navigate("/checklists");
    }

    setLoading(false);
  };

  const handleItemComplete = () => {
    const currentItem = templateItems[currentItemIndex];
    setCompletedItems(prev => new Set([...prev, currentItem.id]));

    // Ir para próximo item
    if (currentItemIndex < templateItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      toast.success("Checklist completado!");
      navigate(`/checklists/${id}`);
    }
  };

  const progress = (completedItems.size / templateItems.length) * 100;

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando checklist...</p>
        </div>
      </Layout>
    );
  }

  if (!checklist || templateItems.length === 0) return null;

  const currentItem = templateItems[currentItemIndex];
  const isCurrentItemCompleted = completedItems.has(currentItem?.id);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/checklists/${id}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Card className="shadow-card">
          <CardHeader>
            <div className="space-y-4">
              <div>
                <CardTitle className="text-2xl">
                  {checklist.checklist_templates?.nome}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {checklist.vehicles?.placa} - {checklist.vehicles?.modelo}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Item {currentItemIndex + 1} de {templateItems.length}
                  </span>
                  <span className="font-medium">
                    {completedItems.size} / {templateItems.length} completos
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {currentItem && !isCurrentItemCompleted && (
          <ChecklistItemForm
            item={currentItem}
            checklistId={id!}
            onComplete={handleItemComplete}
          />
        )}

        {currentItem && isCurrentItemCompleted && (
          <Card className="border-2 border-green-500">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{currentItem.nome}</h3>
                  <p className="text-muted-foreground">Item já registrado</p>
                </div>
                {currentItemIndex < templateItems.length - 1 && (
                  <Button onClick={() => setCurrentItemIndex(currentItemIndex + 1)}>
                    Próximo Item
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {completedItems.size === templateItems.length && (
          <Card className="border-2 border-green-500">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Checklist Completado!</h3>
                  <p className="text-muted-foreground">
                    Todos os itens foram verificados
                  </p>
                </div>
                <Button onClick={() => navigate(`/checklists/${id}`)}>
                  Ver Checklist Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ChecklistFill;