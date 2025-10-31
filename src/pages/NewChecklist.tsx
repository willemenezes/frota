import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  
  // Upload de fotos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [vehiclesResult, templatesResult] = await Promise.all([
      supabase.from("vehicles").select("*").order("modelo"),
      supabase.from("checklist_templates").select("*").order("nome"),
    ]);

    setVehicles(vehiclesResult.data || []);
    setTemplates(templatesResult.data || []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > 5) {
      toast.error("Máximo de 5 fotos permitidas");
      return;
    }
    
    setSelectedFiles([...selectedFiles, ...files]);
    
    // Criar previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicle || !selectedTemplate || !odometer || !motoristaNome || !motoristaMatricula) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    const uploadedFilePaths: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        setLoading(false);
        return;
      }

      // Upload das fotos
      const uploadedPhotos: string[] = [];
      
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('checklist-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          toast.error(`Erro ao fazer upload da foto: ${file.name}`);
          continue;
        }

        uploadedFilePaths.push(filePath);

        const { data: { publicUrl } } = supabase.storage
          .from('checklist-photos')
          .getPublicUrl(filePath);

        uploadedPhotos.push(publicUrl);
      }

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
          fotos_veiculo: uploadedPhotos,
          status: "pendente",
        })
        .select()
        .single();

      if (error) {
        // Rollback: remover fotos se insert falhar
        if (uploadedFilePaths.length > 0) {
          await supabase.storage.from('checklist-photos').remove(uploadedFilePaths);
        }
        throw error;
      }

      toast.success("Checklist criado com sucesso");
      navigate(`/checklists/${checklist.id}`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error("Erro ao criar checklist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/checklists")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Novo Checklist</h1>
            <p className="text-muted-foreground">Preencha as informações para iniciar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-card">
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

              <div className="space-y-2">
                <Label htmlFor="template">Template *</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="odometer">Odômetro Inicial (km) *</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="Ex: 45000"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
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

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Fotos do Veículo</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione até 5 fotos mostrando o estado atual do veículo
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="photo-upload"
                      disabled={selectedFiles.length >= 5}
                    />
                    <Label
                      htmlFor="photo-upload"
                      className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-accent transition-colors ${
                        selectedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="h-5 w-5" />
                      <span>
                        {selectedFiles.length >= 5 
                          ? 'Limite de 5 fotos atingido' 
                          : 'Clique para adicionar fotos'}
                      </span>
                    </Label>
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                            Foto {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/checklists")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? "Criando..." : "Criar Checklist"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

export default NewChecklist;
