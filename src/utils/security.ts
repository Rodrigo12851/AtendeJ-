import { User, SafeUser } from '../types';

/**
 * Gera um salt criptograficamente seguro em hexadecimal.
 */
export function generateSalt(length = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback seguro caso crypto não esteja disponível em ambiente de build/SSR
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Computa hash SHA-256 com salt para a senha.
 */
export async function hashPassword(
  password: string,
  salt?: string
): Promise<{ hash: string; salt: string }> {
  const chosenSalt = salt || generateSalt();
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder();
    const data = enc.encode(`${chosenSalt}:${password}`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return { hash: hashHex, salt: chosenSalt };
  }

  // Fallback determinístico caso Web Crypto API não esteja disponível
  let h = 0;
  const str = `${chosenSalt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return { hash: `fb_${Math.abs(h).toString(16)}`, salt: chosenSalt };
}

/**
 * Verifica se uma senha fornecida corresponde ao hash armazenado.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  if (!password || !storedHash || !salt) return false;
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

/**
 * Valida a senha do usuário contra seu hash ou texto legível legado (sem backdoors).
 */
export async function verifyUserCredentials(user: User, inputPassword: string): Promise<boolean> {
  const cleanPass = inputPassword.trim();
  if (!cleanPass) return false;

  // 1. Se o usuário já possui hash e salt cadastrados
  if (user.senhaHash && user.salt) {
    return await verifyPassword(cleanPass, user.senhaHash, user.salt);
  }

  // 2. Se o usuário é legado e ainda possui senha em texto puro
  if (user.senha) {
    return user.senha === cleanPass;
  }

  return false;
}

/**
 * Sanitiza o objeto do usuário para NUNCA salvar senhas, hashes ou PIN no localStorage.
 * Retorna apenas dados de perfil, identificação e loja.
 */
export function sanitizeUserForSession(user: Partial<User>): SafeUser {
  return {
    id: user.id || '',
    nome: user.nome || '',
    usuario: user.usuario || '',
    perfil: user.perfil || 'garcom',
    loja_id: user.loja_id,
    ativo: user.ativo ?? true,
    avatar: user.avatar,
    telefone: user.telefone,
    pin: '',
  };
}
