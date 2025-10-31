-- Adiciona o valor 'concluido' ao enum checklist_status
ALTER TYPE checklist_status ADD VALUE IF NOT EXISTS 'concluido';