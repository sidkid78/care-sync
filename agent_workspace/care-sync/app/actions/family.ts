'use server'

import { createClient } from '@/utils/supabase/server'
import { nanoid } from 'nanoid'

export async function createFamily(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('familyName') as string
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
      return { error: 'Unauthorized' }
  }

  // Generate a unique 8-character invite code
  const inviteCode = nanoid(8).toUpperCase()

  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select()
    .single()

  if (familyError) {
      return { error: familyError.message }
  }

  // Automatically add creator as Primary Caregiver
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({ 
      family_id: family.id, 
      profile_id: user.id, 
      role_in_family: 'primary_caregiver' 
    })

  if (memberError) {
      return { error: memberError.message }
  }

  return { success: true, inviteCode }
}

export async function joinFamily(inviteCode: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
      return { error: 'Unauthorized' }
  }

  // 1. Find family by code
  const { data: family, error: findError } = await supabase
    .from('families')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (findError || !family) {
      return { error: "Invalid Invite Code" }
  }

  // 2. Join family
  const { error: joinError } = await supabase
    .from('family_members')
    .insert({ 
      family_id: family.id, 
      profile_id: user.id, 
      role_in_family: 'member' 
    })

  if (joinError) {
      return { error: "Already a member or join failed" }
  }

  return { success: true }
}
