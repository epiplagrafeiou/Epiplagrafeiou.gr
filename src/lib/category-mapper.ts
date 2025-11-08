// A simple mapping from supplier category to your store's standard category.
// We can add more rules here as needed.
const categoryMap: { [key: string]: string } = {
  // Example: 'Supplier Category': 'Your Store Category'
  'Καφετιέρες': 'Coffee Machines',
  'Μικροσυσκευές': 'Small Appliances',
};

// This function takes a raw category from the XML and returns the standardized one.
// If no mapping is found, it returns the original category.
export function mapCategory(rawCategory: string): string {
    if (!rawCategory) return 'Uncategorized';

    // Check for a direct match first (e.g., "Καφετιέρες")
    if (categoryMap[rawCategory]) {
        return categoryMap[rawCategory];
    }
    
    // Handle hierarchical categories (e.g., "Μικροσυσκευές > Καφετιέρες")
    const parts = rawCategory.split(' > ').map(part => part.trim());
    const mappedParts = parts.map(part => categoryMap[part] || part);
    
    return mappedParts.join(' > ');
}
