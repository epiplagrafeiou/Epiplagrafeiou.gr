import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Initialize with static images and load from local storage if available.
let dynamicPlaceholders: ImagePlaceholder[] = [...data.placeholderImages];

// A function to be called on the client side to initialize/load data.
export function initializePlaceholders() {
    const storedImages = localStorage.getItem('placeholderImages');
    if (storedImages) {
        try {
            const parsedImages: ImagePlaceholder[] = JSON.parse(storedImages);
            // Combine initial data with stored data, avoiding duplicates
            const allImages = [...data.placeholderImages];
            const existingIds = new Set(allImages.map(img => img.id));
            parsedImages.forEach(img => {
                if (!existingIds.has(img.id)) {
                    allImages.push(img);
                    existingIds.add(img.id);
                }
            });
            dynamicPlaceholders = allImages;
        } catch (e) {
            console.error("Failed to parse placeholder images from localStorage", e);
            dynamicPlaceholders = [...data.placeholderImages];
        }
    }
}


// Function to add a new placeholder image at runtime if it doesn't exist
export function addDynamicPlaceholder(newImage: ImagePlaceholder | ImagePlaceholder[]) {
    const imagesToAdd = Array.isArray(newImage) ? newImage : [newImage];
    let updated = false;

    imagesToAdd.forEach(img => {
        const exists = dynamicPlaceholders.some(p => p.id === img.id);
        if (!exists) {
            dynamicPlaceholders.push(img);
            updated = true;
        }
    });

    if (updated) {
        // Save the updated list to local storage
        localStorage.setItem('placeholderImages', JSON.stringify(dynamicPlaceholders));
    }
}

// Export the array, which will now include any dynamically added images
export const PlaceHolderImages: ImagePlaceholder[] = dynamicPlaceholders;
