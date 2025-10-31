-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('motorista', 'gestor', 'administrador');

-- Create enum for defect severity
CREATE TYPE public.defect_severity AS ENUM ('leve', 'moderado', 'critico');

-- Create enum for defect status
CREATE TYPE public.defect_status AS ENUM ('aberto', 'em_analise', 'resolvido');

-- Create enum for checklist status
CREATE TYPE public.checklist_status AS ENUM ('ok', 'com_defeito', 'pendente');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  telefone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'motorista',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT UNIQUE NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  chassi TEXT,
  quilometragem_atual INTEGER NOT NULL DEFAULT 0,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicle_documents table
CREATE TABLE public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  data_vencimento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checklist_templates table
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checklist_template_items table
CREATE TABLE public.checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checklists table
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  motorista_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  odometro_inicial INTEGER NOT NULL,
  odometro_final INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  comentarios TEXT,
  status checklist_status NOT NULL DEFAULT 'pendente',
  assinado BOOLEAN DEFAULT FALSE,
  assinado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create checklist_responses table
CREATE TABLE public.checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.checklist_template_items(id) ON DELETE CASCADE,
  conforme BOOLEAN NOT NULL,
  observacao TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create defects table
CREATE TABLE public.defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  severidade defect_severity NOT NULL DEFAULT 'leve',
  status defect_status NOT NULL DEFAULT 'aberto',
  foto_url TEXT,
  resolvido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolvido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

-- RLS Policies for vehicles
CREATE POLICY "All authenticated users can view vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage vehicles"
  ON public.vehicles FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestor') OR 
    public.has_role(auth.uid(), 'administrador')
  );

-- RLS Policies for vehicle_documents
CREATE POLICY "All authenticated users can view documents"
  ON public.vehicle_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage documents"
  ON public.vehicle_documents FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestor') OR 
    public.has_role(auth.uid(), 'administrador')
  );

-- RLS Policies for checklist_templates
CREATE POLICY "All authenticated users can view templates"
  ON public.checklist_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage templates"
  ON public.checklist_templates FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestor') OR 
    public.has_role(auth.uid(), 'administrador')
  );

-- RLS Policies for checklist_template_items
CREATE POLICY "All authenticated users can view template items"
  ON public.checklist_template_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage template items"
  ON public.checklist_template_items FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestor') OR 
    public.has_role(auth.uid(), 'administrador')
  );

-- RLS Policies for checklists
CREATE POLICY "All authenticated users can view checklists"
  ON public.checklists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Motoristas can create their own checklists"
  ON public.checklists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = motorista_id);

CREATE POLICY "Motoristas can update their own pending checklists"
  ON public.checklists FOR UPDATE
  TO authenticated
  USING (auth.uid() = motorista_id AND status = 'pendente');

CREATE POLICY "Gestores and admins can manage all checklists"
  ON public.checklists FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestor') OR 
    public.has_role(auth.uid(), 'administrador')
  );

-- RLS Policies for checklist_responses
CREATE POLICY "All authenticated users can view responses"
  ON public.checklist_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create responses for their checklists"
  ON public.checklist_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.checklists
      WHERE id = checklist_id AND motorista_id = auth.uid()
    )
  );

-- RLS Policies for defects
CREATE POLICY "All authenticated users can view defects"
  ON public.defects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Motoristas can create defects"
  ON public.defects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Gestores and admins can manage defects"
  ON public.defects FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestor') OR 
    public.has_role(auth.uid(), 'administrador')
  );

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email)
  );
  
  -- Create default role as motorista
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'motorista');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_defects_updated_at
  BEFORE UPDATE ON public.defects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default checklist template
INSERT INTO public.checklist_templates (nome, descricao)
VALUES ('Inspeção Geral de Veículo', 'Template padrão para inspeção diária de veículos');

-- Get the template ID for the items
DO $$
DECLARE
  template_id UUID;
BEGIN
  SELECT id INTO template_id FROM public.checklist_templates WHERE nome = 'Inspeção Geral de Veículo';
  
  INSERT INTO public.checklist_template_items (template_id, nome, descricao, ordem) VALUES
  (template_id, 'Pneus', 'Verificar calibragem e condição dos pneus', 1),
  (template_id, 'Freios', 'Testar eficiência dos freios', 2),
  (template_id, 'Luzes', 'Verificar funcionamento de faróis, lanternas e setas', 3),
  (template_id, 'Lataria', 'Inspecionar condição da lataria e pintura', 4),
  (template_id, 'Motor', 'Verificar níveis de óleo e líquido de arrefecimento', 5),
  (template_id, 'Documentação', 'Conferir presença de documentos obrigatórios', 6),
  (template_id, 'Extintor', 'Verificar validade e condição do extintor', 7),
  (template_id, 'Triângulo', 'Confirmar presença do triângulo de segurança', 8),
  (template_id, 'Limpeza Interna', 'Avaliar limpeza e organização do interior', 9),
  (template_id, 'Combustível', 'Verificar nível de combustível', 10);
END $$;