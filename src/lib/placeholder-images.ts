import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Start with the static images from the JSON file
let dynamicPlaceholders: ImagePlaceholder[] = [...data.placeholderImages];

// Function to add a new placeholder image at runtime if it doesn't exist
export function addDynamicPlaceholder(newImage: ImagePlaceholder) {
    const exists = dynamicPlaceholders.some(img => img.id === newImage.id);
    if (!exists) {
        dynamicPlaceholders.push(newImage);
    }
}

// Export the array, which will now include any dynamically added images
export const PlaceHolderImages: ImagePlaceholder[] = dynamicPlaceholders;
