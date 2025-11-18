
// A simple mapping from supplier category to your store's standard category.
// We can add more rules here as needed.
const categoryMap: { [key: string]: string } = {
  // Example: 'Supplier Category': 'Your Store Category'
  'Καφετιέρες': 'Coffee Machines',
  'Μικροσυσκευές': 'Small Appliances',
  'Ραφιέρες/Ράφια Τοίχου': 'Ραφιέρες Τοίχου',
  'Οροφής Φωτιστικά': 'Φωτιστικά Οροφής',
  'Διακοσμητικοί Καθρέπτες': 'Καθρέπτες',
  'Κεριά LED': 'Κεριά',
  'Δέντρο ή Δάσος φέτος τα Χριστούγεννα ? Μεγάλο το δίλημμα > Χριστουγεννιάτικα Δέντρα !': 'Χριστουγεννιάτικα Δέντρα',
  'Δέντρο ή Δάσος φέτος τα Χριστούγεννα ? Μεγάλο το δίλημμα > Βάσεις Χριστουγεννιάτικων Δέντρων': 'Βάσεις Χριστουγεννιάτικων Δέντρων',
  'Λευκά Είδη > Χαλιά': 'Χαλιά',
  'Διακόσμηση & Ατμόσφαιρα > Κορνίζες': 'Κορνίζες',
  'Οργάνωση Σπιτιού > Κάδοι Απορριμάτων': 'Κάδοι Απορριμάτων',
  'Διακόσμηση & Ατμόσφαιρα > Κεριά Διακοσμητικά': 'Κεριά',
  'Έπιπλα εσωτερικού χώρου > Σκαμπώ μπαρ': 'Σκαμπώ μπαρ',
  'Διακόσμηση & Ατμόσφαιρα > Τεχνητά Φυτά & Κασπώ': 'Τεχνητά Φυτά & Κασπώ',
  'Δέντρο ή Δάσος φέτος τα Χριστούγεννα ? Μεγάλο το δίληmma > Vintage Ξύλινα Στολίδια Δέντρου': 'Ξύλινα Στολίδια Δέντρου',
  'Φωτισμός > Οροφής φωτιστικά': 'Φωτιστικά Οροφής',
  'Διακόσμηση > Μαξιλάρια διακόσμησης καναπέ': 'Διακοσμητικά Μαξιλάρια',
  'Σαλόνι > Μαξιλάρια Διακοσμητικά . Εξωτερικού & Εσωτερικού Χώρου': 'Διακοσμητικά Μαξιλάρια',
  'Διακόσμηση & Ατμόσφαιρα > Κεριά Ατμοσφαιρικού Φωτισμού Led': 'Κεριά',
  'Οργάνωση Σπιτιού > Κρεμάστρες Δαπέδου': 'Κρεμάστρες Δαπέδου',
  'Εικόνα - Ήχος > Πολύμπριζα': 'Πολύμπριζα',
  'Σαλόνι > Κουρτίνες & Κουρτινόξυλα': 'Κουρτίνες & Κουρτινόξυλα',
  'Οργάνωση Σπιτιού > Κουτιά Αποθήκευσης - Τακτοποίησης': 'Κουτιά Αποθήκευσης - Τακτοποίησης',
  'Εικόνα - Ήχος > Προεκτάσεις Ρεύματος & Μπαλαντέζες': 'Προεκτάσεις & Μπαλαντέζες',
  'Φωτισμός > Απλίκες': 'Απλίκες',
  'Φωτισμός > Χριστουγεννιάτικα Φωτεινά Στοιχεία': 'Χριστουγενιάτικα Φωτινά Στοιχεία',
  'Διακόσμηση & Ατμόσφαιρα > Διακοσμητικά στοιχεία': 'Διακοσμητικά',
  'Διακόσμηση > Γενικό διακοσμητικό': 'Διακοσμητικά',
  'Διακόσμηση & Ατμόσφαιρα > Διαχύτες Αρωμάτων - Αρωματικά Χώρου': 'Αρωματικά Χώρου',
  'Έπιπλα γραφείου > Ανταλλακτικά γραφείου': 'Ανταλλακτικά Για Καρέκλες Γραφείου',
  'Ανταλλακτικά': 'Ανταλλακτικά Για Καρέκλες Γραφείου',
  'ΣΚΑΜΠΟ-ΑΝΤΑΛΛΑΚΤΙΚΑ': 'Ανταλλακτικά Για Καρέκλες Γραφείου',
  'Έπιπλα γραφείου > Συρταριέρες γραφείου': 'Συρταριέρες',
};

// Prefixes to be removed from the start of category strings
const prefixesToRemove = [
    "Έπιπλα εσωτερικού χώρου >",
    "Έπιπλα γραφείου >",
    "Διακόσμηση & Ατμόσφαιρα >",
    "Διακόσμηση >",
    "Φωτισμός >",
    "Οργάνωση Σπιτιού >",
    "Σαλόνι >",
    "Εικόνα - Ήχος >"
];

// This function takes a raw category from the XML and returns the standardized one.
// If no mapping is found, it returns the original category.
export function mapCategory(rawCategory: string): string {
    if (!rawCategory) return 'Uncategorized';
    
    let currentCategory = rawCategory.trim();

    // Check for a direct match in our explicit mapping first.
    if (categoryMap[currentCategory]) {
        return categoryMap[currentCategory];
    }
    
    // Remove any parenthetical parts. e.g., "Βιβλιοθήκες (σε “Έπιπλα Εσωτερικού”)" -> "Βιβλιοθήκες"
    currentCategory = currentCategory.replace(/\s*\(.*\)\s*/g, '').trim();

    // Remove common prefixes
    for (const prefix of prefixesToRemove) {
        if (currentCategory.startsWith(prefix)) {
            currentCategory = currentCategory.substring(prefix.length).trim();
            break; // Stop after the first prefix match
        }
    }

    // After removing prefixes, check the map again for the simplified name
    if (categoryMap[currentCategory]) {
        return categoryMap[currentCategory];
    }
    
    // As a final step, if the category still contains ' > ', take the last part.
    if (currentCategory.includes(' > ')) {
        const parts = currentCategory.split(' > ');
        currentCategory = parts[parts.length - 1].trim();
    }
    
    // Final check on the map with the very last part
    if (categoryMap[currentCategory]) {
        return categoryMap[currentCategory];
    }

    // Capitalize the first letter for consistency
    return currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
}
