import { CategoryType } from '@/types/shopping';

// Mapping of keywords to categories
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
  dairy: [
    'mjölk', 'grädde', 'vispgrädde', 'matlagningsgrädde', 'créme fraiche', 'creme fraiche',
    'filmjölk', 'yoghurt', 'kvarg', 'ost', 'smör', 'margarin', 'ägg', 'egg', 'cream cheese',
    'färskost', 'cottage cheese', 'mozzarella', 'parmesan', 'cheddar', 'brie', 'feta',
    'halloumi', 'ricotta', 'mascarpone', 'gruyère', 'gouda', 'edamer', 'prästost', 'herrgård',
    'västerbotten', 'adelost', 'getost', 'havredryck', 'sojamjölk', 'mandelmjölk', 'oatly',
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

export function categorizeItem(itemName: string): CategoryType {
  const lowerName = itemName.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'other') continue;
    
    for (const keyword of keywords) {
      if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
        return category as CategoryType;
      }
    }
  }

  return 'other';
}
