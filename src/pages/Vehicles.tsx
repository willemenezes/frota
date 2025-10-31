import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Car as CarIcon, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

const Vehicles = () => {
  const navigate = useNavigate();
  const { isGestor } = useUserRole();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVehicles(data);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Veículos</h1>
            <p className="text-muted-foreground">
              Gerencie a frota de veículos
            </p>
          </div>
          {isGestor && (
            <Button onClick={() => navigate("/veiculos/novo")} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Veículo
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando veículos...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum veículo cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                {isGestor ? "Comece adicionando seu primeiro veículo" : "Nenhum veículo disponível"}
              </p>
              {isGestor && (
                <Button onClick={() => navigate("/veiculos/novo")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Veículo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className="shadow-card hover:shadow-elegant transition-all cursor-pointer"
                onClick={() => navigate(`/veiculos/${vehicle.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <CarIcon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary">{vehicle.placa}</Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{vehicle.modelo}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Ano: {vehicle.ano}</span>
                    </div>
                    <div>
                      <span>Km: {vehicle.quilometragem_atual.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Vehicles;
