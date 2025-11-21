
'use client';

// Function to normalize category strings for more reliable matching.
function normalize(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// The main mapping logic for categories.
export async function mapCategory(rawCategory: string, productName: string = ''): Promise<string> {
  const normalizedRaw = normalize(rawCategory);
  const normalizedProduct = normalize(productName);

  // --- ΓΡΑΦΕΙΟ ---
  if (normalizedRaw.includes('καρέκλες γραφείου')) return 'ΓΡΑΦΕΙΟ > Καρέκλες γραφείου';
  if (normalizedRaw.includes('καρέκλες διευθυντή')) return 'ΓΡΑΦΕΙΟ > Καρέκλες γραφείου > Διευθυντικές';
  if (normalizedRaw.includes('gaming')) return 'ΓΡΑΦΕΙΟ > Καρέκλες γραφείου > Gaming';
  if (normalizedRaw.includes('καρέκλες εργασίας')) return 'ΓΡΑΦΕΙΟ > Καρέκλες γραφείου > Εργασίας';
  if (normalizedRaw.includes('καρέκλες επισκέπτη')) return 'ΓΡΑΦΕΙΟ > Καρέκλες Επισκέπτη';
  if (normalizedRaw.includes('γραφεία')) return 'ΓΡΑΦΕΙΟ > Γραφεία';
  if (normalizedRaw.includes('συρταριέρες γραφείου')) return 'ΓΡΑΦΕΙΟ > Συρταριέρες Γραφείου';
  if (normalizedRaw.includes('βιβλιοθήκες')) return 'ΓΡΑΦΕΙΟ > Βιβλιοθήκες';
  if (normalizedRaw.includes('ραφιέρες') && normalizedRaw.includes('γραφειο')) return 'ΓΡΑΦΕΙΟ > Ραφιέρες / Αποθηκευτικά Κουτιά';
  if (normalizedRaw.includes('ντουλάπια γραφείου')) return 'ΓΡΑΦΕΙΟ > Ντουλάπες';
  if (normalizedRaw.includes('ανταλλακτικά')) return 'ΓΡΑΦΕΙΟ > Ανταλλακτικά';
  if (normalizedRaw.includes('reception')) return 'ΓΡΑΦΕΙΟ > Γραφεία υποδοχής / Reception';

  // --- ΣΑΛΟΝΙ ---
  if (normalizedRaw.includes('καναπέδες γωνιακοί')) return 'ΣΑΛΟΝΙ > Καναπέδες > Γωνιακοί καναπέδες';
  if (normalizedRaw.includes('καναπέδες - κρεβάτι')) return 'ΣΑΛΟΝΙ > Καναπέδες > Καναπές Κρεβάτι';
  if (normalizedRaw.includes('καναπέδες') && normalizedRaw.includes('σαλονι')) return 'ΣΑΛΟΝΙ > Καναπέδες';
  if (normalizedRaw.includes('πολυθρόνες σαλονιού')) return 'ΣΑΛΟΝΙ > Πολυθρόνες';
  if (normalizedRaw.includes('πολυθρόνες - κρεβάτι')) return 'ΣΑΛΟΝΙ > Πολυθρόνες';
  if (normalizedProduct.includes('καρέκλες') && normalizedRaw.includes('καρέκλες & πολυθρόνες > σαλόνι')) return 'ΣΑΛΟΝΙ > Καρέκλες τραπεζαρίας';
  if (normalizedProduct.includes('καρέκλες') && normalizedRaw.includes('καρέκλες - πολυθρόνες τραπεζαρίας')) return 'ΣΑΛΟΝΙ > Καρέκλες τραπεζαρίας';
  if (normalizedRaw.includes('τραπέζια') && !normalizedRaw.includes('σαλονιού') && !normalizedRaw.includes('βοηθητικά')) return 'ΣΑΛΟΝΙ > Τραπέζια';
  if (normalizedRaw.includes('τραπεζάκια σαλονιού')) return 'ΣΑΛΟΝΙ > Τραπεζάκια σαλονιού';
  if (normalizedRaw.includes('τραπεζάκια βοηθητικά')) return 'ΣΑΛΟΝΙ > Τραπεζάκια Βοηθητικά';
  if (normalizedRaw.includes('τραπεζάκια σαλονιού') && normalizedRaw.includes('σαλονι')) return 'ΣΑΛΟΝΙ > Τραπεζάκια Βοηθητικά';
  if (normalizedRaw.includes('έπιπλα τηλεόρασης')) return 'ΣΑΛΟΝΙ > Έπιπλα τηλεόρασης';
  if (normalizedRaw.includes('συνθέσεις σαλονιού')) return 'ΣΑΛΟΝΙ > Συνθέσεις Σαλονιού';
  if (normalizedRaw.includes('έπιπλα εισόδου')) return 'ΣΑΛΟΝΙ > Έπιπλα Εισόδου';
  if (normalizedRaw.includes('παπουτσοθήκες')) return 'ΣΑΛΟΝΙ > Παπουτσοθήκες';
  if (normalizedRaw.includes('μπουφέδες')) return 'ΣΑΛΟΝΙ > Μπουφέδες';
  if (normalizedRaw.includes('κονσόλες')) return 'ΣΑΛΟΝΙ > Κονσόλες';
  if (normalizedRaw.includes('σκαμπώ μπαρ')) return 'ΣΑΛΟΝΙ > Σκαμπώ μπαρ';
  if (normalizedRaw.includes('σκαμπό & πουφ')) return 'ΣΑΛΟΝΙ > Πουφ & Σκαμπό';
  if (normalizedRaw.includes('σκαμπώ') && normalizedRaw.includes('megapap')) return 'ΣΑΛΟΝΙ > Πουφ & Σκαμπό';
  if (normalizedRaw.includes('κουρτίνες & κουρτινόξυλα')) return 'ΣΑΛΟΝΙ > Κουρτίνες & Κουρτινόξυλα';

  // --- ΚΡΕΒΑΤΟΚΑΜΑΡΑ ---
  if (normalizedRaw.includes('κρεβάτια')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Κρεβάτια';
  if (normalizedRaw.includes('κομοδίνα')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Κομοδίνα';
  if (normalizedRaw.includes('συρταριέρες - τουαλέτες')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Συρταριέρες';
  if (normalizedRaw.includes('ντουλάπες ρούχων')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Ντουλάπες';
  if (normalizedRaw.includes('στρώματα ύπνου φουσκωτά')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Φουσκωτά στρώματα';
  if (normalizedRaw.includes('λευκά είδη > μαξιλαροθήκες')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Λευκά Είδη > Μαξιλαροθήκες';
  if (normalizedRaw.includes('λευκά είδη > σεντόνια')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Λευκά Είδη > Σεντόνια';
  if (normalizedRaw.includes('σετ παπλωματοθήκες')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Λευκά Είδη > Σετ Παπλωματοθήκες';
  if (normalizedRaw.includes('παπλωματοθήκες & κλινοσκεπάσματα')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Λευκά Είδη > Σετ Παπλωματοθήκες';
  
  // --- ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ ---
  if (normalizedRaw.includes('πολυθρόνες - καρέκλες κήπου')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Καρέκλες κήπου';
  if (normalizedRaw.includes('τραπέζια κήπου')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Τραπέζια εξωτερικού χώρου';
  if (normalizedRaw.includes('σετ τραπεζαρίες κήπου')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Σετ τραπεζαρίες κήπου';
  if (normalizedRaw.includes('βάσεις ομπρελών')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Βάσεις ομπρελών';
  if (normalizedRaw.includes('ομπρέλες κήπου - παραλίας')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Ομπρέλες κήπου / παραλίας';
  if (normalizedRaw.includes('κουτιά & μπαούλα κήπου')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Κουτιά Αποθήκευσης Κήπου';
  if (normalizedRaw.includes('καρέκλες catering')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Καρέκλες Catering';
  if (normalizedRaw.includes('τραπέζια catering')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Τραπέζια Catering';
  if (normalizedRaw.includes('διακόσμηση & οργάνωση μπαλκονιού')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Διακόσμηση & Οργάνωση Μπαλκονιού';
  if (normalizedRaw.includes('αιώρες')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Αιώρες Κήπου & Βεράντας';
  if (normalizedRaw.includes('λύσεις σκίασης')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Λυσεις σκίασης για μπαλκόνι';
  if (normalizedRaw.includes('φαναράκια')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Φαναράκια';

  // --- Αξεσουάρ ---
  if (normalizedProduct.includes('καλ') && normalizedRaw.includes('κρεμάστρες & καλόγεροι')) return 'Αξεσουάρ > Καλόγεροι';
  if (normalizedRaw.includes('καλόγεροι - κρεμάστρες τοίχου')) return 'Αξεσουάρ > Καλόγεροι';
  if (normalizedRaw.includes('κρεμάστρες δαπέδου')) return 'Αξεσουάρ > Κρεμάστρες Δαπέδου';
  if (normalizedProduct.includes('κρεμ') && normalizedRaw.includes('κρεμάστρες & καλόγεροι')) return 'Αξεσουάρ > Κρεμάστρες Δαπέδου';
  if (normalizedRaw.includes('πολύμπριζα')) return 'Αξεσουάρ > Πολύπριζα';
  if (normalizedRaw.includes('προεκτάσεις ρεύματος')) return 'Αξεσουάρ > Πολύπριζα';
  if (normalizedRaw.includes('κάδοι απορριμμάτων')) return 'Αξεσουάρ > Κάδοι Απορριμμάτων';
  if (normalizedRaw.includes('βάσεις τηλεόρασης')) return 'Αξεσουάρ > Βάσεις Τηλεόρασης';
  if (normalizedRaw.includes('σταχτοδοχεία')) return 'Αξεσουάρ > Σταχτοδοχεία';
  if (normalizedRaw.includes('στοπ πόρτας')) return 'Αξεσουάρ > Στόπ Πόρτας';
  if (normalizedRaw.includes('σκάλες')) return 'Αξεσουάρ > Σκάλες';

  // --- ΦΩΤΙΣΜΟΣ ---
  if (normalizedRaw.includes('οροφής φωτιστικά')) return 'ΦΩΤΙΣΜΟΣ > Φωτιστικά οροφής';
  if (normalizedRaw.includes('δαπέδου φωτιστικά')) return 'ΦΩΤΙΣΜΟΣ > Φωτιστικά Δαπέδου';
  if (normalizedRaw.includes('φωτιστικά επιδαπέδια')) return 'ΦΩΤΙΣΜΟΣ > Φωτιστικά Δαπέδου';
  if (normalizedRaw.includes('επιτραπέζια φωτιστικά')) return 'ΦΩΤΙΣΜΟΣ > Επιτραπέζια φωτιστικά';
  if (normalizedRaw.includes('απλίκες')) return 'ΦΩΤΙΣΜΟΣ > Απλίκες';
  if (normalizedRaw.includes('ταινίες led')) return 'ΦΩΤΙΣΜΟΣ > Ταινίες Led';
  if (normalizedRaw.includes('παιδικά φωτιστικά οροφής')) return 'ΦΩΤΙΣΜΟΣ > Παιδικά φωτιστικά οροφής';
  if (normalizedRaw.includes('γιρλάντες απο σχοινί')) return 'ΦΩΤΙΣΜΟΣ > Γιρλάντες απο Σχοινί';
  if (normalizedRaw.includes('party lights')) return 'ΦΩΤΙΣΜΟΣ > Φώτα Πάρτη';

  // --- ΔΙΑΚΟΣΜΗΣΗ ---
  if (normalizedRaw.includes('διακόσμηση > πίνακες')) return 'ΔΙΑΚΟΣΜΗΣΗ > Πίνακες';
  if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > καθρέπτες')) return 'ΔΙΑΚΟΣΜΗΣΗ > Καθρέπτες';
  if (normalizedRaw.includes('διακόσμηση > φυτά')) return 'ΔΙΑΚΟΣΜΗΣΗ > Τεχνητά φυτά';
  if (normalizedRaw.includes('διακόσμηση > διακόσμηση τοίχου')) return 'ΔΙΑΚΟΣΜΗΣΗ > Διακόσμηση τοίχου';
  if (normalizedRaw.includes('μαξιλάρια διακοσμητικά')) return 'ΔΙΑΚΟΣΜΗΣΗ > Διακοσμητικά Μαξιλάρια';
  if (normalizedRaw.includes('διακόσμηση > χαλιά')) return 'ΔΙΑΚΟΣΜΗΣΗ > Χαλιά';
  if (normalizedRaw.includes('κεριά διακοσμητικά')) return 'ΔΙΑΚΟΣΜΗΣΗ > Κεριά';
  if (normalizedRaw.includes('κουβέρτες & ριχτάρια')) return 'ΔΙΑΚΟΣΜΗΣΗ > Κουβέρτες & Ριχτάρια';
  if (normalizedRaw.includes('επένδυση & διακόσμηση τοίχου')) return 'ΔΙΑΚΟΣΜΗΣΗ > Επένδυση & Διακόσμηση Τοίχου';
  if (normalizedRaw.includes('διαχύτες αρωμάτων')) return 'ΔΙΑΚΟΣΜΗΣΗ > Διαχύτες Αρωμάτων';
  if (normalizedRaw.includes('κορνίζες')) return 'ΔΙΑΚΟΣΜΗΣΗ > Κορνίζες';
  if (normalizedRaw.includes('ρολόγια')) return 'ΔΙΑΚΟΣΜΗΣΗ > Ρολόγια';
  if (normalizedRaw.includes('ψάθινα & υφασμάτινα καλάθια')) return 'ΔΙΑΚΟΣΜΗΣΗ > Ψάθινα & Υφασμάτινα Καλάθια';
  if (normalizedRaw.includes('extreme interior design')) return 'ΔΙΑΚΟΣΜΗΣΗ > Luxury Decor';

  // --- Χριστουγεννιάτικα ---
  if (normalizedRaw.includes('χριστουγεννιάτικα δέντρα')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικα Δέντρα';
  if (normalizedRaw.includes('βάσεις χριστουγεννιάτικων δέντρων')) return 'Χριστουγεννιάτικα > Βάσεις Χριστουγεννιάτιων Δέντρων';
  if (normalizedRaw.includes('χριστουγεννιάτικα λαμπάκια led')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικα λαμπάκια Led';
  if (normalizedRaw.includes('vintage ξύλινα στολίδια')) return 'Χριστουγεννιάτικα > Ξύλινα στολίδια δέντρου';
  if (normalizedRaw.includes('φάτνη χριστουγέννων')) return 'Χριστουγεννιάτικα > Φάτνη Χριστουγεννων';
  if (normalizedRaw.includes('χριστουγεννιάτικα φωτεινά στοιχεία')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικα Φωτεινά Στοιχεία';
  if (normalizedRaw.includes('διακόσμηση & deco σε εορταστικό πνεύμα')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικη Διακόσμηση';
  if (normalizedRaw.includes('μινιατούρες & στοιχεία για το χριστουγεννιάτικο χωριό')) return 'Χριστουγεννιάτικα > Μινιατούρες & Στοιχεία για το Χριστουγεννιάτικο Χωριό';
  if (normalizedRaw.includes('κηροπήγια & κηροσβέστες')) return 'Χριστουγεννιάτικα > Κηροπήγια & Κηροσβέστες';
  if (normalizedRaw.includes('χριστουγεννιάτικες φιγούρες')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικες Φιγούρες';

  // Fallback
  return rawCategory || 'Uncategorized';
}
