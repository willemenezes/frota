/**
 * Traduz mensagens de erro do Supabase para português
 */
export function translateSupabaseError(error: any, defaultMessage: string = "Ocorreu um erro"): string {
  if (!error || !error.message) {
    return defaultMessage;
  }

  const message = error.message.toLowerCase();

  // Erros de tabela não encontrada
  if (message.includes("could not find the table") || message.includes("does not exist")) {
    return "Tabela não encontrada. Verifique se o banco de dados está configurado corretamente.";
  }

  // Erros de permissão e RLS
  if (message.includes("permission denied") || 
      message.includes("new row violates row-level security") ||
      message.includes("row-level security")) {
    return "Você não tem permissão para realizar esta ação.";
  }

  // Erros de chave duplicada
  if (message.includes("duplicate key") || message.includes("already exists")) {
    return "Este registro já existe no sistema.";
  }

  // Erros de foreign key
  if (message.includes("violates foreign key constraint")) {
    return "Dados inválidos. Verifique se os dados relacionados são válidos.";
  }

  // Erros de not null
  if (message.includes("violates not-null constraint") || message.includes("null value")) {
    return "Todos os campos obrigatórios devem ser preenchidos.";
  }

  // Erros de autenticação
  if (message.includes("invalid login credentials") || message.includes("email not confirmed")) {
    return "Email ou senha incorretos.";
  }

  if (message.includes("user not found")) {
    return "Usuário não encontrado.";
  }

  if (message.includes("email rate limit exceeded")) {
    return "Muitas tentativas. Tente novamente em alguns minutos.";
  }

  // Erros de storage
  if (message.includes("storage") && message.includes("not found")) {
    return "Arquivo não encontrado no servidor.";
  }

  if (message.includes("file too large") || message.includes("exceeds maximum")) {
    return "Arquivo muito grande. Verifique o tamanho máximo permitido.";
  }

  // Erro genérico
  return error.message || defaultMessage;
}

