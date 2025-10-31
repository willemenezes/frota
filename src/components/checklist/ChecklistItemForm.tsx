import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChecklistItemFormProps {
  item: any;
  checklistId: string;
  onComplete: () => void;
}

export const ChecklistItemForm = ({ item, checklistId, onComplete }: ChecklistItemFormProps) => {
  const [conforme, setConforme] = useState<boolean | null>(null);
  const [observacao, setObservacao] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > 3) {
      toast.error("Máximo de 3 fotos por item");
      return;
    }
    
    setSelectedFiles([...selectedFiles, ...files]);
    
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

  const handleSubmit = async () => {
    if (conforme === null) {
      toast.error("Selecione se o item está conforme ou não");
      return;
    }

    setUploading(true);
    const uploadedFilePaths: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
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

      // Salvar resposta
      const { error } = await supabase
        .from("checklist_responses")
        .insert({
          checklist_id: checklistId,
          item_id: item.id,
          conforme: conforme,
          observacao: observacao || null,
          fotos_urls: uploadedPhotos,
        });

      if (error) {
        // Rollback: remover fotos se insert falhar
        if (uploadedFilePaths.length > 0) {
          await supabase.storage.from('checklist-photos').remove(uploadedFilePaths);
        }
        toast.error("Erro ao salvar resposta");
        console.error(error);
        return;
      }

      toast.success("Item registrado com sucesso");
      onComplete();
    } catch (error) {
      console.error('Erro:', error);
      toast.error("Erro ao processar item");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{item.nome}</h3>
          {item.descricao && (
            <p className="text-sm text-muted-foreground mt-1">{item.descricao}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Status do Item *</Label>
          <RadioGroup
            value={conforme === null ? "" : conforme ? "conforme" : "nao_conforme"}
            onValueChange={(value) => setConforme(value === "conforme")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="conforme" id={`conforme-${item.id}`} />
              <Label htmlFor={`conforme-${item.id}`} className="font-normal cursor-pointer">
                Conforme
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao_conforme" id={`nao-conforme-${item.id}`} />
              <Label htmlFor={`nao-conforme-${item.id}`} className="font-normal cursor-pointer">
                Não Conforme
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`observacao-${item.id}`}>Observações</Label>
          <Textarea
            id={`observacao-${item.id}`}
            placeholder="Adicione observações sobre este item..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Fotos do Item (até 3)</Label>
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id={`photo-upload-${item.id}`}
              disabled={selectedFiles.length >= 3}
            />
            <Label
              htmlFor={`photo-upload-${item.id}`}
              className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors ${
                selectedFiles.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">
                {selectedFiles.length >= 3 
                  ? 'Limite de 3 fotos atingido' 
                  : 'Adicionar fotos'}
              </span>
            </Label>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={uploading || conforme === null}
          className="w-full"
        >
          {uploading ? "Salvando..." : "Salvar Item"}
        </Button>
      </CardContent>
    </Card>
  );
};