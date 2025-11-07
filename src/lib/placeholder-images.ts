import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Initialize with static images. This will be merged with local storage data.
const initialPlaceholders: ImagePlaceholder[] = [...data.placeholderImages];
let combinedPlaceholders: ImagePlaceholder[] | null = null;

// Function to get all placeholders, loading from localStorage on first call.
function getPlaceholders(): ImagePlaceholder[] {
  if (combinedPlaceholders === null && typeof window !== 'undefined') {
    const storedImages = localStorage.getItem('placeholderImages');
    let storedParsed: ImagePlaceholder[] = [];
    if (storedImages) {
      try {
        storedParsed = JSON.parse(storedImages);
      } catch (e) {
        console.error("Failed to parse placeholder images from localStorage", e);
      }
    }
    
    // Combine and de-duplicate, giving localStorage precedence.
    const allImagesMap = new Map<string, ImagePlaceholder>();
    initialPlaceholders.forEach(img => allImagesMap.set(img.id, img));
    storedParsed.forEach(img => allImagesMap.set(img.id, img));
    
    combinedPlaceholders = Array.from(allImagesMap.values());
  }
  return combinedPlaceholders || initialPlaceholders;
}


// Function to add a new placeholder image at runtime if it doesn't exist
export function addDynamicPlaceholder(newImage: ImagePlaceholder | ImagePlaceholder[]) {
    const currentPlaceholders = getPlaceholders();
    const imagesToAdd = Array.isArray(newImage) ? newImage : [newImage];
    let updated = false;

    const placeholderMap = new Map(currentPlaceholders.map(p => [p.id, p]));

    imagesToAdd.forEach(img => {
        if (!placeholderMap.has(img.id)) {
            placeholderMap.set(img.id, img);
            updated = true;
        }
    });

    if (updated) {
        const updatedPlaceholders = Array.from(placeholderMap.values());
        combinedPlaceholders = updatedPlaceholders;
        // Save the updated list to local storage
        localStorage.setItem('placeholderImages', JSON.stringify(updatedPlaceholders));
    }
}

// Function to remove placeholder images by their IDs
export function removeDynamicPlaceholders(imageIds: string[]) {
    if (typeof window === 'undefined') return;
    
    const currentPlaceholders = getPlaceholders();
    const idsToRemove = new Set(imageIds);
    let updated = false;

    const newPlaceholders = currentPlaceholders.filter(p => {
        if (idsToRemove.has(p.id)) {
            updated = true;
            return false;
        }
        return true;
    });

    if (updated) {
        combinedPlaceholders = newPlaceholders;
        localStorage.setItem('placeholderImages', JSON.stringify(newPlaceholders));
    }
}


// A wrapper class to act as a live reference to the placeholders.
class PlaceholderManager {
  get images(): ImagePlaceholder[] {
    return getPlaceholders();
  }

  find(predicate: (img: ImagePlaceholder) => boolean): ImagePlaceholder | undefined {
    return this.images.find(predicate);
  }
}

const manager = new PlaceholderManager();

// Export a proxy that will always access the latest placeholder list.
export const PlaceHolderImages = new Proxy(manager, {
    get(target, prop) {
        if (prop === 'find') {
            return target.find.bind(target);
        }
        // Redirect all array-like access to the dynamic images array
        const images = target.images;
        // @ts-ignore
        const value = images[prop];
        if (typeof value === 'function') {
            return value.bind(images);
        }
        return value;
    }
}) as unknown as ImagePlaceholder[];
