import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get('api_key');

    if (!apiKey) {
      console.log('Missing api_key parameter');
      return new Response(
        JSON.stringify({ success: false, error: 'api_key parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Looking up user for API key');

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .maybeSingle();

    if (apiKeyError) {
      console.error('Error looking up API key:', apiKeyError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKeyData) {
      console.log('Invalid API key');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = apiKeyData.user_id;
    console.log('Found user:', userId);

    // Get user's own lists
    const { data: ownedLists, error: ownedError } = await supabase
      .from('shopping_lists')
      .select('id, name, created_at')
      .eq('owner_id', userId);

    if (ownedError) {
      console.error('Error fetching owned lists:', ownedError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error fetching lists' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lists user is a member of
    const { data: memberLists, error: memberError } = await supabase
      .from('list_members')
      .select('list_id, shopping_lists(id, name, created_at)')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching member lists:', memberError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error fetching shared lists' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine and format lists
    const lists = [
      ...(ownedLists || []).map(l => ({ id: l.id, name: l.name, owned: true })),
      ...(memberLists || [])
        .filter(m => m.shopping_lists)
        .map(m => {
          const list = m.shopping_lists as unknown as { id: string; name: string; created_at: string };
          return { id: list.id, name: list.name, owned: false };
        })
    ];

    console.log(`Returning ${lists.length} lists for user`);

    return new Response(
      JSON.stringify({ success: true, lists }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
