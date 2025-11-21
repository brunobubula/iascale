/**
 * CONTROLE DE ACESSO CENTRALIZADO
 * 
 * Este arquivo define as regras de acesso para todos os recursos do sistema.
 * Importe estas funções em qualquer componente que precise verificar permissões.
 * 
 * REGRAS PRINCIPAIS:
 * 1. Admin: acesso total sempre
 * 2. Plano INFINITY PRO/ENTERPRISE ATIVO: acesso ilimitado (créditos ignorados)
 * 3. Plano INFINITY PRO/ENTERPRISE VENCIDO + Créditos >= 10: acesso INFINITY PRO dinâmico
 * 4. Créditos >= 10 (sem plano infinity ativo): acesso INFINITY PRO dinâmico
 * 5. Planos PRO/PRO+ com créditos: soma limites do plano + créditos
 */

/**
 * Verifica se o usuário tem acesso de nível INFINITY PRO
 * @param {Object} user - Objeto do usuário
 * @returns {boolean} - true se tem acesso INFINITY PRO
 */
export function hasInfinityProAccess(user) {
  if (!user) return false;
  
  // Admin: sempre tem acesso total
  if (user.role === "admin") return true;
  
  // Verifica se tem plano INFINITY PRO ou ENTERPRISE ATIVO
  const isPro = user.is_pro || false;
  const planType = user.pro_plan_type || 'free';
  const proExpiration = user.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
  const isProActive = isPro && (!proExpiration || proExpiration > new Date());
  
  // Se tem INFINITY PRO ou ENTERPRISE ATIVO: acesso garantido (créditos não importam)
  if (isProActive && (planType === 'infinity_pro' || planType === 'enterprise')) {
    return true;
  }
  
  // Se não tem plano infinity ativo OU tem plano infinity vencido: créditos >= 10 garantem acesso
  const hasCredits = (user.account_credit_balance || 0) >= 10;
  return hasCredits;
}

/**
 * Hook React para verificar acesso INFINITY PRO
 * @param {Object} user - Objeto do usuário do useQuery
 * @returns {boolean} - true se tem acesso INFINITY PRO
 */
export function useInfinityProAccess(user) {
  return hasInfinityProAccess(user);
}

/**
 * Verifica se o usuário é admin
 * @param {Object} user - Objeto do usuário
 * @returns {boolean} - true se é admin
 */
export function isAdmin(user) {
  return user?.role === "admin";
}

/**
 * Verifica se o usuário tem algum plano PRO ativo
 * @param {Object} user - Objeto do usuário
 * @returns {boolean} - true se tem plano PRO ativo
 */
export function hasActiveProPlan(user) {
  if (!user) return false;
  
  const isPro = user.is_pro || false;
  const proExpiration = user.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
  const isProActive = isPro && (!proExpiration || proExpiration > new Date());
  
  return isProActive;
}

/**
 * Retorna o plano efetivo do usuário considerando créditos
 * @param {Object} user - Objeto do usuário
 * @returns {string} - 'free', 'pro', 'pro_plus', 'infinity_pro', 'enterprise'
 */
export function getEffectivePlan(user) {
  if (!user) return 'free';
  
  if (user.role === "admin") return 'infinity_pro';
  
  // Verifica plano ativo primeiro
  const isPro = user.is_pro || false;
  const planType = user.pro_plan_type || 'free';
  const proExpiration = user.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
  const isProActive = isPro && (!proExpiration || proExpiration > new Date());
  
  // Se tem INFINITY PRO ou ENTERPRISE ATIVO: retorna o plano
  if (isProActive && (planType === 'infinity_pro' || planType === 'enterprise')) {
    return planType;
  }
  
  // Se não tem plano infinity ativo: créditos >= 10 dão INFINITY PRO
  const hasCredits = (user.account_credit_balance || 0) >= 10;
  if (hasCredits) return 'infinity_pro';
  
  // Retorna plano atual ou free
  return isProActive ? planType : 'free';
}