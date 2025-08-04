import { SignJWT, jwtVerify } from 'jose'
import { User, LoginCredentials } from '@/types/auth'

// Secret key para assinar os tokens JWT
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.NEXT_PUBLIC_JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
  return new TextEncoder().encode(secret)
}

// Configurações do JWT
const JWT_CONFIG = {
  issuer: 'datahub-enterprise',
  audience: 'datahub-users',
  expiresIn: '24h'
}

/**
 * Cria um token JWT real com os dados do usuário
 */
const createToken = async (user: User): Promise<string> => {
  try {
    const secret = getJwtSecret()
    
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(JWT_CONFIG.issuer)
      .setAudience(JWT_CONFIG.audience)
      .setExpirationTime(JWT_CONFIG.expiresIn)
      .sign(secret)
    
    return token
  } catch (error) {
    console.error('Erro ao criar token JWT:', error)
    throw new Error('Falha na geração do token de autenticação')
  }
}

/**
 * Verifica e decodifica um token JWT
 */
const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const secret = getJwtSecret()
    
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    })
    
    // Verificar se o payload contém os dados necessários
    if (
      typeof payload.id === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.name === 'string'
    ) {
      return {
        id: payload.id,
        email: payload.email,
        name: payload.name
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error)
    return null
  }
}

/**
 * Autentica um usuário com as credenciais fornecidas
 */
export const authenticateUser = async (credentials: LoginCredentials): Promise<{ user: User; token: string } | null> => {
  try {
    // Verificar credenciais contra variáveis de ambiente
    const validEmail = process.env.NEXT_PUBLIC_AUTH_EMAIL || 'admin@datahub.com'
    const validPassword = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'admin123'
    
    if (credentials.email === validEmail && credentials.password === validPassword) {
      const user: User = {
        id: '1',
        email: credentials.email,
        name: 'Administrador DataHub'
      }
      
      const token = await createToken(user)
      
      return { user, token }
    }
    
    return null
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return null
  }
}

/**
 * Valida um token JWT e retorna os dados do usuário
 */
export const validateToken = async (token: string): Promise<User | null> => {
  return await verifyToken(token)
}

/**
 * Remove dados de autenticação do storage local
 */
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('datahub_token')
    localStorage.removeItem('datahub_user')
  }
}

/**
 * Salva dados de autenticação no storage local
 */
export const saveAuthData = (token: string, user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('datahub_token', token)
    localStorage.setItem('datahub_user', JSON.stringify(user))
  }
}

/**
 * Recupera dados de autenticação do storage local
 */
export const getStoredAuthData = (): { token: string; user: User } | null => {
  if (typeof window === 'undefined') return null
  
  const token = localStorage.getItem('datahub_token')
  const userStr = localStorage.getItem('datahub_user')
  
  if (!token || !userStr) return null
  
  try {
    const user = JSON.parse(userStr)
    return { token, user }
  } catch (error) {
    console.error('Erro ao recuperar dados do storage:', error)
    return null
  }
}

/**
 * Utilitário para obter token de autorização formatado para headers HTTP
 */
export const getAuthHeader = (): string | null => {
  const authData = getStoredAuthData()
  return authData ? `Bearer ${authData.token}` : null
}

/**
 * Utilitário para criar headers de autenticação para requisições HTTP
 */
export const createAuthHeaders = (): HeadersInit => {
  const authHeader = getAuthHeader()
  
  if (authHeader) {
    return {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }
  }
  
  return {
    'Content-Type': 'application/json'
  }
}

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const requireAuth = async (): Promise<User | null> => {
  const authData = getStoredAuthData()
  
  if (!authData) return null
  
  const user = await validateToken(authData.token)
  
  if (!user) {
    // Token inválido, limpar storage
    removeToken()
    return null
  }
  
  return user
}