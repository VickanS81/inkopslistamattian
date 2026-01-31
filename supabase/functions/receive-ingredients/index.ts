import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category keywords for auto-categorization (same as frontend)
type CategoryType = 'vegetables' | 'dairy' | 'meat' | 'fish' | 'pantry' | 'spices' | 'frozen' | 'bakery' | 'drinks' | 'other';

// Common Swedish words that are NOT ingredients
const NON_INGREDIENT_WORDS = new Set([
  // Conjunctions and prepositions
  'och', 'eller', 'samt', 'med', 'i', 'på', 'till', 'för', 'av', 'om', 'från',
  
  // Articles
  'en', 'ett', 'den', 'det', 'de',
  
  // Adjectives commonly found in recipes that aren't ingredients
  'stor', 'stora', 'liten', 'lilla', 'små', 'litet',
  'fin', 'fina', 'finare', 'finast',
  'riven', 'rivna', 'rivet', 'hackad', 'hackade', 'hackat',
  'skivad', 'skivade', 'skivat', 'tärnad', 'tärnade', 'tärnat',
  'strimlad', 'strimlade', 'strimlat',
  'kokt', 'kokta', 'kokat', 'stekt', 'stekta',
  'färsk', 'färska', 'färskt', 'fryst', 'frysta',
  'varm', 'varma', 'varmt', 'kall', 'kalla', 'kallt',
  'röd', 'röda', 'rött', 'grön', 'gröna', 'grönt',
  'gul', 'gula', 'gult', 'vit', 'vita', 'vitt',
  'hel', 'hela', 'helt',
  
  // Measurements and time
  'ca', 'circa', 'cirka', 'ungefär', 'minuter', 'minut', 'timme', 'timmar',
  'gram', 'kilo', 'kg', 'dl', 'cl', 'ml', 'l', 'liter', 'msk', 'tsk', 'krm', 'nypa',
  'st', 'stycken', 'styck', 'bit', 'bitar', 'skiva', 'skivor',
  
  // Cooking verbs and instructions
  'tillsätt', 'lägg', 'häll', 'rör', 'blanda', 'stek', 'kok', 'grädda',
  'servera', 'garnera', 'smaka', 'krydda', 'salta', 'peppra',
  
  // Other common non-ingredient words in recipe contexts
  'efter', 'smak', 'behov', 'lite', 'mycket', 'lagom', 'extra',
  'ev', 'eventuellt', 'valfritt', 'alternativt',
]);

// Minimum/maximum length for an ingredient
const MIN_INGREDIENT_LENGTH = 2;
const MAX_INGREDIENT_LENGTH = 50;

/**
 * Checks if a string is a valid ingredient (filters out "och", "stor", etc.)
 */
function isValidIngredient(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  
  // Too short or too long
  if (trimmed.length < MIN_INGREDIENT_LENGTH || trimmed.length > MAX_INGREDIENT_LENGTH) {
    return false;
  }
  
  // Check if it's just a non-ingredient word
  if (NON_INGREDIENT_WORDS.has(trimmed)) {
    return false;
  }
  
  // Check if it's just a number (possibly with unit)
  if (/^[\d,.]+\s*(g|kg|dl|cl|ml|l|msk|tsk|krm|st)?$/.test(trimmed)) {
    return false;
  }
  
  // Check if it contains mostly non-alphabetic characters
  const letterCount = (trimmed.match(/[a-zåäö]/gi) || []).length;
  if (letterCount < trimmed.length * 0.5) {
    return false;
  }
  
  return true;
}

