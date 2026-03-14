import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the caller is admin using their token
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: corsHeaders })
    }

    const { action, ...params } = await req.json()

    // LIST users
    if (action === 'list') {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, nome, email, role, departamento, cargo, force_password_change, created_at')
        .order('created_at', { ascending: true })

      return new Response(JSON.stringify({ users: profiles }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // CREATE user
    if (action === 'create') {
      const { email, password, nome, role } = params
      if (!email || !password || !nome) {
        return new Response(JSON.stringify({ error: 'email, password, nome required' }), { status: 400, headers: corsHeaders })
      }

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
      })

      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders })
      }

      // Update role if not default
      const userRole = role || 'visualizador'
      if (userRole !== 'visualizador') {
        await adminClient.from('user_roles').update({ role: userRole }).eq('user_id', authData.user.id)
        await adminClient.from('profiles').update({ role: userRole }).eq('id', authData.user.id)
      }

      // Mark force_password_change
      await adminClient.from('profiles').update({ force_password_change: true }).eq('id', authData.user.id)

      return new Response(JSON.stringify({ user: authData.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // UPDATE ROLE
    if (action === 'update_role') {
      const { user_id, role } = params
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: 'user_id, role required' }), { status: 400, headers: corsHeaders })
      }

      await adminClient.from('user_roles').update({ role }).eq('user_id', user_id)
      await adminClient.from('profiles').update({ role }).eq('id', user_id)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // RESET PASSWORD
    if (action === 'reset_password') {
      const { user_id, new_password } = params
      if (!user_id || !new_password) {
        return new Response(JSON.stringify({ error: 'user_id, new_password required' }), { status: 400, headers: corsHeaders })
      }

      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password })
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
      }

      await adminClient.from('profiles').update({ force_password_change: true }).eq('id', user_id)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // DELETE user
    if (action === 'delete') {
      const { user_id } = params
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: corsHeaders })
      }

      const { error } = await adminClient.auth.admin.deleteUser(user_id)
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
