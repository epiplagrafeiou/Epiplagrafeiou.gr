
export interface UnifiedCategory {
  main: string;
  sub: string;
}

// Normalizes the raw category string for easier matching
function normalize(str: string): string {
  if (!str) return "";
  return str.trim().toLowerCase()
    .replace(/[ά]/g, 'a')
    .replace(/[έ]/g, 'ε')
    .replace(/[ή]/g, 'η')
    .replace(/[ίϊΐ]/g, 'ι')
    .replace(/[ό]/g, 'ο')
    .replace(/[ύϋΰ]/g, 'υ')
    .replace(/[ώ]/g, 'ω')
    .replace(/[^a-zα-ω0-9 >]/gi, '');
}

/**
 * Maps a raw category string to a structured, unified category object.
 * @param raw The raw category string from the supplier feed.
 * @returns A UnifiedCategory object with main and sub categories.
 */
export function mapCategoryToObject(raw: string): UnifiedCategory {
  const key = normalize(raw);

  // ΓΡΑΦΕΙΟ
  if (key.includes("γραφει")) return { main: "ΓΡΑΦΕΙΟ", sub: "Γραφεία" };
  if (key.includes("καρεκλες γραφειου")) return { main: "ΓΡΑΦΕΙΟ", sub: "Καρέκλες γραφείου" };
  if (key.includes("βιβλιοθηκ")) return { main: "ΓΡΑΦΕΙΟ", sub: "Βιβλιοθήκες" };
  if (key.includes("συρταριερ")) return { main: "ΓΡΑΦΕΙΟ", sub: "Συρταριέρες" };
  if (key.includes("ντουλαπες") || key.includes("αρχει")) return { main: "ΓΡΑΦΕΙΟ", sub: "Ντουλάπες Αρχείων" };
  if (key.includes("ραφιερ")) return { main: "ΓΡΑΦΕΙΟ", sub: "Ραφιέρες" };
  if (key.includes("reception")) return { main: "ΓΡΑΦΕΙΟ", sub: "Reception Desks" };

  // ΣΑΛΟΝΙ
  if (key.includes("καναπε")) return { main: "ΣΑΛΟΝΙ", sub: "Καναπέδες" };
  if (key.includes("πολυθρον")) return { main: "ΣΑΛΟΝΙ", sub: "Πολυθρόνες" };
  if (key.includes("τραπεζακια")) return { main: "ΣΑΛΟΝΙ", sub: "Τραπεζάκια σαλονιού" };
  if (key.includes("τηλεοραση")) return { main: "ΣΑΛΟΝΙ", sub: "Έπιπλα τηλεόρασης" };
  if (key.includes("συνθεσ")) return { main: "ΣΑΛΟΝΙ", sub: "Συνθέσεις" };
  if (key.includes("σκαμπ")) return { main: "ΣΑΛΟΝΙ", sub: "Σκαμπό & Πουφ" };

  // ΚΡΕΒΑΤΟΚΑΜΑΡΑ
  if (key.includes("κρεβατ")) return { main: "ΚΡΕΒΑΤΟΚΑΜΑΡΑ", sub: "Κρεβάτια" };
  if (key.includes("στρωμα")) return { main: "ΚΡΕΒΑΤΟΚΑΜΑΡΑ", sub: "Στρώματα" };
  if (key.includes("κομοδιν")) return { main: "ΚΡΕΒΑΤΟΚΑΜΑΡΑ", sub: "Κομοδίνα" };
  if (key.includes("συρταριερ")) return { main: "ΚΡΕΒΑΤΟΚΑΜΑΡΑ", sub: "Συρταριέρες" };
  if (key.includes("ντουλαπ")) return { main: "ΚΡΕΒΑΤΟΚΑΜΑΡΑ", sub: "Ντουλάπες" };
  if (key.includes("τουαλετ")) return { main: "ΚΡΕΒΑΤΟΚΑΜΑΡΑ", sub: "Τουαλέτες" };

  // ΤΡΑΠΕΖΑΡΙΑ
  if (key.includes("τραπεζαρια") || key.includes("τραπεζι")) return { main: "ΤΡΑΠΕΖΑΡΙΑ", sub: "Τραπέζια" };
  if (key.includes("καρεκλ") && !key.includes("γραφειου")) return { main: "ΤΡΑΠΕΖΑΡΙΑ", sub: "Καρέκλες" };
  if (key.includes("μπουφε")) return { main: "ΤΡΑΠΕΖΑΡΙΑ", sub: "Μπουφέδες" };
  if (key.includes("βιτριν")) return { main: "ΤΡΑΠΕΖΑΡΙΑ", sub: "Βιτρίνες" };
  if (key.includes("stool") || key.includes("παγκο")) return { main: "ΤΡΑΠΕΖΑΡΙΑ", sub: "Stools" };

  // ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ
  if (key.includes("κηπου") || key.includes("βεραντ")) return { main: "ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ", sub: "Καρέκλες κήπου" };
  if (key.includes("ξαπλωστ")) return { main: "ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ", sub: "Ξαπλώστρες" };
  if (key.includes("σαλονι κηπου")) return { main: "ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ", sub: "Σετ σαλονιού κήπου" };

  // ΦΩΤΙΣΜΟΣ
  if (key.includes("φωτιστικ")) return { main: "ΦΩΤΙΣΜΟΣ", sub: "Γενικά" };
  if (key.includes("led")) return { main: "ΦΩΤΙΣΜΟΣ", sub: "LED" };

  // ΔΙΑΚΟΣΜΗΣΗ
  if (key.includes("διακοσμητικ")) return { main: "ΔΙΑΚΟΣΜΗΣΗ", sub: "Γενικά" };
  if (key.includes("πινακ")) return { main: "ΔΙΑΚΟΣΜΗΣΗ", sub: "Πίνακες" };
  if (key.includes("φυτα")) return { main: "ΔΙΑΚΟΣΜΗΣΗ", sub: "Φυτά" };
  if (key.includes("κερια")) return { main: "ΔΙΑΚΟΣΜΗΣΗ", sub: "Κεριά" };
  if (key.includes("ρολογ")) return { main: "ΔΙΑΚΟΣΜΗΣΗ", sub: "Ρολόγια" };
  if (key.includes("χαλι")) return { main: "ΔΙΑΚΟΣΜΗΣΗ", sub: "Χαλιά" };

  // ΑΞΕΣΟΥΑΡ – ΜΙΚΡΟΕΠΙΠΛΑ
  if (key.includes("ραφιερ")) return { main: "ΑΞΕΣΟΥΑΡ – ΜΙΚΡΟΕΠΙΠΛΑ", sub: "Ραφιέρες" };
  if (key.includes("βοηθητικα τραπεζ")) return { main: "ΑΞΕΣΟΥΑΡ – ΜΙΚΡΟΕΠΙΠΛΑ", sub: "Βοηθητικά τραπέζια" };
  if (key.includes("καλογερ") || key.includes("κρεμαστρ")) return { main: "ΑΞΕΣΟΥΑΡ – ΜΙΚΡΟΕΠΙΠΛΑ", sub: "Καλόγεροι" };
  
  // ΠΡΟΣΦΟΡΕΣ
  if (key.includes("black friday") || key.includes("προσφορες")) return { main: "ΠΡΟΣΦΟΡΕΣ", sub: "Μειωμένη Τιμή" };

  // ΧΡΙΣΤΟΥΓΕΝΝΙΑΤΙΚΑ
  if (key.includes("χριστουγενν")) return { main: "ΧΡΙΣΤΟΥΓΕΝΝΙΑΤΙΚΑ", sub: "Εποχιακά" };

  // Fallback
  return { main: "ΑΛΛΑ", sub: "Uncategorized" };
}

/**
 * Maps a raw category string to a unified string format "MAIN > SUB".
 * @param raw The raw category string from the supplier feed.
 * @returns A formatted category string.
 */
export function mapCategory(raw: string): string {
    const { main, sub } = mapCategoryToObject(raw);
    return `${main} > ${sub}`;
}
