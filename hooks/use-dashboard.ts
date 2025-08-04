"use client"

import { useState, useEffect, useCallback } from 'react'
import { DashboardAPI } from '@/lib/dashboard-api'
import { DashboardStats, RecentActivity, ActivitySummary } from '@/types/dashboard'
import { useToast } from '@/hooks/use-toast'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [statsData, activityData, summaryData] = await Promise.all([
        DashboardAPI.getDashboardStats(),
        DashboardAPI.getRecentActivity(6),
        DashboardAPI.getActivitySummary()
      ])

      setStats(statsData)
      setRecentActivity(activityData)
      setActivitySummary(summaryData)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar dashboard'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }, [])

  const formatGrowthTrend = useCallback((rate: number): string => {
    if (rate > 0) return `+${rate}% este mês`
    if (rate < 0) return `${rate}% este mês`
    return 'Sem mudanças'
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  return {
    stats,
    recentActivity,
    activitySummary,
    loading,
    formatFileSize,
    formatGrowthTrend,
    refresh: loadDashboardData
  }
}