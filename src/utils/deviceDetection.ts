/**
 * Utilitário de Segurança Forense: Detecção de IP, Dispositivo, Navegador e Análise de Risco de Login
 * Desenvolvido para o AtendeJá para identificar tentativas de invasão, ataques de força bruta
 * e acessos de dispositivos ou endereços de IP desconhecidos.
 */

export interface DeviceInfo {
  ip: string;
  cidade?: string;
  regiao?: string;
  pais?: string;
  dispositivo: string;
  tipoDispositivo: 'desktop' | 'mobile' | 'tablet' | 'desconhecido';
  navegador: string;
  userAgent: string;
}

export interface RiskEvaluation {
  is_novo_ip: boolean;
  is_novo_dispositivo: boolean;
  alerta_risco: 'normal' | 'suspeito' | 'alto_risco';
  detalhe_seguranca: string;
}

/**
 * Faz o parsing do User-Agent para identificar o aparelho e sistema operacional
 */
export function parseUserAgent(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): {
  dispositivo: string;
  tipoDispositivo: 'desktop' | 'mobile' | 'tablet' | 'desconhecido';
  navegador: string;
} {
  if (!ua) {
    return {
      dispositivo: 'Dispositivo Desconhecido',
      tipoDispositivo: 'desconhecido',
      navegador: 'Navegador Web',
    };
  }

  // Detecta Sistema Operacional
  let so = 'Sistema Operacional';
  let tipo: 'desktop' | 'mobile' | 'tablet' | 'desconhecido' = 'desktop';

  if (/Windows NT 10.0/i.test(ua)) so = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) so = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) so = 'Windows 7';
  else if (/Windows/i.test(ua)) so = 'Windows';
  else if (/Android/i.test(ua)) {
    so = 'Android';
    tipo = 'mobile';
  } else if (/iPhone/i.test(ua)) {
    so = 'iPhone (iOS)';
    tipo = 'mobile';
  } else if (/iPad/i.test(ua)) {
    so = 'iPad (iPadOS)';
    tipo = 'tablet';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    so = 'macOS (Apple)';
    tipo = 'desktop';
  } else if (/Linux/i.test(ua)) {
    so = 'Linux';
  }

  // Ajusta se for tablet
  if (/Tablet|iPad/i.test(ua)) {
    tipo = 'tablet';
  } else if (/Mobile|Android|iPhone/i.test(ua)) {
    tipo = 'mobile';
  } else {
    tipo = 'desktop';
  }

  // Detecta Navegador
  let navegador = 'Navegador Web';
  if (/Edg\//i.test(ua)) navegador = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) navegador = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) navegador = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) navegador = 'Apple Safari';
  else if (/Opera|OPR\//i.test(ua)) navegador = 'Opera';

  const iconeTipo = tipo === 'mobile' ? '📱' : tipo === 'tablet' ? '📟' : '💻';
  const dispositivo = `${iconeTipo} ${so}`;

  return { dispositivo, tipoDispositivo: tipo, navegador };
}

// Cache local em memória e sessionStorage para agilidade e economia de chamadas
let memoryIpCache: { ip: string; cidade?: string; regiao?: string; pais?: string } | null = null;
let fetchingIpPromise: Promise<{ ip: string; cidade?: string; regiao?: string; pais?: string }> | null = null;

/**
 * Obtém o endereço de IP público do cliente e geolocalização aproximada
 */
export async function fetchClientIpInfo(): Promise<{
  ip: string;
  cidade?: string;
  regiao?: string;
  pais?: string;
}> {
  if (memoryIpCache) return memoryIpCache;

  try {
    const fromStorage = sessionStorage.getItem('atendeja_detected_ip_v2');
    if (fromStorage) {
      memoryIpCache = JSON.parse(fromStorage);
      return memoryIpCache!;
    }
  } catch {}

  if (fetchingIpPromise) return fetchingIpPromise;

  fetchingIpPromise = (async () => {
    // 1. Tenta ipapi.co (traz IP + Cidade/Estado)
    try {
      const res = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout ? AbortSignal.timeout(2200) : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          const info = {
            ip: String(data.ip).trim(),
            cidade: data.city || undefined,
            regiao: data.region_code || data.region || undefined,
            pais: data.country_name || 'BR',
          };
          memoryIpCache = info;
          try { sessionStorage.setItem('atendeja_detected_ip_v2', JSON.stringify(info)); } catch {}
          return info;
        }
      }
    } catch {}

    // 2. Fallback: ipify.org (rápido e altamente confiável para IP puro)
    try {
      const res = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          const info = { ip: String(data.ip).trim() };
          memoryIpCache = info;
          try { sessionStorage.setItem('atendeja_detected_ip_v2', JSON.stringify(info)); } catch {}
          return info;
        }
      }
    } catch {}

    // 3. Fallback: icanhazip.com
    try {
      const res = await fetch('https://icanhazip.com', {
        signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined,
      });
      if (res.ok) {
        const text = (await res.text()).trim();
        if (text && text.length > 5) {
          const info = { ip: text };
          memoryIpCache = info;
          try { sessionStorage.setItem('atendeja_detected_ip_v2', JSON.stringify(info)); } catch {}
          return info;
        }
      }
    } catch {}

    // Fallback gracioso
    return { ip: 'IP Local / Protegido' };
  })();

  const result = await fetchingIpPromise;
  fetchingIpPromise = null;
  return result;
}

