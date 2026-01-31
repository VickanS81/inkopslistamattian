/**
 * Filters out non-ingredient words from a potential ingredient string.
 * Returns true if the string is likely a valid ingredient, false otherwise.
 */

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
  'kokt', 'kokta', 'kokat', 'stekt', 'stekta', 'stekt',
  'färsk', 'färska', 'färskt', 'fryst', 'frysta', 'fryst',
  'varm', 'varma', 'varmt', 'kall', 'kalla', 'kallt',
  'röd', 'röda', 'rött', 'grön', 'gröna', 'grönt',
  'gul', 'gula', 'gult', 'vit', 'vita', 'vitt',
  'hel', 'hela', 'helt',
  
  // Measurements and time
  'ca', 'cirka', 'ungefär', 'minuter', 'minuter', 'minut', 'timme', 'timmar',
  'gram', 'kilo', 'kg', 'dl', 'cl', 'ml', 'l', 'liter', 'msk', 'tsk', 'krm', 'nypa',
  'st', 'stycken', 'styck', 'bit', 'bitar', 'skiva', 'skivor',
  
  // Cooking verbs and instructions
  'tillsätt', 'lägg', 'häll', 'rör', 'blanda', 'stek', 'kok', 'grädda',
  'servera', 'garnera', 'smaka', 'krydda', 'salta', 'peppra',
  
  // Other common non-ingredient words in recipe contexts
  'efter', 'smak', 'behov', 'lite', 'mycket', 'lagom', 'extra',
  'ev', 'eventuellt', 'valfritt', 'alternativt',
]);

// Minimum length for an ingredient (single letters are usually not ingredients)
const MIN_INGREDIENT_LENGTH = 2;

// Maximum length - if it's too long, it's probably a sentence, not an ingredient
const MAX_INGREDIENT_LENGTH = 50;

/**
 * Checks if a string is a valid ingredient
 */
export function isValidIngredient(text: string): boolean {
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

/**
 * Filters an array of ingredients, removing non-ingredient items
 */
export function filterIngredients(ingredients: string[]): string[] {
  return ingredients.filter(isValidIngredient);
}

/**
 * Cleans an ingredient name by removing common prefixes that aren't part of the ingredient
 * For example: "riven morot" -> "morot" (keeping the adjective but could be adjusted)
 * This function preserves the full ingredient description but validates the core ingredient
 */
export function extractCoreIngredient(text: string): string | null {
  const trimmed = text.trim();
  
  // First check if the whole thing is valid
  if (!isValidIngredient(trimmed)) {
    return null;
  }
  
  // If it's a multi-word ingredient, check if at least one word is a valid ingredient
  const words = trimmed.split(/\s+/);
  
  // For single words, we already validated above
  if (words.length === 1) {
    return trimmed;
  }
  
  // For multi-word, check if any word is NOT in the non-ingredient list
  const hasValidIngredientWord = words.some(word => {
    const lowerWord = word.toLowerCase().replace(/[,.:;!?]/g, '');
    return lowerWord.length >= MIN_INGREDIENT_LENGTH && !NON_INGREDIENT_WORDS.has(lowerWord);
  });
  
  if (hasValidIngredientWord) {
    return trimmed;
  }
  
  return null;
}
