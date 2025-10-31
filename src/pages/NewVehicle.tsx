import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const NewVehicle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    placa: "",
    modelo: "",
    ano: "",
    chassi: "",
    quilometragem_atual: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("vehicles").insert({
        placa: formData.placa.toUpperCase(),
        modelo: formData.modelo,
        ano: parseInt(formData.ano),
        chassi: formData.chassi || null,
        quilometragem_atual: parseInt(formData.quilometragem_atual),
      });

      if (error) throw error;

      toast.success("Veículo cadastrado com sucesso!");
      navigate("/veiculos");
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar veículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/veiculos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Novo Veículo</h1>
            <p className="text-muted-foreground">
              Cadastre um novo veículo na frota
            </p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Informações do Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="placa">Placa *</Label>
                  <Input
                    id="placa"
                    placeholder="ABC-1234"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    placeholder="Ex: Fiat Uno"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano *</Label>
                  <Input
                    id="ano"
                    type="number"
                    placeholder="2023"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quilometragem">Quilometragem Atual *</Label>
                  <Input
                    id="quilometragem"
                    type="number"
                    placeholder="0"
                    value={formData.quilometragem_atual}
                    onChange={(e) =>
                      setFormData({ ...formData, quilometragem_atual: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chassi">Chassi</Label>
                <Input
                  id="chassi"
                  placeholder="9BWZZZ377VT004251"
                  value={formData.chassi}
                  onChange={(e) => setFormData({ ...formData, chassi: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/veiculos")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Cadastrar Veículo"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NewVehicle;
