import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { translateSupabaseError } from "@/utils/errorTranslator";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

          if (error) {
            throw new Error(translateSupabaseError(error, "Erro ao fazer login"));
          }
          
          toast.success("Login realizado com sucesso!");
        } catch (error: any) {
          toast.error(error.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/frota.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay semi-transparente para garantir legibilidade (mais visível ao fundo) */}
      <div className="absolute inset-0 bg-background/40"></div>
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        <Card className="shadow-elegant bg-white/80 backdrop-blur-md border-white/20">
          <CardHeader className="space-y-1">
            <img
              src="/CGB ENERGIA LOGO.png"
              alt="CGB Energia"
              className="mx-auto mb-2 h-12 object-contain"
            />
            <CardTitle className="text-3xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
              Controle de Frota
            </CardTitle>
            <CardDescription className="text-center">
              Sistema de Gestão de Frota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
            </Button>

            {/* Info de segurança dentro do card */}
            <div className="mt-4 pt-4 border-t text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium">Sistema online e seguro</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Protegido por criptografia de ponta a ponta
              </p>
            </div>
          </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 py-6">
          <div className="flex justify-center">
            <img
              src="/CGB.png"
              alt="CGB"
              className="h-8 object-contain"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-foreground">
              © 2025 <span className="font-bold text-primary">GRUPO CGB</span>. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground">
              Portal Administrativo - Sistema de Gestão de Frota
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
