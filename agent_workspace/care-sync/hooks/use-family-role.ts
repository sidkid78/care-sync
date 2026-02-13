import { createClient } from '@/utils/supabase/client'

export async function getFamilyContext(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('family_members')
    .select(`
      role_in_family,
      families (id, name)
    `)
    .eq('profile_id', userId)
    .single()

  return { role: data?.role_in_family, family: data?.families }
}