/**
 * Retorna dados completos do cliente para auditoria
 */
export async function getClientDeviceInfo(): Promise<DeviceInfo> {
  const { dispositivo, tipoDispositivo, navegador } = parseUserAgent();
  const ipInfo = await fetchClientIpInfo();

  return {
    ip: ipInfo.ip,
    cidade: ipInfo.cidade,
    regiao: ipInfo.regiao,
    pais: ipInfo.pais,
    dispositivo,
    tipoDispositivo,
    navegador,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

/**
 * Dispara prefetch em background logo ao carregar a página para que o IP já esteja pronto
 */
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetchClientIpInfo().catch(() => {});
  }, 100);
}

/**
 * Avalia se a tentativa de login representa risco de invasão ou novo dispositivo/IP
 */
export function evaluateLoginRisk(
  usuario: string,
  currentDevice: string,
  currentIp: string,
  previousAttempts: Array<{
    usuario: string;
    sucesso: boolean;
    ip_origem?: string;
    dispositivo?: string;
  }>,
  isAdminUser: boolean = false
): RiskEvaluation {
  const cleanUser = usuario.trim().toLowerCase();

  // Histórico de acessos com sucesso do mesmo usuário
  const userSuccessfulAttempts = previousAttempts.filter(
    (a) => a.usuario.toLowerCase() === cleanUser && a.sucesso && a.ip_origem
  );

  // Se nunca logou antes, é o primeiro dispositivo registrado
  if (userSuccessfulAttempts.length === 0) {
    return {
      is_novo_ip: false,
      is_novo_dispositivo: false,
      alerta_risco: 'normal',
      detalhe_seguranca: 'Primeiro acesso ou dispositivo inicial cadastrado',
    };
  }

  // Compara com os IPs e Dispositivos anteriores
  const knownIps = new Set(
    userSuccessfulAttempts
      .map((a) => a.ip_origem?.trim())
      .filter((ip): ip is string => !!ip && ip !== 'IP Local / Protegido' && ip !== 'IP Protegido / Não detectado')
  );

  const knownDevices = new Set(
    userSuccessfulAttempts
      .map((a) => a.dispositivo?.trim())
      .filter((d): d is string => !!d)
  );

  const isCurrentIpValid = currentIp && currentIp !== 'IP Local / Protegido' && currentIp !== 'IP Protegido / Não detectado';
  const isNovoIp = isCurrentIpValid && knownIps.size > 0 && !knownIps.has(currentIp.trim());
  const isNovoDispositivo = currentDevice && knownDevices.size > 0 && !knownDevices.has(currentDevice.trim());

  if (isNovoDispositivo && isNovoIp) {
    return {
      is_novo_ip: true,
      is_novo_dispositivo: true,
      alerta_risco: isAdminUser ? 'alto_risco' : 'suspeito',
      detalhe_seguranca: isAdminUser
        ? `🚨 ALERTA CRÍTICO: Novo Dispositivo (${currentDevice}) e Novo IP (${currentIp}) em conta administrativa!`
        : `⚠️ Novo dispositivo e IP diferente detectados para o usuário (${currentDevice})`,
    };
  }

  if (isNovoDispositivo) {
    const ultimoAparelho = Array.from(knownDevices)[0] || 'aparelho anterior';
    return {
      is_novo_ip: false,
      is_novo_dispositivo: true,
      alerta_risco: isAdminUser ? 'alto_risco' : 'suspeito',
      detalhe_seguranca: `🚨 NOVO DISPOSITIVO: Usuário acostumado em ${ultimoAparelho}, tentando acesso via ${currentDevice}`,
    };
  }

  if (isNovoIp) {
    const ultimoIp = Array.from(knownIps)[0] || 'IP habitual';
    return {
      is_novo_ip: true,
      is_novo_dispositivo: false,
      alerta_risco: isAdminUser ? 'suspeito' : 'normal',
      detalhe_seguranca: `⚠️ IP DIFERENTE: Acesso originado do IP ${currentIp} (IP habitual: ${ultimoIp})`,
    };
  }

  return {
    is_novo_ip: false,
    is_novo_dispositivo: false,
    alerta_risco: 'normal',
    detalhe_seguranca: 'Dispositivo e endereço de IP habituais reconhecidos',
  };
}
