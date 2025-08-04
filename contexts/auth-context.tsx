"use client"

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { AuthState, AuthContextType, LoginCredentials, User } from '@/types/auth'
import { authenticateUser, validateToken, removeToken, saveAuthData, getStoredAuthData } from '@/lib/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'CHECK_AUTH'; payload: { user: User; token: string } | null }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true
      }
    case 'LOGIN_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false
      }
    case 'LOGIN_ERROR':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      }
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      }
    case 'CHECK_AUTH':
      if (action.payload) {
        return {
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          isLoading: false
        }
      }
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      }
    default:
      return state
  }
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'LOGIN_START' })

    try {
      const result = await authenticateUser(credentials)
      
      if (result) {
        saveAuthData(result.token, result.user)
        dispatch({ type: 'LOGIN_SUCCESS', payload: result })
        return { success: true }
      } else {
        dispatch({ type: 'LOGIN_ERROR' })
        return { success: false, error: 'Email ou senha inválidos' }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      dispatch({ type: 'LOGIN_ERROR' })
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  const logout = () => {
    removeToken()
    dispatch({ type: 'LOGOUT' })
  }

  const checkAuth = async () => {
    const storedData = getStoredAuthData()
    
    if (storedData) {
      // Validar se o token ainda é válido usando JWT real
      const user = await validateToken(storedData.token)
      if (user) {
        dispatch({ type: 'CHECK_AUTH', payload: storedData })
        return
      } else {
        // Token inválido, remover dados
        removeToken()
      }
    }
    
    dispatch({ type: 'CHECK_AUTH', payload: null })
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}