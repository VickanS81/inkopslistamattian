// Generate an appropriate emoji based on category name
const emojiMappings: Record<string, string> = {
  // Swedish keywords
  'frukt': '🍎',
  'grönsaker': '🥬',
  'gronsaker': '🥬',
  'mejeri': '🥛',
  'kött': '🥩',
  'kott': '🥩',
  'fisk': '🐟',
  'skaldjur': '🦐',
  'skafferi': '🫙',
  'kryddor': '🧂',
  'krydda': '🧂',
  'frys': '❄️',
  'fryst': '❄️',
  'bröd': '🥖',
  'brod': '🥖',
  'bageri': '🥐',
  'dryck': '🥤',
  'drycker': '🥤',
  'godis': '🍬',
  'snacks': '🍿',
  'chips': '🍟',
  'kaffe': '☕',
  'te': '🍵',
  'vin': '🍷',
  'öl': '🍺',
  'ol': '🍺',
  'läsk': '🥤',
  'lask': '🥤',
  'juice': '🧃',
  'glass': '🍦',
  'choklad': '🍫',
  'sylt': '🍯',
  'soppa': '🍲',
  'pasta': '🍝',
  'pizza': '🍕',
  'hushåll': '🏠',
  'hushall': '🏠',
  'städ': '🧹',
  'stad': '🧹',
  'hygien': '🧴',
  'djur': '🐕',
  'husdjur': '🐾',
  'barn': '👶',
  'bebis': '🍼',
  'baby': '🍼',
  'konserv': '🥫',
  'burk': '🥫',
  'nötter': '🥜',
  'notter': '🥜',
  'olja': '🫒',
  'vinäger': '🫙',
  'vinager': '🫙',
  'ris': '🍚',
  'ägg': '🥚',
  'agg': '🥚',
  'smör': '🧈',
  'smor': '🧈',
  'ost': '🧀',
  'bär': '🫐',
  'bar': '🫐',
  'gröt': '🥣',
  'grot': '🥣',
  'müsli': '🥣',
  'musli': '🥣',
  'frukost': '🥣',
  'lunch': '🥪',
  'middag': '🍽️',
  'medicin': '💊',
  'apotek': '💊',
  'blommor': '💐',
  'växter': '🌱',
  'vaxter': '🌱',
  'elektronik': '📱',
  'verktyg': '🔧',
  'kläder': '👕',
  'klader': '👕',
  'skor': '👟',
  'sport': '⚽',
  'träning': '🏋️',
  'traning': '🏋️',
};

// Fallback emojis to use when no match is found
const fallbackEmojis = ['📦', '🛒', '🏷️', '📋', '✨', '🌟', '💫', '🔖'];

export function generateCategoryEmoji(categoryName: string): string {
  const lowerName = categoryName.toLowerCase().trim();
  
  // Check for exact or partial matches
  for (const [keyword, emoji] of Object.entries(emojiMappings)) {
    if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
      return emoji;
    }
  }
  
  // Generate a consistent fallback based on the name
  const hash = lowerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbackEmojis[hash % fallbackEmojis.length];
}

// Common emoji options for manual selection
export const commonCategoryEmojis = [
  '🥬', '🥛', '🥩', '🐟', '🫙', '🧂', '❄️', '🥖', '🥤', '📦',
  '🍎', '🥚', '🧀', '🍝', '🍕', '🍬', '☕', '🍷', '🧹', '🐕',
  '🥫', '🥜', '🍯', '🧃', '🍦', '🍫', '💊', '💐', '🏠', '👶',
];
