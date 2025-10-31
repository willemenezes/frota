import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";

const defectSchema = z.object({
  vehicle_id: z.string().min(1, "Selecione um veículo"),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres").max(1000),
  severidade: z.enum(["leve", "moderado", "critico"]),
});

type DefectForm = z.infer<typeof defectSchema>;

interface Vehicle {
  id: string;
  modelo: string;
  placa: string;
}

export default function NewDefect() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DefectForm>({
    resolver: zodResolver(defectSchema),
    defaultValues: {
      severidade: "leve",
    },
  });

  const selectedVehicleId = watch("vehicle_id");

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, modelo, placa")
      .order("modelo");

    if (!error && data) {
      setVehicles(data);
    } else {
      toast.error("Erro ao carregar veículos");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const uploadPhoto = async (): Promise<{ url: string; path: string } | null> => {
    if (!photoFile) return null;

    setUploading(true);
    try {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `defects/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("checklist-photos")
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("checklist-photos")
        .getPublicUrl(filePath);

      return { url: publicUrl, path: filePath };
    } catch (error) {
      toast.error("Erro ao fazer upload da foto");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: DefectForm) => {
    setLoading(true);
    let uploadedFilePath: string | null = null;

    try {
      let foto_url = null;
      if (photoFile) {
        const uploadResult = await uploadPhoto();
        if (!uploadResult) {
          setLoading(false);
          return;
        }
        foto_url = uploadResult.url;
        uploadedFilePath = uploadResult.path;
      }

      const { error } = await supabase.from("defects").insert([{
        vehicle_id: data.vehicle_id,
        descricao: data.descricao,
        severidade: data.severidade,
        foto_url,
        status: "aberto",
      }]);

      if (error) {
        // Rollback: remover foto se insert falhar
        if (uploadedFilePath) {
          await supabase.storage.from("checklist-photos").remove([uploadedFilePath]);
        }
        throw error;
      }

      toast.success("Defeito registrado com sucesso!");
      navigate("/defeitos");
    } catch (error) {
      console.error("Erro ao criar defeito:", error);
      toast.error("Erro ao registrar defeito");
    } finally {
      setLoading(false);
    }
  };

  const getSeveridadeLabel = (severity: string) => {
    const labels = {
      leve: "Leve",
      moderado: "Moderado",
      critico: "Crítico",
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Novo Defeito</CardTitle>
            <CardDescription>
              Preencha as informações abaixo para registrar um defeito no veículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Veículo *</Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={(value) => setValue("vehicle_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.modelo} - {vehicle.placa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicle_id && (
                  <p className="text-sm text-destructive">{errors.vehicle_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="severidade">Severidade *</Label>
                <Select
                  value={watch("severidade")}
                  onValueChange={(value) => setValue("severidade", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="critico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
                {errors.severidade && (
                  <p className="text-sm text-destructive">{errors.severidade.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o defeito encontrado..."
                  className="min-h-32"
                  {...register("descricao")}
                />
                {errors.descricao && (
                  <p className="text-sm text-destructive">{errors.descricao.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Foto do Defeito (opcional)</Label>
                <div className="flex items-start gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("photo")?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {photoFile ? "Trocar foto" : "Adicionar foto"}
                  </Button>
                </div>
                {photoPreview && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Defeito"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/defeitos")}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
