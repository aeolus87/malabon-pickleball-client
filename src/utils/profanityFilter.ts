// Tagalog profanity filter
const tagalogBadWords = [
  'puta',
  'putang',
  'putangina',
  'putang ina',
  'tangina',
  'tang ina',
  'gago',
  'gaga',
  'bobo',
  'boba',
  'tanga',
  'tarantado',
  'tarantada',
  'ulol',
  'ulol ka',
  'lintik',
  'lintik ka',
  'leche',
  'lechugas',
  'pakshet',
  'pakyu',
  'pakyu ka',
  'hayop',
  'hayop ka',
  'walanghiya',
  'walang hiya',
  'bastos',
  'bastard',
  'ampota',
  'ampota ka',
  'amp',
  'ampota mo',
  'bwisit',
  'bwisit ka',
  'sira ulo',
  'siraulo',
  'baliw',
  'baliw ka',
  'tanga ka',
  'gago ka',
  'puta ka',
  'putang ina mo',
  'tang ina mo',
  'putangina mo',
  'tangina mo',
];

// English profanity filter
const englishBadWords = [
  'fuck',
  'fucking',
  'fucked',
  'fucker',
  'fuckers',
  'shit',
  'shitting',
  'shitted',
  'asshole',
  'ass',
  'bitch',
  'bitches',
  'bitchy',
  'bastard',
  'bastards',
  'damn',
  'damned',
  'dammit',
  'hell',
  'crap',
  'crappy',
  'piss',
  'pissing',
  'pissed',
  'dick',
  'dicks',
  'cock',
  'cocks',
  'pussy',
  'pussies',
  'whore',
  'whores',
  'slut',
  'sluts',
  'slutty',
  'stupid',
  'idiot',
  'idiots',
  'moron',
  'morons',
  'retard',
  'retarded',
  'retards',
  'gay',
  'fag',
  'fags',
  'faggot',
  'faggots',
  'nigger',
  'niggers',
  'nazi',
  'nazis',
];

// Combine all bad words
const allBadWords = [...tagalogBadWords, ...englishBadWords];

/**
 * Check if text contains profanity (Tagalog or English)
 * @param text - The text to check
 * @returns true if profanity is found, false otherwise
 */
export const containsProfanity = (text: string): boolean => {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase().trim();
  
  // Check against each bad word
  for (const badWord of allBadWords) {
    // Use word boundary matching to avoid false positives
    const regex = new RegExp(`\\b${badWord.replace(/\s+/g, '\\s*')}\\b`, 'i');
    if (regex.test(normalizedText)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get a user-friendly error message for profanity
 */
export const getProfanityErrorMessage = (): string => {
  return 'Please use appropriate language. Profanity is not allowed.';
};

