
export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'recharge' | 'purchase' | 'income' | 'withdrawal' | 'tip_sent' | 'tip_received'
  description: string
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  alipay_account: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface VideoStats {
  videoCount: number
  totalViews: number
  totalDownloads: number
  totalIncome: number
}
