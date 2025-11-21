
'use server';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// The new home for your category mapping logic
export async function mapCategory(rawCategory: string, productName: string): Promise<string> {
    const normalizedRaw = normalize(rawCategory);
    const normalizedProduct = normalize(productName);

    // ΓΡΑΦΕΙΟ
    if (normalizedRaw.includes('έπιπλα γραφείου > γραφεία')) return 'ΓΡΑΦΕΙΟ > Γραφεία';
    if (normalizedRaw.includes('έπιπλα γραφείου > καρέκλες γραφείου')) return 'ΓΡΑΦΕΙΟ > Καρέκλες γραφείου';
    if (normalizedRaw.includes('έπιπλα γραφείου > συρταριέρες γραφείου')) return 'ΓΡΑΦΕΙΟ > Συρταριέρες Γραφείου';
    if ((normalizedRaw.includes('βιβλιοθήκες > σαλόνι') && rawCategory.includes('b2b portal')) || (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > βιβλιοθήκες') && rawCategory.includes('megapap'))) return 'ΓΡΑΦΕΙΟ > Βιβλιοθήκες';
    if ((normalizedRaw.includes('ραφιέρες & αποθηκευτικά κουτιά > σαλόνι') && rawCategory.includes('b2b portal')) || (normalizedRaw.includes('γραφειο > ραφιέρες') && rawCategory.includes('b2b portal'))) return 'ΓΡΑΦΕΙΟ > Ραφιέρες / Αποθηκευτικά Κουτιά';
    if (normalizedRaw.includes('έπιπλα γραφείου > ντουλάπια γραφείου')) return 'ΓΡΑΦΕΙΟ > Ντουλάπες';
    if (normalizedRaw.includes('έπιπλα γραφείου > ανταλλακτικά γραφείου')) return 'ΓΡΑΦΕΙΟ > Ανταλλακτικά';
    if (normalizedRaw.includes('έπιπλα γραφείου > reception')) return 'ΓΡΑΦΕΙΟ > Γραφεία υποδοχής / Reception';

    // ΣΑΛΟΝΙ
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > καναπέδες γωνιακοί')) return 'ΣΑΛΟΝΙ > Καναπέδες > Γωνιακοί καναπέδες';
    if ((normalizedRaw.includes('σαλονι > καναπέδες') && rawCategory.includes('b2b portal')) || (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > καναπέδες - κρεβάτι') && rawCategory.includes('megapap'))) return 'ΣΑΛΟΝΙ > Καναπέδες > Καναπές Κρεβάτι';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > πολυθρόνες σαλονιού') || normalizedRaw.includes('έπιπλα εσωτερικού χώρου > πολυθρόνες - κρεβάτι')) return 'ΣΑΛΟΝΙ > Πολυθρόνες';
    if ((normalizedRaw.includes('καρέκλες & πολυθρόνες > σαλόνι') && normalizedProduct.includes('καρέκλες')) || (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > καρέκλες - πολυθρόνες τραπεζαρίας') && normalizedProduct.includes('καρέκλες'))) return 'ΣΑΛΟΝΙ > Καρέκλες τραπεζαρίας';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > τραπέζια')) return 'ΣΑΛΟΝΙ > Τραπέζια';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > τραπεζάκια σαλονιού')) return 'ΣΑΛΟΝΙ > Τραπεζάκια σαλονιού';
    if ((normalizedRaw.includes('σαλονι > τραπεζάκια σαλονιού') && rawCategory.includes('b2b portal')) || (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > τραπεζάκια βοηθητικά') && rawCategory.includes('megapap'))) return 'ΣΑΛΟΝΙ > Τραπεζάκια Βοηθητικά';
    if ((normalizedRaw.includes('επιπλα τηλεόρασης > σαλόνι') && rawCategory.includes('b2b portal')) || (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > έπιπλα τηλεόρασης') && rawCategory.includes('megapap'))) return 'ΣΑΛΟΝΙ > Έπιπλα τηλεόρασης';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > συνθέσεις σαλονιού')) return 'ΣΑΛΟΝΙ > Συνθέσεις Σαλονιού';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > έπιπλα εισόδου')) return 'ΣΑΛΟΝΙ > Έπιπλα Εισόδου';
    if ((normalizedRaw.includes('παπουτσοθήκες > σαλόνι') && rawCategory.includes('b2b portal')) || (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > παπουτσοθήκες') && rawCategory.includes('megapap'))) return 'ΣΑΛΟΝΙ > Παπουτσοθήκες';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > μπουφέδες')) return 'ΣΑΛΟΝΙ > Μπουφέδες';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > κονσόλες')) return 'ΣΑΛΟΝΙ > Κονσόλες';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > σκαμπώ μπαρ')) return 'ΣΑΛΟΝΙ > Σκαμπώ μπαρ';
    if ((normalizedRaw.includes('σαλονι > σκαμπό & πουφ') && rawCategory.includes('b2b portal')) || (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > σκαμπώ') && rawCategory.includes('megapap'))) return 'ΣΑΛΟΝΙ > Πουφ & Σκαμπό';
    if (normalizedRaw.includes('κουρτίνες & κουρτινόξυλα > σαλόνι')) return 'ΣΑΛΟΝΙ > Κουρτίνες & Κουρτινόξυλα';

    // ΚΡΕΒΑΤΟΚΑΜΑΡΑ
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > κρεβάτια')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Κρεβάτια';
    if ((normalizedRaw.includes('κρεβατοκαμαρα > κομοδίνα') && rawCategory.includes('b2b portal')) || (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > κομοδίνα') && rawCategory.includes('megapap'))) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Κομοδίνα';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > συρταριέρες - τουαλέτες')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Συρταριέρες';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > ντουλάπες ρούχων')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Ντουλάπες';
    if (normalizedRaw.includes('στρώματα ύπνου φουσκωτά > οργάνωση σπιτιού')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Φουσκωτά στρώματα';
    if (normalizedRaw.includes('άλλα είδη > λευκά είδη > μαξιλαροθήκες')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Λευκά Είδη > Μαξιλαροθήκες';
    if (normalizedRaw.includes('άλλα είδη > λευκά είδη > σεντόνια')) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Λευκά Είδη > Σεντόνια';
    if ((normalizedRaw.includes('άλλα είδη > λευκά είδη > σετ παπλωματοθήκες') && rawCategory.includes('megapap')) || (normalizedRaw.includes('παπλωματοθήκες & κλινοσκεπάσματα > δωμάτιο') && rawCategory.includes('b2b portal'))) return 'ΚΡΕΒΑΤΟΚΑΜΑΡΑ > Λευκά Είδη > Σετ Παπλωματοθήκες';

    // ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ
    if (normalizedRaw.includes('έπιπλα κήπου > πολυθρόνες - καρέκλες κήπου')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Καρέκλες κήπου';
    if (normalizedRaw.includes('έπιπλα κήπου > τραπέζια κήπου')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Τραπέζια εξωτερικού χώρου';
    if (normalizedRaw.includes('έπιπλα κήπου > σετ τραπεζαρίες κήπου')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Σετ τραπεζαρίες κήπου';
    if (normalizedRaw.includes('έπιπλα κήπου > βάσεις ομπρελών')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Βάσεις ομπρελών';
    if (normalizedRaw.includes('έπιπλα κήπου > ομπρέλες κήπου - παραλίας')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Ομπρέλες κήπου / παραλίας';
    if (normalizedRaw.includes('κουτιά & μπαούλα κήπου > κήπος - βεράντα')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Κουτιά Αποθήκευσης Κήπου';
    if (normalizedRaw.includes('διακόσμηση & οργάνωση μπαλκονιού > κήπος - βεράντα')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Διακόσμηση & Οργάνωση Μπαλκονιού';
    if (normalizedRaw.includes('εξωτερικος χωρος > αιώρες')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Αιώρες Κήπου & Βεράντας';
    if (normalizedRaw.includes('λύσεις σκίασης για το μπαλκόνι και τον κήπο > κήπος - βεράντα')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Λυσεις σκίασης για μπαλκόνι';
    if (normalizedRaw.includes('φαναράκια > κήπος - βεράντα')) return 'ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Φαναράκια';

    // Αξεσουάρ
    if ((normalizedRaw.includes('κρεμάστρες & καλόγεροι > οργάνωση σπιτιού') && normalizedProduct.includes('καλ')) || normalizedRaw.includes('έπιπλα εσωτερικού χώρου > καλόγεροι - κρεμάστρες τοίχου')) return 'Αξεσουάρ > Καλόγεροι';
    if ((normalizedRaw.includes('κρεμάστρες δαπέδου > οργάνωση σπιτιού')) || (normalizedRaw.includes('κρεμάστρες & καλόγεροι > οργάνωση σπιτιού') && normalizedProduct.includes('κρεμ'))) return 'Αξεσουάρ > Κρεμάστρες Δαπέδου';
    if (normalizedRaw.includes('πολύμπριζα > εικόνα - ήχος') || normalizedRaw.includes('προεκτάσεις ρεύματος & μπαλαντέζες > εικόνα - ήχος')) return 'Αξεσουάρ > Πολύπριζα';
    if (normalizedRaw.includes('βάσεις τηλεόρασης > εικόνα - ήχος')) return 'Αξεσουάρ > Βάσεις Τηλεόρασης';
    if (normalizedRaw.includes('σταχτοδοχεία > οργάνωση σπιτιού')) return 'Αξεσουάρ > Σταχτοδοχεία';
    if (normalizedRaw.includes('στοπ πόρτας > οργάνωση σπιτιού')) return 'Αξεσουάρ > Στόπ Πόρτας';
    if (normalizedRaw.includes('άλλα είδη > είδη σπιτιού > σκάλες')) return 'Αξεσουάρ > Σκάλες';

    // ΦΩΤΙΣΜΟΣ
    if (normalizedRaw.includes('φωτισμός > οροφής φωτιστικά') || normalizedRaw.includes('φωτιστικά οροφής > φωτισμός')) return 'ΦΩΤΙΣΜΟΣ > Φωτιστικά οροφής';
    if (normalizedRaw.includes('φωτισμός > δαπέδου φωτιστικά') || normalizedRaw.includes('φωτιστικά επιδαπέδια & επιτραπέζια > φωτισμός')) return 'ΦΩΤΙΣΜΟΣ > Φωτιστικά Δαπέδου';
    if (normalizedRaw.includes('φωτισμός > επιτραπέζια φωτιστικά')) return 'ΦΩΤΙΣΜΟΣ > Επιτραπέζια φωτιστικά';
    if (normalizedRaw.includes('φωτισμός > απλίκες')) return 'ΦΩΤΙΣΜΟΣ > Απλίκες';
    if (normalizedRaw.includes('ταινίες led > φωτισμός')) return 'ΦΩΤΙΣΜΟΣ > Ταινίες Led';
    if (normalizedRaw.includes('φωτισμός > παιδικά φωτιστικά οροφής')) return 'ΦΩΤΙΣΜΟΣ > Παιδικά φωτιστικά οροφής';
    if (normalizedRaw.includes('γιρλάντες απο σχοινί > φωτισμός')) return 'ΦΩΤΙΣΜΟΣ > Γιρλάντες απο Σχοινί';
    if (normalizedRaw.includes('party lights > φωτισμός')) return 'ΦΩΤΙΣΜΟΣ > Φώτα Πάρτη';

    // ΔΙΑΚΟΣΜΗΣΗ
    if (normalizedRaw.includes('διακόσμηση > πίνακες')) return 'ΔΙΑΚΟΣΜΗΣΗ > Πίνακες';
    if (normalizedRaw.includes('έπιπλα εσωτερικού χώρου > καθρέπτες')) return 'ΔΙΑΚΟΣΜΗΣΗ > Καθρέπτες';
    if (normalizedRaw.includes('διακοσμηση > φυτά')) return 'ΔΙΑΚΟΣΜΗΣΗ > Τεχνητά φυτά';
    if (normalizedRaw.includes('διακόσμηση > διακόσμηση τοίχου')) return 'ΔΙΑΚΟΣΜΗΣΗ > Διακόσμηση τοίχου';
    if (normalizedRaw.includes('λευκά είδη > σαλόνι > μαξιλάρια διακοσμητικά')) return 'ΔΙΑΚΟΣΜΗΣΗ > Διακοσμητικά Μαξιλάρια';
    if (normalizedRaw.includes('διακοσμηση > χαλιά')) return 'ΔΙΑΚΟΣΜΗΣΗ > Χαλιά';
    if (normalizedRaw.includes('κεριά διακοσμητικά > διακόσμηση & ατμόσφαιρα')) return 'ΔΙΑΚΟΣΜΗΣΗ > Κεριά';
    if (normalizedRaw.includes('κουβέρτες & ριχτάρια > σαλόνι')) return 'ΔΙΑΚΟΣΜΗΣΗ > Κουβέρτες & Ριχτάρια';
    if (normalizedRaw.includes('επένδυση & διακόσμηση τοίχου > διακόσμηση & ατμόσφαιρα') && !productName.includes('Αυτοκόλλητα Πλακάκια Μωσαϊκό')) return 'ΔΙΑΚΟΣΜΗΣΗ > Επένδυση & Διακόσμηση Τοίχου';
    if (normalizedRaw.includes('διαχύτες αρωμάτων - αρωματικά χώρου > διακόσμηση & ατμόσφαιρα')) return 'ΔΙΑΚΟΣΜΗΣΗ > Διαχύτες Αρωμάτων';
    if (normalizedRaw.includes('κορνίζες > διακόσμηση & ατμόσφαιρα')) return 'ΔΙΑΚΟΣΜΗΣΗ > Κορνίζες';
    if (normalizedRaw.includes('διακοσμηση > ρολόγια')) return 'ΔΙΑΚΟΣΜΗΣΗ > Ρολόγια';
    if (normalizedRaw.includes('ψάθινα & υφασμάτινα καλάθια > διακόσμηση & ατμόσφαιρα')) return 'ΔΙΑΚΟΣΜΗΣΗ > Ψάθινα & Υφασμάτινα Καλάθια';
    if (normalizedRaw.includes('διακόσμηση & ατμόσφαιρα > extreme interior design')) return 'ΔΙΑΚΟΣΜΗΣΗ > Luxury Decor';

    // Χριστουγεννιάτικα
    if (normalizedRaw.includes('mε χριστουγεννιάτικη διάθεση! > χριστουγεννιάτικα δέντρα !')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικα Δέντρα';
    if (normalizedRaw.includes('βάσεις χριστουγεννιάτικων δέντρων > δέντρο ή δάσος φέτος τα χριστούγεννα ? μεγάλο το δίλημμα')) return 'Χριστουγεννιάτικα > Βάσεις Χριστουγεννιάτιων Δέντρων';
    if (normalizedRaw.includes('χριστουγεννιάτικα λαμπάκια led > φωτισμός')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικα λαμπάκια Led';
    if (normalizedRaw.includes('vintage ξύλινα στολίδια δέντρου > δέντρο ή δάσος φέτος τα χριστούγεννα ? μεγάλο το δίλημμα')) return 'Χριστουγεννιάτικα > Ξύλινα στολίδια δέντρου';
    if (normalizedRaw.includes('φάτνη χριστουγέννων > και αν δεν έχουμε ταξιδέψει κοιτάζοντας την !')) return 'Χριστουγεννιάτικα > Φάτνη Χριστουγεννων';
    if (normalizedRaw.includes('χριστουγεννιάτικα φωτεινά στοιχεία > φωτισμός')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικα Φωτεινά Στοιχεία';
    if (normalizedRaw.includes('διακόσμηση & deco σε εορταστικό πνεύμα > η διακόσμηση που θα μας βάλει στα χριστούγεννα')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικη Διακόσμηση';
    if (normalizedRaw.includes('μινιατούρες & στοιχεία για το χριστουγεννιάτικο χωριό > οταν ονειρευόμαστε το μαγικό χωριό…')) return 'Χριστουγεννιάτικα > Μινιατούρες & Στοιχεία για το Χριστουγεννιάτικο Χωριό';
    if (normalizedRaw.includes('κηροπήγια & κηροσβέστες > διακόσμηση & ατμόσφαιρα')) return 'Χριστουγεννιάτικα > Κηροπήγια & Κηροσβέστες';
    if (normalizedRaw.includes('χριστουγεννιάτικες φιγούρες > και αν δεν έχουμε ταξιδέψει κοιτάζοντας την !')) return 'Χριστουγεννιάτικα > Χριστουγεννιάτικες Φιγούρες';

    // Fallback to the original if no rule matches
    return rawCategory;
}
