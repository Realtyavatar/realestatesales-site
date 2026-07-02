/**
 * Property photo service
 * Uses Unsplash Source API (free, no key required)
 * Returns realistic house/property photos based on property type and suburb
 */

const PHOTO_SEEDS: Record<string, string[]> = {
  House:      ["modern-australian-house", "suburban-home", "house-exterior", "family-home", "residential-house"],
  Apartment:  ["apartment-building", "modern-apartment", "city-apartment", "high-rise", "contemporary-flat"],
  Townhouse:  ["townhouse", "modern-townhouse", "attached-home", "row-house"],
  Land:       ["vacant-land", "land-australia", "rural-land", "building-block"],
  Rural:      ["farm-house", "country-property", "rural-home", "farmland"],
  default:    ["real-estate", "property-australia", "home-exterior"],
};

export function getPropertyPhotoUrl(type: string, id: string, width = 600, height = 400): string {
  const seeds = PHOTO_SEEDS[type] || PHOTO_SEEDS.default;
  // Use listing ID to consistently pick same photo per listing
  const idx = Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % seeds.length;
  const seed = seeds[idx];
  // Unsplash Source API — free, no key needed
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(seed)}&sig=${id.slice(0, 8)}`;
}

// Real house photos — curated Unsplash photo IDs of Australian-style homes
const HOUSE_PHOTOS = [
  "1564013799919-ab3a9b1b6e2c", // modern house exterior
  "1480074568708-e7b720bb3f09", // white house
  "1570129477492-45c003edd2be", // luxury home
  "1558618666-fcd25c85cd64", // contemporary house
  "1512917774080-9991f1c4c750", // beautiful home
  "1600596542815-ffad4c1539a9", // modern villa
  "1600585154340-be6161a56a0c", // nice house
  "1605276374104-dee2a0ed3cd6", // house facade
  "1613977257592-4871e5fcd7c4", // luxury property
  "1416331108894-5bb81f3ba784", // family home
  "1507089947368-19c1da9775ae", // suburban house
  "1523217582562-09d05b1ce27a", // house with garden
  "1549517045-bc93de630367", // house front
  "1583608205776-bfd35f0d9f83", // nice home
  "1592595896616-c37162298647", // property
];

const APARTMENT_PHOTOS = [
  "1545324418-cc1a3fa12c98", // apartment building
  "1502672260266-1c1ef2d93688", // apartment interior
  "1460317442991-0ec209397118", // city apartments
  "1486325212027-8081e485255e", // modern apartment block
  "1522708323590-d24dbb6b0267", // apartment exterior
];

export function getFallbackPhotoUrl(id: string, width = 600, height = 400): string {
  const hash = Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const photos = HOUSE_PHOTOS;
  const photoId = photos[hash % photos.length];
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}

export function getApartmentPhotoUrl(id: string, width = 600, height = 400): string {
  const hash = Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const photoId = APARTMENT_PHOTOS[hash % APARTMENT_PHOTOS.length];
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}
