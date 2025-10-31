import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle, Camera, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Seções do veículo
const vehicleSections = [
  { id: "frente", label: "Frente", icon: "🚗" },
  { id: "traseira", label: "Traseira", icon: "🚙" },
  { id: "lateral_esquerda", label: "Lateral Esquerda", icon: "🚘" },
  { id: "lateral_direita", label: "Lateral Direita", icon: "🚖" },
  { id: "interior", label: "Interior", icon: "💺" },
  { id: "motor", label: "Motor", icon: "⚙️" },
];

interface SectionData {
  photos: File[];
  photosPreview: string[];
  observation: string;
  status: "ok" | "com_defeito" | "pendente";
}

const ChecklistFill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState("frente");
  
  // Estado para cada seção
  const [sectionsData, setSectionsData] = useState<Record<string, SectionData>>({
    frente: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    traseira: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    lateral_esquerda: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    lateral_direita: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    interior: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    motor: { photos: [], photosPreview: [], observation: "", status: "pendente" },
  });

  useEffect(() => {
    loadChecklistData();
  }, [id]);

  const loadChecklistData = async () => {
    if (!id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("checklists")
      .select(`
        *,
        vehicles (placa, modelo),
        checklist_templates (nome, descricao)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      toast.error("Checklist não encontrado");
      navigate("/checklists");
    } else {
      setChecklist(data);
    }

    setLoading(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setSectionsData(prev => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        photos: [...prev[currentSection].photos, ...files],
        photosPreview: [...prev[currentSection].photosPreview, ...newPreviews],
      },
    }));
  };

  const removePhoto = (index: number) => {
    setSectionsData(prev => {
      const section = prev[currentSection];
      URL.revokeObjectURL(section.photosPreview[index]);
      
      return {
        ...prev,
        [currentSection]: {
          ...section,
          photos: section.photos.filter((_, i) => i !== index),
          photosPreview: section.photosPreview.filter((_, i) => i !== index),
        },
      };
    });
  };

  const updateSectionData = (field: keyof SectionData, value: any) => {
    setSectionsData(prev => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        [field]: value,
      },
    }));
  };

  const uploadPhotos = async (sectionId: string, photos: File[]) => {
    const urls: string[] = [];

    for (const photo of photos) {
      const fileName = `${id}/${sectionId}/${Date.now()}-${photo.name}`;
      const { data, error } = await supabase.storage
        .from("checklist-photos")
        .upload(fileName, photo);

      if (error) {
        console.error("Erro ao fazer upload:", error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("checklist-photos")
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    }

    return urls;
  };

  const saveChecklist = async () => {
    setSaving(true);

    try {
      // Upload de todas as fotos
      const allPhotoUrls: string[] = [];
      for (const section of vehicleSections) {
        const sectionData = sectionsData[section.id];
        if (sectionData.photos.length > 0) {
          const urls = await uploadPhotos(section.id, sectionData.photos);
          allPhotoUrls.push(...urls);
        }
      }

      // Atualizar checklist com fotos e observações
      const observations = vehicleSections
        .map(s => {
          const data = sectionsData[s.id];
          if (data.observation) {
            return `**${s.label}**: ${data.observation}`;
          }
          return null;
        })
        .filter(Boolean)
        .join("\n\n");

      // Determinar status geral
      const hasDefect = Object.values(sectionsData).some(s => s.status === "com_defeito");
      const allCompleted = Object.values(sectionsData).every(s => s.status !== "pendente");

      const { error } = await supabase
        .from("checklists")
        .update({
          fotos_veiculo: allPhotoUrls,
          comentarios: observations,
          status: hasDefect ? "com_defeito" : (allCompleted ? "ok" : "pendente"),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Checklist salvo com sucesso!");
      navigate(`/checklists/${id}`);
    } catch (error: any) {
      console.error("Erro ao salvar checklist:", error);
      toast.error("Erro ao salvar checklist");
    } finally {
      setSaving(false);
    }
  };

  const getProgress = () => {
    const completed = Object.values(sectionsData).filter(s => s.status !== "pendente").length;
    return (completed / vehicleSections.length) * 100;
  };

  const getSectionBadge = (sectionId: string) => {
    const status = sectionsData[sectionId].status;
    if (status === "ok") return <Badge className="bg-green-500">✓ OK</Badge>;
    if (status === "com_defeito") return <Badge variant="destructive">! Defeito</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!checklist) return null;

  const currentSectionData = sectionsData[currentSection];
  const progress = getProgress();
  const completedSections = Object.values(sectionsData).filter(s => s.status !== "pendente").length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/checklists/${id}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button 
            onClick={saveChecklist} 
            disabled={saving || progress === 0}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Salvar Checklist
              </>
            )}
          </Button>
        </div>

        {/* Header Card */}
        <Card className="shadow-md">
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
                  <span className="text-muted-foreground">Progresso da Inspeção</span>
                  <span className="font-medium">
                    {completedSections} / {vehicleSections.length} seções completas
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs for Vehicle Sections */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <Tabs value={currentSection} onValueChange={setCurrentSection}>
              <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 h-auto p-2 bg-muted/50">
                {vehicleSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex flex-col items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span className="text-2xl">{section.icon}</span>
                    <span className="text-xs">{section.label}</span>
                    {getSectionBadge(section.id)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {vehicleSections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-3xl">{section.icon}</span>
                        Inspeção: {section.label}
                      </h3>
                    </div>

                    {/* Status Radio Group */}
                    <div className="space-y-2">
                      <Label>Status da Inspeção *</Label>
                      <RadioGroup
                        value={currentSectionData.status}
                        onValueChange={(value) => updateSectionData("status", value)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ok" id={`ok-${section.id}`} />
                          <Label htmlFor={`ok-${section.id}`} className="cursor-pointer">
                            ✓ OK
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="com_defeito" id={`defeito-${section.id}`} />
                          <Label htmlFor={`defeito-${section.id}`} className="cursor-pointer">
                            ! Com Defeito
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <Label>Fotos da Seção</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {currentSectionData.photosPreview.map((preview, index) => (
                          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-muted">
                            <img
                              src={preview}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removePhoto(index)}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        
                        <label className="aspect-square rounded-lg border-2 border-dashed border-muted hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-muted/50">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Adicionar Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Observation */}
                    <div className="space-y-2">
                      <Label htmlFor={`obs-${section.id}`}>Observações</Label>
                      <Textarea
                        id={`obs-${section.id}`}
                        placeholder="Adicione observações sobre esta seção do veículo..."
                        value={currentSectionData.observation}
                        onChange={(e) => updateSectionData("observation", e.target.value)}
                        rows={4}
                      />
                    </div>

                    {currentSectionData.status === "com_defeito" && (
                      <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-destructive">Defeito Identificado</p>
                          <p className="text-muted-foreground mt-1">
                            Certifique-se de documentar o defeito com fotos e observações detalhadas.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChecklistFill;
