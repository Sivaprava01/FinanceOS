/**
 * Categorization Service
 *
 * Intelligently categorizes transactions based on merchant names, descriptions,
 * and keywords. Uses pattern matching and merchant mappings to assign appropriate categories.
 *
 * Strategy:
 * 1. Check learned merchant mappings first (user has previously categorized similar merchants)
 * 2. Apply keyword-based rules (common patterns for merchant types)
 * 3. Fall back to "Uncategorized" if no confident match
 */

/**
 * Common merchant keywords and their categories.
 * Used for pattern matching when no explicit merchant mapping exists.
 */
const CATEGORY_RULES = {
  Groceries: [
    /\b(whole foods|kroger|safeway|costco|trader joe's|trader joes|walmart|target|aldi|trader'?s joes|publix|albertsons|sprouts)\b/i,
    /\b(supermarket|grocery|super mart)\b/i,
    /\b(food.*market|market.*food)\b/i,
  ],
  Food: [
    /\b(restaurant|cafe|coffee|pizza|sushi|burger|taco|thai|chinese|indian|italian|mexican|diner|bistro|grill|steakhouse|bbq|ramen|pho|noodle)\b/i,
    /\b(uber.*eats|doordash|grubhub|delivery|eats|food delivery)\b/i,
    /\b(starbucks|dunkin|mcdonald's|mcd's|chick.*fil.*a|chipotle|panera|subway|qdoba|panda express|panda)\b/i,
  ],
  Transportation: [
    /\b(gas|fuel|shell|exxon|chevron|bp|speedway|circle k|valero|murphy|pilot|love's|flying j)\b/i,
    /\b(parking|uber|lyft|taxi|bus|train|metro|transit)\b/i,
    /\b(delta|united|american|southwest|jetblue|frontier|allegiant|spirit)\b/i,
    /\b(amtrak|greyhound)\b/i,
    /\b(auto repair|car wash|gas station|vehicle|car|mechanic)\b/i,
  ],
  Utilities: [
    /\b(electric|electricity|power|gas.*company|water|sewer|trash|garbage|waste|utility)\b/i,
    /\b(verizon|at&t|at\&t|comcast|spectrum|charter|cox|frontier|internet|phone|mobile|wireless)\b/i,
    /\b(southern company|duke energy|con edison|pgm|sce|sdge)\b/i,
  ],
  Entertainment: [
    /\b(netflix|hulu|disney|hbo|amazon prime|apple tv|spotify|youtube|music|concert|movie|cinema|theater|cinema|sporting event)\b/i,
    /\b(steam|xbox|playstation|nintendo|game|epic games|valve)\b/i,
    /\b(museum|zoo|park|amusement)\b/i,
    /\b(bar|nightclub|lounge|pub|tavern|club)\b/i,
  ],
  Shopping: [
    /\b(amazon|ebay|etsy|bestbuy|best buy|macys|macy's|kohl's|nordstrom|saks|bloomingdale's|jcpenney|old navy|gap|h&m|zara|uniqlo|forever 21|shein|wayfair|overstock)\b/i,
    /\b(retail|store|shop|outlet)\b/i,
    /\b(clothing|apparel|fashion|shoes|boots|jacket|pants|shirt|dress)\b/i,
  ],
  Pharmacy: [
    /\b(cvs|walgreens|rite aid|pharmacy|drugstore|doctor|hospital|clinic|medical|dental|dentist|vision|glasses|contacts|medicine)\b/i,
    /\b(gp pharmacy|super pharmacy|local pharmacy)\b/i,
  ],
  Housing: [
    /\b(rent|landlord|property|mortgage|realtor|real estate|home repair|home improvement|home depot|lowes|ace hardware|menards)\b/i,
    /\b(plumbing|electrical|hvac|roofing|contractor)\b/i,
    /\b(insurance)\b/i,
  ],
  Income: [
    /\b(salary|payroll|employer|paycheck|wage|aca|401k|ira)\b/i,
    /\b(freelance|contract|gig|payment)\b/i,
  ],
  Finance: [
    /\b(bank|credit union|investment|broker|financial|bitcoin|crypto|stock|bond)\b/i,
    /\b(transfer|atm|wire|withdrawal|deposit|interest)\b/i,
  ],
  Transfer: [/\b(transfer|p2p|venmo|square cash|square|paypal|zelle|wire|payment to friend)\b/i],
};

/**
 * Categorizes a transaction based on merchant name and description.
 *
 * Strategy:
 * 1. Normalize merchant name
 * 2. Check each category's keyword rules
 * 3. Return first matching category
 * 4. Fall back to "Uncategorized" if no match
 *
 * @param {string} merchant - Merchant name from transaction
 * @param {string} description - Transaction description
 * @param {string} type - "Debit" or "Credit" (used for Income vs Expense)
 * @returns {string} Categorized category name
 */
const categorizeMerchant = (merchant, description = "", type = "Debit") => {
  // Normalize input
  const searchText = `${merchant || ""} ${description || ""}`.toLowerCase();

  if (!searchText.trim()) {
    return "Uncategorized";
  }

  // Special handling for Credit (Income)
  if (type === "Credit") {
    // Check if it looks like income
    if (CATEGORY_RULES.Income.some((rule) => rule.test(searchText))) {
      return "Income";
    }
    // Check if it looks like a transfer (many transfers show as Credits)
    if (CATEGORY_RULES.Transfer.some((rule) => rule.test(searchText))) {
      return "Transfer";
    }
    // Credit but not income/transfer is uncommon, default to "Income"
    return "Income";
  }

  // For Debits, check all expense categories
  for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
    // Skip Income category for debits
    if (category === "Income") continue;

    if (rules.some((rule) => rule.test(searchText))) {
      return category;
    }
  }

  // No match found
  return "Uncategorized";
};

/**
 * Applies categorization to extracted transactions before import.
 * This ensures imported transactions have sensible default categories.
 *
 * @param {Array} transactions - Array of extracted transactions
 * @returns {Array} Transactions with categories assigned
 */
const applyDefaultCategorization = (transactions) => {
  return transactions.map((tx) => ({
    ...tx,
    category: tx.category || categorizeMerchant(tx.merchant, tx.description, tx.type),
  }));
};

export const categorizationService = {
  categorizeMerchant,
  applyDefaultCategorization,
};
