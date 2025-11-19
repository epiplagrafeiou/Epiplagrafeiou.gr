
// This file contains the logic for cleaning and standardizing category names from supplier XML feeds.

// A map for specific, one-to-one replacements. This runs AFTER the general cleaning.
const specificCategoryMap: { [key: string]: string } = {
  'Ανταλλακτικά γραφείου': 'Ανταλλακτικά Για Καρέκλες Γραφείου',
  'Ανταλλακτικά': 'Ανταλλακτικά Για Καρέκλες Γραφείου',
  'ΣΚΑΜΠΟ-ΑΝΤΑΛΛΑΚΤΙΚΑ': 'Ανταλλακτικά Για Καρέκλες Γραφείου',
  'Συρταριέρες γραφείου': 'Συρταριέρες',
  'Τζακια και Εστίες Φωτιάς Βεράντας - Κήπου': 'Εστίες Φωτιάς Εξωτερικού Χώρου',
  'Αξεσουάρ Κρασιού': 'Περί Κρασιού & Ποτού...',
  'Στήλες Και Τηλέφωνα Ντους': 'Αξεσουάρ Μπάνιου',
  'Βοηθητικά Τραπεζάκια > Τραπεζάκια Σαλονιού': 'Τραπεζάκια Σαλονιού > Βοηθητικά Τραπεζάκια',
};

// Prefixes to be removed from the START of a category string.
const junkPrefixes = [
    "Έπιπλα εσωτερικού χώρου",
    "Έπιπλα γραφείου",
    "Διακόσμηση & Ατμόσφαιρα",
    "Διακόσμηση",
    "Φωτισμός",
    "Οργάνωση Σπιτιού",
    "Σαλόνι",
    "Εικόνα - Ήχος",
    "Λευκά Είδη",
    "Κονσόλες & Μπουφέδες",
    "Κήπος - Βεράντα",
];

const junkPhrases = [
     "Το θυμάσαι; >",
    "Δέντρο ή Δάσος φέτος τα Χριστούγεννα ? Μεγάλο το δίλημμα >",
    "Δέντρο ή Δάσος φέτος τα Χριστούγεννα ? Μεγάλο το δίληmma >",
    "Η απογείωση της Αγωνίας μέχρι τα Χριστούγεννα",
    "Όλα Αλλάζουν τα Χριστούγεννα Το Τραπέζι να μείνει ίδιο",
    "Η Διακόσμηση που θα μας βάλει στα Χριστούγεννα",
    "Οταν ονειρευόμαστε το Μαγικό Χωριό…",
    "Και αν δεν έχουμε ταξιδέψει κοιτάζοντας την",
    "Παραδοσιακά απο τις Κρύες Βόρειες Χώρες",
    "Εορταστικό Χουχούλιασμα",
];


// This function takes a raw category from the XML and returns a standardized one.
export function mapCategory(rawCategory: string): string {
    if (!rawCategory) return 'Uncategorized';
    
    let currentCategory = rawCategory.trim();

    // 1. Remove specific junk phrases entirely
    for (const phrase of junkPhrases) {
        currentCategory = currentCategory.replace(phrase, '').trim();
    }
    
    // 2. Remove parenthetical text, e.g., "Βιβλιοθήκες (σε “Έπιπλα Εσωτερικού”)" -> "Βιβλιοθήκες"
    currentCategory = currentCategory.replace(/\s*\(.*\)\s*/g, '').trim();
    
    // 3. Smartly remove junk prefixes ONLY if they are at the beginning of the path
    const parts = currentCategory.split('>').map(p => p.trim());
    if (parts.length > 1 && junkPrefixes.includes(parts[0])) {
        parts.shift(); // Remove the first part if it's a junk prefix
    }
    currentCategory = parts.join(' > ');
    
    // 4. Check for a specific, full-path mapping in our dictionary
    if (specificCategoryMap[currentCategory]) {
        return specificCategoryMap[currentCategory];
    }
    
    // 5. General cleanup for any remaining unwanted characters or formatting issues
    currentCategory = currentCategory.replace(/[.!?]/g, '').trim();
    
    // If after all this, the string is empty, mark it as Uncategorized
    if (!currentCategory) return 'Uncategorized';

    // Final step: Capitalize the first letter for consistency, but leave the rest of the path as is
    return currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
}
