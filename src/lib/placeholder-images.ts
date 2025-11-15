import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  title?: string;
  buttonText?: string;
  buttonLink?: string;
};

// This now correctly loads all placeholder images from the JSON file, including the new hero slides.
export const PlaceHolderImages: ImagePlaceholder[] = [...data.placeholderImages];