const categoryKeywords: Record<CategoryType, string[]> = {
  vegetables: [
    'äpple', 'banan', 'apelsin', 'citron', 'lime', 'druvor', 'päron', 'kiwi', 'mango', 'ananas',
    'jordgubbar', 'hallon', 'blåbär', 'avokado', 'tomat', 'tomater', 'gurka', 'sallad', 'spenat',
    'broccoli', 'blomkål', 'morot', 'morötter', 'potatis', 'lök', 'vitlök', 'paprika', 'squash',
    'zucchini', 'aubergine', 'sparris', 'böngroddar', 'champinjoner', 'svamp', 'rädisa',
    'selleri', 'purjolök', 'rödkål', 'vitkål', 'grönkål', 'mangold', 'ruccola', 'persilja',
    'dill', 'basilika', 'koriander', 'mynta', 'frukt', 'grönsaker', 'bär', 'melon', 'vattenmelon',
    'nektarin', 'persika', 'plommon', 'körsbär', 'granatäpple', 'fikon', 'dadlar', 'ingefära',
    'rödbetor', 'kålrot', 'palsternacka', 'fänkål', 'kronärtskocka',
  ],
  // Pantry checked before dairy to ensure kokosmjölk matches here first
  pantry: [
    'pasta', 'ris', 'nudlar', 'couscous', 'bulgur', 'quinoa', 'linser', 'bönor', 'kikärtor',
    'mjöl', 'vetemjöl', 'rågsikt', 'grahamsmjöl', 'bakpulver', 'bikarbonat', 'jäst',
    'socker', 'florsocker', 'strösocker', 'vaniljsocker', 'sirap', 'honung', 'lönnsirap',
    'olja', 'olivolja', 'rapsolja', 'solrosolja', 'kokosolja', 'vinäger', 'balsamico',
    'soja', 'sojasås', 'ketchup', 'senap', 'majonnäs', 'sriracha', 'tabasco', 'worcestershire',
    'tomatpuré', 'krossade tomater', 'passerade tomater', 'kokosmjölk', 'kokosgrädde',
    'buljong', 'fond', 'nötter', 'mandlar', 'valnötter', 'hasselnötter', 'cashewnötter',
    'jordnötter', 'frön', 'solrosfrön', 'pumpafrön', 'sesamfrön', 'chiafrön', 'linfrön',
    'havregryn', 'müsli', 'flingor', 'cornflakes', 'granola', 'russin', 'katrinplommon',
    'aprikos', 'tranbär', 'kokos', 'choklad', 'kakao', 'kakaopulver', 'nutella',
    'jordnötssmör', 'sylt', 'marmelad', 'konserver', 'burk', 'konserv',
    'oliver', 'svarta oliver', 'gröna oliver', 'kalamata',
    'spagetti', 'spaghetti', 'makaroner', 'penne', 'fusilli', 'tagliatelle', 'lasagne',
  ],
  dairy: [
    'grädde', 'vispgrädde', 'matlagningsgrädde', 'créme fraiche', 'creme fraiche',
    'filmjölk', 'yoghurt', 'kvarg', 'ost', 'smör', 'margarin', 'ägg', 'egg', 'cream cheese',
    'färskost', 'cottage cheese', 'mozzarella', 'parmesan', 'cheddar', 'brie', 'feta',
    'halloumi', 'ricotta', 'mascarpone', 'gruyère', 'gouda', 'edamer', 'prästost', 'herrgård',
    'västerbotten', 'adelost', 'getost', 'havredryck', 'sojamjölk', 'mandelmjölk', 'oatly',
    'mjölk', 'lättmjölk', 'mellanmjölk', 'standardmjölk',
  ],
  meat: [
    'kött', 'nötkött', 'fläskkött', 'kycklingfilé', 'kyckling', 'kalkon', 'lamm', 'vilt',
    'bacon', 'korv', 'falukorv', 'prinskorv', 'chorizo', 'salami', 'skinka', 'köttfärs',
    'färs', 'blandfärs', 'nötfärs', 'fläskfärs', 'kycklingfärs', 'kotlett', 'schnitzel',
    'biff', 'entrecote', 'oxfilé', 'fläskfilé', 'kycklingben', 'kycklingklubba', 'vingar',
    'lever', 'hjärta', 'tunga', 'blodpudding', 'kassler', 'rostbiff', 'pastrami',
  ],
  fish: [
    'fisk', 'lax', 'torsk', 'sej', 'kolja', 'rödspätta', 'flundra', 'makrill', 'sill',
    'strömming', 'abborre', 'gädda', 'gös', 'öring', 'forell', 'tonfisk', 'sardiner',
    'ansjovis', 'räkor', 'kräftor', 'hummer', 'krabba', 'musslor', 'bläckfisk', 'calamari',
    'skaldjur', 'kaviar', 'rom', 'gravad', 'rökt lax', 'fiskpinnar', 'fiskbullar',
  ],
  spices: [
    'salt', 'peppar', 'svartpeppar', 'vitpeppar', 'paprikapulver', 'chili', 'cayenne',
    'curry', 'gurkmeja', 'kumin', 'spiskummin', 'kanel', 'kardemumma', 'ingefära',
    'muskot', 'kryddnejlika', 'anis', 'stjärnanis', 'vanilj', 'vaniljstång', 'saffran',
    'timjan', 'oregano', 'basilika', 'rosmarin', 'salvia', 'lagerblad', 'dill', 'persilja',
    'gräslök', 'dragon', 'koriander', 'mynta', 'citronpeppar', 'vitlökspulver',
    'lökpulver', 'grillkrydda', 'tacokrydda', 'cajunkrydda', 'kycklingkrydda', 'fiskekrydda',
    'örtsalt', 'citronpeppar', 'kryddor', 'krydda',
  ],
  frozen: [
    'fryst', 'frysta', 'glass', 'glasspinne', 'piggelin', 'frysta bär', 'frysta grönsaker',
    'frysta ärtor', 'pommes', 'pommes frites', 'frysta räkor', 'fryspizza', 'fryslåda',
    'köttbullar', 'fiskpinnar', 'laxfilé', 'kycklingnuggets', 'vårrullar', 'färdig middag',
  ],
  bakery: [
    'bröd', 'limpa', 'franskbröd', 'baguette', 'ciabatta', 'focaccia', 'tunnbröd', 'pitabröd',
    'tortilla', 'wraps', 'hamburgerbröd', 'korvbröd', 'vetebröd', 'kanelbulle', 'bulle',
    'croissant', 'danish', 'wienerbröd', 'muffins', 'scones', 'kaka', 'tårta', 'chokladboll',
    'knäckebröd', 'skorpor', 'kex', 'småkakor', 'pepparkakor', 'rågbröd', 'surdegsbröd',
  ],
  drinks: [
    'vatten', 'mineralvatten', 'kolsyrat', 'läsk', 'coca-cola', 'fanta', 'sprite', 'pepsi',
    'juice', 'apelsinjuice', 'äppeljuice', 'nektar', 'smoothie', 'saft', 'must', 'julmust',
    'påskmust', 'kaffe', 'te', 'chai', 'espresso', 'cappuccino', 'latte', 'energidryck',
    'sportdryck', 'öl', 'vin', 'cider', 'alkoholfri', 'kombucha', 'tonic', 'dryck',
  ],
  other: [],
};

