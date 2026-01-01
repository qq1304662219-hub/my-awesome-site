
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('Checking videos table...')

  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing')

  // 1. Try to fetch just one published video (only category, no style)
  const { data: testData, error: testError } = await supabase
    .from('videos')
    .select('id, title, status, category')
    .eq('status', 'published')
    .limit(1)

  if (testError) {
      console.error('Error fetching published video (category check):', testError)
  } else {
      console.log('Successfully fetched published video with category:', testData)
  }

  // 2. Count by status (if allowed)
  const { data: statusData, error: statusError } = await supabase
    .from('videos')
    .select('status')
  
  if (statusError) {
     console.error('Error fetching all statuses (RLS might block this):', statusError)
  } else {
     console.log('Found videos:', statusData.length)
     const statusCounts = statusData.reduce((acc: any, curr: any) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    }, {})
    console.log('Videos by status:', statusCounts)
  }


  // 3. Check categories/styles for published videos
  const { data: publishedVideos, error: pubError } = await supabase
    .from('videos')
    .select('category, style, ratio')
    .eq('status', 'published')

  if (pubError) {
    console.error('Error fetching published videos:', pubError)
  } else {
    const categories = new Set(publishedVideos.map((v: any) => v.category))
    const styles = new Set(publishedVideos.map((v: any) => v.style))
    const ratios = new Set(publishedVideos.map((v: any) => v.ratio))

    console.log('Distinct Categories (Published):', Array.from(categories))
    console.log('Distinct Styles (Published):', Array.from(styles))
    console.log('Distinct Ratios (Published):', Array.from(ratios))
  }
}

checkData()
