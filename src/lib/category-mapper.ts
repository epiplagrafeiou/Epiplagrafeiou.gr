// A simple mapping from supplier category to your store's standard category.
// We can add more rules here as needed.
const categoryMap: { [key: string]: string } = {
  // Example: 'Supplier Category': 'Your Store Category'
  'Καφετιέρες': 'Coffee Machines',
  'Μικροσυσκευές': 'Small Appliances',
  'Ραφιέρες/Ράφια Τοίχου': 'Ραφιέρες',
  'Ραφιέρες Τοίχου': 'Ραφιέρες',
  'Οροφής Φωτιστικά': 'Φωτιστικά Οροφής',
};

// This function takes a raw category from the XML and returns the standardized one.
// If no mapping is found, it returns the original category.
export function mapCategory(rawCategory: string): string {
    if (!rawCategory) return 'Uncategorized';

    // First, remove any parenthetical parts. e.g., "Βιβλιοθήκες (σε “Έπιπλα Εσωτερικού”)" -> "Βιβλιοθήκες"
    const cleanedCategory = rawCategory.replace(/\s*\(.*\)\s*/g, '').trim();

    // Check for a direct match in our map with the cleaned category
    if (categoryMap[cleanedCategory]) {
        return categoryMap[cleanedCategory];
    }
    
    // Handle hierarchical categories (e.g., "Μικροσυσκευές > Καφετιέρες")
    const parts = cleanedCategory.split(' > ').map(part => part.trim());
    const mappedParts = parts.map(part => categoryMap[part] || part);
    
    return mappedParts.join(' > ');
}