// Prefixes that indicate vegetarian products (should not be categorized as meat)
const vegetarianPrefixes = ['vego', 'veg', 'vegetarisk', 'vegansk'];

function isVegetarianProduct(itemName: string): boolean {
  const lowerName = itemName.toLowerCase().trim();
  return vegetarianPrefixes.some(prefix => lowerName.startsWith(prefix));
}

function categorizeItem(itemName: string): CategoryType {
  const lowerName = itemName.toLowerCase().trim();

  // Check if it's a vegetarian product - these should go to 'other' and not match meat
  const isVegetarian = isVegetarianProduct(itemName);

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'other') continue;
    
    // Skip meat category for vegetarian products
    if (category === 'meat' && isVegetarian) continue;
    
    for (const keyword of keywords) {
      if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
        return category as CategoryType;
      }
    }
  }

  return 'other';
}

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

    // Check user's auto_categorize setting
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('auto_categorize')
      .eq('user_id', userId)
      .maybeSingle();

    const autoCategorize = userSettings?.auto_categorize ?? false;
    console.log('Auto categorize setting:', autoCategorize);

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

    // Filter out non-ingredient words like "och", "stor", etc.
    const validIngredients = ingredients.filter((ingredient: string) => {
      const isValid = isValidIngredient(ingredient);
      if (!isValid) {
        console.log(`Filtered out non-ingredient: "${ingredient}"`);
      }
      return isValid;
    });

    console.log(`Filtered ${ingredients.length - validIngredients.length} non-ingredients, ${validIngredients.length} valid ingredients remaining`);

    // Prepare items to insert - categorize if auto_categorize is enabled
    const itemsToInsert = validIngredients.map((ingredient: string) => {
      const name = ingredient.trim();
      const category = autoCategorize ? categorizeItem(name) : 'other';
      return {
        list_id: list_id,
        name,
        category,
        quantity: '1',
        checked: false,
        created_by: userId,
      };
    });

    console.log('Inserting items:', itemsToInsert.length);
    if (autoCategorize) {
      const categoryCounts: Record<string, number> = {};
      itemsToInsert.forEach(item => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      });
      console.log('Category distribution:', categoryCounts);
    }

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

    const message = autoCategorize 
      ? `${addedCount} ingredienser tillagda och kategoriserade`
      : `${addedCount} ingredienser tillagda i Övrigt`;

    return new Response(
      JSON.stringify({
        success: true,
        added: addedCount,
        auto_categorized: autoCategorize,
        message
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
