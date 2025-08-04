export interface DashboardStats {
  total_datasets: number
  total_records: number
  total_size: number
  processed_files: number
  growth_rate: number
  active_users: number
}

export interface RecentActivity {
  id: string
  action: string
  file_name: string
  user_name: string
  timestamp: string
  status: 'success' | 'error' | 'warning'
  details?: string
}

export interface ActivitySummary {
  actions_today: number
  uploads_today: number
  reports_this_week: number
  success_rate: number
}