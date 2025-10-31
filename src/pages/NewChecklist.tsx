import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Camera, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { translateSupabaseError } from "@/utils/errorTranslator";

// Seções do veículo
const vehicleSections = [
  { id: "frente", label: "Frente", icon: "🚗" },
  { id: "traseira", label: "Traseira", icon: "🚙" },
  { id: "lateral_esquerda", label: "Lateral Esquerda", icon: "🚘" },
  { id: "lateral_direita", label: "Lateral Direita", icon: "🚖" },
  { id: "interior", label: "Interior", icon: "💺" },
  { id: "motor", label: "Motor", icon: "⚙️" },
] as const;

interface SectionData {
  photos: File[];
  photosPreview: string[];
  observation: string;
  status: "ok" | "com_defeito" | "pendente";
}

const NewChecklist = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Campos do motorista
  const [motoristaNome, setMotoristaNome] = useState("");
  const [motoristaFuncao, setMotoristaFuncao] = useState("");
  const [motoristaMatricula, setMotoristaMatricula] = useState("");
  const [motoristaContrato, setMotoristaContrato] = useState("");

  // Tabs por seção
  const [currentSection, setCurrentSection] = useState("frente");
  const [sectionsData, setSectionsData] = useState<Record<string, SectionData>>({
    frente: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    traseira: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    lateral_esquerda: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    lateral_direita: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    interior: { photos: [], photosPreview: [], observation: "", status: "pendente" },
    motor: { photos: [], photosPreview: [], observation: "", status: "pendente" },
  });

  useEffect(() => {
    loadData();
  }, []);

  // Selecionar template automaticamente quando templates forem carregados
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      // Priorizar o template "Inspeção Geral de Veículo" se existir
      const defaultTemplate = templates.find(t => t.nome === "Inspeção Geral de Veículo") || templates[0];
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    }
  }, [templates, selectedTemplate]);

  const loadData = async () => {
    const [vehiclesResult, templatesResult] = await Promise.all([
      supabase.from("vehicles").select("*").order("modelo"),
      supabase.from("checklist_templates").select("*").order("nome"),
    ]);

    setVehicles(vehiclesResult.data || []);
    setTemplates(templatesResult.data || []);
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
      const fileName = `${Date.now()}-${Math.random()}-${photo.name}`;
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

  const getProgress = () => {
    const completed = Object.values(sectionsData).filter(s => s.status !== "pendente").length;
    return (completed / vehicleSections.length) * 100;
  };

  const getSectionBadge = (sectionId: string) => {
    const status = sectionsData[sectionId].status;
    if (status === "ok") return <Badge className="bg-green-500 text-white">✓ OK</Badge>;
    if (status === "com_defeito") return <Badge variant="destructive">! Defeito</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicle || !selectedTemplate || !odometer || !motoristaNome || !motoristaMatricula) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        setLoading(false);
        return;
      }

      // Upload de todas as fotos de todas as seções
      const allPhotoUrls: string[] = [];
      for (const section of vehicleSections) {
        const sectionData = sectionsData[section.id];
        if (sectionData.photos.length > 0) {
          const urls = await uploadPhotos(section.id, sectionData.photos);
          allPhotoUrls.push(...urls);
        }
      }

      // Compilar observações
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

      const { data: checklist, error } = await supabase
        .from("checklists")
        .insert({
          vehicle_id: selectedVehicle,
          template_id: selectedTemplate,
          motorista_id: user.id,
          odometro_inicial: parseInt(odometer),
          motorista_nome: motoristaNome,
          motorista_funcao: motoristaFuncao,
          motorista_matricula: motoristaMatricula,
          motorista_contrato: motoristaContrato,
          fotos_veiculo: allPhotoUrls,
          comentarios: observations || null,
          status: hasDefect ? "com_defeito" : (allCompleted ? "ok" : "pendente"),
        })
        .select()
        .single();

      if (error) {
        throw new Error(translateSupabaseError(error, "Erro ao criar checklist"));
      }

      toast.success("Checklist criado com sucesso!");
      navigate(`/checklists/${checklist.id}`);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || "Erro ao criar checklist. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const progress = getProgress();
  const completedSections = Object.values(sectionsData).filter(s => s.status !== "pendente").length;
  const currentSectionData = sectionsData[currentSection];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/checklists")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Novo Checklist</h1>
            <p className="text-muted-foreground">Preencha as informações e inspecione o veículo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Informações do Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Veículo *</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.placa} - {vehicle.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template oculto - selecionado automaticamente */}
              {selectedTemplate && (
                <input type="hidden" value={selectedTemplate} />
              )}

              <div className="space-y-2">
                <Label htmlFor="odometer">Odômetro Inicial (km) *</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="Ex: 45000"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  required
                />
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Informações do Motorista</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="motorista-nome">Nome Completo *</Label>
                    <Input
                      id="motorista-nome"
                      placeholder="Digite seu nome completo"
                      value={motoristaNome}
                      onChange={(e) => setMotoristaNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motorista-funcao">Função</Label>
                    <Input
                      id="motorista-funcao"
                      placeholder="Ex: Motorista, Operador"
                      value={motoristaFuncao}
                      onChange={(e) => setMotoristaFuncao(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motorista-matricula">Matrícula *</Label>
                    <Input
                      id="motorista-matricula"
                      placeholder="Digite sua matrícula"
                      value={motoristaMatricula}
                      onChange={(e) => setMotoristaMatricula(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motorista-contrato">Contrato</Label>
                    <Input
                      id="motorista-contrato"
                      placeholder="Número do contrato"
                      value={motoristaContrato}
                      onChange={(e) => setMotoristaContrato(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progresso da Inspeção */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="space-y-2">
                <CardTitle>Inspeção do Veículo</CardTitle>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso da Inspeção</span>
                  <span className="font-medium">
                    {completedSections} / {vehicleSections.length} seções completas
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardHeader>
          </Card>

          {/* Tabs por Seção */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Tabs value={currentSection} onValueChange={setCurrentSection} className="w-full">
                <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 h-auto p-2 bg-muted/50 w-full overflow-x-auto">
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
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          
                          <label className="aspect-square rounded-lg border-2 border-dashed border-muted hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-muted/50 active:scale-95">
                            <Camera className="h-10 w-10 text-primary" />
                            <span className="text-sm font-medium text-foreground">Tirar Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
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

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/checklists")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Criar Checklist
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewChecklist;
