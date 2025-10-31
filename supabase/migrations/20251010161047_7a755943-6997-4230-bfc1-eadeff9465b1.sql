-- Deletar todos os itens existentes do template
DELETE FROM checklist_template_items 
WHERE template_id = 'ec178e37-bae9-4e06-a2ae-347e0f85bfbe';

-- Inserir os novos itens na ordem especificada
INSERT INTO checklist_template_items (template_id, nome, descricao, ordem) VALUES
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Lanterna traseira e luz de freio', 'Verificar funcionamento das lanternas traseiras e luzes de freio', 1),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Pneus', 'Verificar condições e calibragem dos pneus', 2),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Placa dianteira e traseira', 'Verificar se as placas estão fixadas e legíveis', 3),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Estepe', 'Verificar condições do estepe', 4),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Chave de roda', 'Verificar presença da chave de roda', 5),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Macaco', 'Verificar presença e funcionamento do macaco', 6),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Triângulo', 'Verificar presença do triângulo de sinalização', 7),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Painel de informações', 'Verificar funcionamento do painel de informações', 8),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Limpador de para-brisas', 'Verificar funcionamento dos limpadores', 9),
('ec178e37-bae9-4e06-a2ae-347e0f85bfbe', 'Buzina', 'Verificar funcionamento da buzina', 10);