import type { RoomType } from "./types";

// Room templates for a checkout inspection. Every new inspection gets these
// rooms/areas; each checklist covers the items relevant to it, and together
// they cover: cleanliness, linens changed, soap restocked, coffee and tea
// present, toilet paper stocked, appliances cleaned, bins, the BBQ/outdoor
// area and the backyard.
export interface RoomTemplate {
  room_type: RoomType;
  name: string;
  items: string[];
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    room_type: "bedroom",
    name: "Bedroom",
    items: [
      "Cleanliness — floors vacuumed, surfaces dusted, no guest items left behind",
      "Linens changed — fresh sheets and pillowcases, bed made",
      "Wardrobe and drawers empty, hangers in place",
    ],
  },
  {
    room_type: "bathroom",
    name: "Bathroom",
    items: [
      "Cleanliness — shower, toilet, sink and mirror cleaned",
      "Soap restocked — hand soap, shampoo and body wash topped up",
      "Toilet paper stocked — spare rolls in place",
      "Towels and bath mats replaced with fresh set",
    ],
  },
  {
    room_type: "kitchen",
    name: "Kitchen",
    items: [
      "Cleanliness — benches, sink, floors and bins cleaned",
      "Coffee and tea present — supplies topped up",
      "Appliances cleaned — oven, microwave, fridge, kettle, dishwasher",
      "Dish soap and sponges restocked",
      "Dishes and cutlery clean and put away",
    ],
  },
  {
    room_type: "powder",
    name: "Powder room",
    items: [
      "Cleanliness — toilet, sink and mirror cleaned",
      "Soap restocked — hand soap topped up",
      "Toilet paper stocked — spare roll in place",
      "Hand towel replaced with fresh one",
    ],
  },
  {
    room_type: "living",
    name: "Living area",
    items: [
      "Cleanliness — floors vacuumed, surfaces dusted, cushions straightened",
      "Appliances cleaned and working — TV, remote, air-con, Wi-Fi router",
      "Throws and cushion covers fresh",
      "Guest information / house manual in place",
    ],
  },
  {
    room_type: "outdoor",
    name: "BBQ & outdoor area",
    items: [
      "BBQ cleaned — grill plates, hood and drip tray",
      "Gas bottle checked — enough for next stay",
      "Outdoor furniture wiped down and arranged",
      "Outdoor area swept, no rubbish or cigarette butts",
    ],
  },
  {
    room_type: "backyard",
    name: "Backyard",
    items: [
      "Bins emptied, cleaned and put out / brought in",
      "Lawn and paths tidy, no rubbish or guest items left",
      "Outdoor lights and gates working, yard secure",
    ],
  },
];

export function roomIcon(roomType: RoomType): string {
  switch (roomType) {
    case "bedroom":
      return "🛏️";
    case "bathroom":
      return "🛁";
    case "powder":
      return "🚽";
    case "kitchen":
      return "🍳";
    case "living":
      return "🛋️";
    case "outdoor":
      return "🍖";
    case "backyard":
      return "🌳";
  }
}
