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

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Only POST requests allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { api_key, list_id, ingredients, source } = body;

    console.log('Received request from source:', source || 'unknown');
    console.log('List ID:', list_id);
    console.log('Number of ingredients:', ingredients?.length || 0);

    // Validate required fields
    if (!api_key) {
      console.log('Missing api_key');
      return new Response(
        JSON.stringify({ success: false, error: 'api_key required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!list_id) {
      console.log('Missing list_id');
      return new Response(
        JSON.stringify({ success: false, error: 'list_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      console.log('Missing or empty ingredients array');
      return new Response(
        JSON.stringify({ success: false, error: 'ingredients array required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('user_api_keys')
      .select('user_id')
      .eq('api_key', api_key)
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

    // Verify user has access to the list (owner or member)
    const { data: listAccess, error: accessError } = await supabase
      .from('shopping_lists')
      .select('id, owner_id')
      .eq('id', list_id)
      .maybeSingle();

    if (accessError) {
      console.error('Error checking list access:', accessError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!listAccess) {
      console.log('List not found:', list_id);
      return new Response(
        JSON.stringify({ success: false, error: 'List not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is owner
    let hasAccess = listAccess.owner_id === userId;

    // If not owner, check if member
    if (!hasAccess) {
      const { data: memberData } = await supabase
        .from('list_members')
        .select('id')
        .eq('list_id', list_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      hasAccess = !!memberData;
    }

    if (!hasAccess) {
      console.log('User does not have access to list');
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied to this list' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare items to insert - all go to "other" category
    const itemsToInsert = ingredients.map((ingredient: string) => ({
      list_id: list_id,
      name: ingredient.trim(),
      category: 'other',
      quantity: '1',
      checked: false,
      created_by: userId,
    }));

    console.log('Inserting items:', itemsToInsert.length);

    // Insert all items
    const { data: insertedItems, error: insertError } = await supabase
      .from('shopping_items')
      .insert(itemsToInsert)
      .select('id');

    if (insertError) {
      console.error('Error inserting items:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error adding ingredients' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const addedCount = insertedItems?.length || 0;
    console.log(`Successfully added ${addedCount} ingredients`);

    return new Response(
      JSON.stringify({
        success: true,
        added: addedCount,
        message: `${addedCount} ingredienser tillagda i Övrigt`
      }),
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
