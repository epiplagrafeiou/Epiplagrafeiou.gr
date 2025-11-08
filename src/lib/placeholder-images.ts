import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Only contains the static images from the JSON file.
// All dynamic product images now come directly from the Product objects in Firestore.
export const PlaceHolderImages: ImagePlaceholder[] = [...data.placeholderImages];
