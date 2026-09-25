/**
 * Item catalog: categories → types → suggested maintenance tasks.
 * Pure data, safe to import from client and server.
 */

export type IntervalUnit = "day" | "week" | "month" | "year";
export type Priority = "low" | "medium" | "high" | "critical";

export interface TaskTemplate {
  title: string;
  every: number;
  unit: IntervalUnit;
  priority: Priority;
}

export interface ItemType {
  id: string;
  label: string;
  tasks: TaskTemplate[];
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  /** Tailwind colour token used for chips and charts. */
  color: string;
  types: ItemType[];
}

const t = (title: string, every: number, unit: IntervalUnit, priority: Priority = "medium"): TaskTemplate => ({
  title,
  every,
  unit,
  priority,
});

export const CATEGORIES: Category[] = [
  {
    id: "home_systems",
    label: "Home systems",
    emoji: "🏠",
    color: "sky",
    types: [
      {
        id: "hvac",
        label: "HVAC / Central air",
        tasks: [
          t("Replace air filter", 3, "month", "high"),
          t("Professional tune-up", 1, "year"),
          t("Clean outdoor condenser", 1, "year", "low"),
        ],
      },
      {
        id: "furnace",
        label: "Furnace / Boiler",
        tasks: [t("Annual inspection", 1, "year", "high"), t("Replace filter", 3, "month")],
      },
      {
        id: "heat_pump",
        label: "Heat pump",
        tasks: [t("Service & refrigerant check", 1, "year"), t("Clean filters", 1, "month")],
      },
      {
        id: "water_heater",
        label: "Water heater",
        tasks: [
          t("Flush tank", 1, "year"),
          t("Test pressure relief valve", 1, "year", "high"),
          t("Inspect anode rod", 3, "year", "low"),
        ],
      },
      {
        id: "roof",
        label: "Roof",
        tasks: [t("Roof inspection", 1, "year"), t("Clear moss & debris", 6, "month", "low")],
      },
      {
        id: "gutters",
        label: "Gutters & downspouts",
        tasks: [t("Clean gutters", 6, "month")],
      },
      {
        id: "chimney",
        label: "Chimney / Fireplace",
        tasks: [t("Chimney sweep & inspection", 1, "year", "high")],
      },
      {
        id: "septic",
        label: "Septic system",
        tasks: [t("Pump septic tank", 3, "year", "high"), t("Inspect system", 1, "year")],
      },
      {
        id: "solar",
        label: "Solar panels",
        tasks: [t("Clean panels", 6, "month", "low"), t("Inverter check", 1, "year")],
      },
      {
        id: "windows_doors",
        label: "Windows & doors",
        tasks: [t("Check seals & weatherstripping", 1, "year", "low")],
      },
    ],
  },
  {
    id: "appliances",
    label: "Appliances",
    emoji: "🧊",
    color: "violet",
    types: [
      {
        id: "refrigerator",
        label: "Refrigerator",
        tasks: [
          t("Clean condenser coils", 6, "month"),
          t("Replace water filter", 6, "month"),
          t("Check door seals", 1, "year", "low"),
        ],
      },
      {
        id: "washer",
        label: "Washing machine",
        tasks: [t("Run cleaning cycle", 1, "month", "low"), t("Inspect hoses", 1, "year")],
      },
      {
        id: "dryer",
        label: "Clothes dryer",
        tasks: [t("Clean dryer vent duct", 1, "year", "high"), t("Clean lint trap housing", 3, "month")],
      },
      {
        id: "dishwasher",
        label: "Dishwasher",
        tasks: [t("Clean filter", 1, "month", "low"), t("Descale", 6, "month", "low")],
      },
      {
        id: "oven",
        label: "Oven / Range",
        tasks: [t("Deep clean", 6, "month", "low"), t("Check gas connection", 1, "year")],
      },
      {
        id: "microwave",
        label: "Microwave",
        tasks: [t("Clean & inspect door", 6, "month", "low")],
      },
      {
        id: "range_hood",
        label: "Range hood",
        tasks: [t("Clean / replace grease filter", 3, "month")],
      },
      {
        id: "garbage_disposal",
        label: "Garbage disposal",
        tasks: [t("Clean & deodorise", 1, "month", "low")],
      },
      {
        id: "coffee_machine",
        label: "Coffee machine",
        tasks: [t("Descale", 2, "month", "low"), t("Replace water filter", 2, "month", "low")],
      },
      {
        id: "vacuum",
        label: "Vacuum cleaner",
        tasks: [t("Clean / replace filter", 3, "month", "low")],
      },
      {
        id: "water_softener",
        label: "Water softener / filter",
        tasks: [t("Refill salt", 1, "month"), t("Replace cartridge", 6, "month")],
      },
    ],
  },
  {
    id: "vehicle",
    label: "Vehicles",
    emoji: "🚗",
    color: "amber",
    types: [
      {
        id: "car",
        label: "Car / SUV",
        tasks: [
          t("Oil & filter change", 6, "month", "high"),
          t("Tyre rotation", 6, "month"),
          t("Brake inspection", 1, "year", "high"),
          t("Replace cabin air filter", 1, "year", "low"),
          t("Registration / insurance renewal", 1, "year", "critical"),
        ],
      },
      {
        id: "ev",
        label: "Electric vehicle",
        tasks: [
          t("Tyre rotation", 6, "month"),
          t("Brake fluid check", 2, "year"),
          t("Software & battery health check", 1, "year", "low"),
        ],
      },
      {
        id: "motorcycle",
        label: "Motorcycle",
        tasks: [t("Oil change", 6, "month", "high"), t("Chain clean & lube", 1, "month")],
      },
      {
        id: "bicycle",
        label: "Bicycle / e-bike",
        tasks: [t("Tune-up", 1, "year"), t("Chain lube", 1, "month", "low")],
      },
      {
        id: "truck",
        label: "Truck / Van",
        tasks: [t("Oil change", 6, "month", "high"), t("Transmission service", 2, "year")],
      },
      {
        id: "rv",
        label: "RV / Camper",
        tasks: [t("Winterise", 1, "year", "high"), t("Roof seal inspection", 1, "year")],
      },
      {
        id: "boat",
        label: "Boat",
        tasks: [t("Engine service", 1, "year", "high"), t("Hull cleaning", 1, "year")],
      },
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    emoji: "💻",
    color: "indigo",
    types: [
      {
        id: "laptop",
        label: "Laptop / Computer",
        tasks: [t("Back up data", 1, "month", "high"), t("Clean fans & vents", 1, "year", "low")],
      },
      {
        id: "phone",
        label: "Phone / Tablet",
        tasks: [t("Back up device", 1, "month"), t("Battery health check", 1, "year", "low")],
      },
      {
        id: "tv",
        label: "TV / Home theater",
        tasks: [t("Firmware update & dust", 6, "month", "low")],
      },
      {
        id: "router",
        label: "Wi-Fi router / Network",
        tasks: [t("Firmware update", 3, "month", "high"), t("Rotate Wi-Fi password", 1, "year")],
      },
      {
        id: "printer",
        label: "Printer",
        tasks: [t("Clean print heads", 3, "month", "low")],
      },
      {
        id: "camera",
        label: "Camera / Drone",
        tasks: [t("Sensor & lens cleaning", 6, "month", "low")],
      },
      {
        id: "ups_battery",
        label: "UPS / Battery backup",
        tasks: [t("Self-test", 3, "month"), t("Replace battery", 3, "year")],
      },
    ],
  },
  {
    id: "outdoor",
    label: "Outdoor & garden",
    emoji: "🌿",
    color: "emerald",
    types: [
      {
        id: "lawn_mower",
        label: "Lawn mower",
        tasks: [t("Sharpen blade", 1, "year"), t("Oil change & spark plug", 1, "year")],
      },
      {
        id: "pool",
        label: "Pool / Hot tub",
        tasks: [t("Test water chemistry", 1, "week", "high"), t("Clean filter", 1, "month")],
      },
      {
        id: "sprinklers",
        label: "Irrigation / Sprinklers",
        tasks: [t("Spring start-up", 1, "year"), t("Winterise / blow-out", 1, "year", "high")],
      },
      {
        id: "deck",
        label: "Deck / Patio",
        tasks: [t("Clean & reseal", 2, "year")],
      },
      {
        id: "bbq",
        label: "BBQ / Grill",
        tasks: [t("Deep clean & check gas lines", 6, "month")],
      },
      {
        id: "snow_blower",
        label: "Snow blower",
        tasks: [t("Pre-season service", 1, "year")],
      },
      {
        id: "generator",
        label: "Generator",
        tasks: [t("Run test", 1, "month", "high"), t("Oil change", 1, "year")],
      },
      {
        id: "fence",
        label: "Fence / Gate",
        tasks: [t("Inspect & repair", 1, "year", "low")],
      },
    ],
  },
  {
    id: "safety",
    label: "Safety & security",
    emoji: "🛡️",
    color: "rose",
    types: [
      {
        id: "smoke_detector",
        label: "Smoke detector",
        tasks: [
          t("Test alarm", 1, "month", "critical"),
          t("Replace battery", 1, "year", "high"),
          t("Replace unit", 10, "year"),
        ],
      },
      {
        id: "co_detector",
        label: "Carbon monoxide detector",
        tasks: [t("Test alarm", 1, "month", "critical"), t("Replace unit", 7, "year")],
      },
      {
        id: "fire_extinguisher",
        label: "Fire extinguisher",
        tasks: [t("Check pressure gauge", 1, "month", "high"), t("Professional inspection", 1, "year")],
      },
      {
        id: "security_system",
        label: "Alarm / Cameras",
        tasks: [t("Test system & sensors", 3, "month")],
      },
      {
        id: "first_aid",
        label: "First aid kit",
        tasks: [t("Restock & check expiry", 6, "month")],
      },
    ],
  },
  {
    id: "plumbing",
    label: "Plumbing",
    emoji: "🚿",
    color: "cyan",
    types: [
      {
        id: "sump_pump",
        label: "Sump pump",
        tasks: [t("Test pump", 3, "month", "high")],
      },
      {
        id: "drains",
        label: "Drains",
        tasks: [t("Clean drains", 3, "month", "low")],
      },
      {
        id: "faucets_toilets",
        label: "Faucets & toilets",
        tasks: [t("Check for leaks", 6, "month")],
      },
      {
        id: "main_shutoff",
        label: "Main water shut-off",
        tasks: [t("Exercise valve", 1, "year")],
      },
    ],
  },
  {
    id: "electrical",
    label: "Electrical",
    emoji: "⚡",
    color: "yellow",
    types: [
      {
        id: "panel",
        label: "Breaker panel",
        tasks: [t("Inspect panel", 5, "year")],
      },
      {
        id: "gfci",
        label: "GFCI outlets",
        tasks: [t("Test GFCI outlets", 1, "month", "high")],
      },
      {
        id: "lighting",
        label: "Lighting",
        tasks: [t("Replace bulbs & clean fixtures", 1, "year", "low")],
      },
      {
        id: "ev_charger",
        label: "EV charger",
        tasks: [t("Inspect cable & connector", 6, "month")],
      },
    ],
  },
  {
    id: "personal",
    label: "Personal belongings",
    emoji: "⌚",
    color: "fuchsia",
    types: [
      {
        id: "watch",
        label: "Watch",
        tasks: [t("Battery / service", 2, "year"), t("Water-resistance test", 1, "year", "low")],
      },
      {
        id: "jewelry",
        label: "Jewelry",
        tasks: [t("Clean & check clasps", 6, "month", "low")],
      },
      {
        id: "shoes",
        label: "Shoes / Boots",
        tasks: [t("Clean, condition & resole check", 3, "month", "low")],
      },
      {
        id: "clothing",
        label: "Clothing / Suits",
        tasks: [t("Dry clean", 3, "month", "low")],
      },
      {
        id: "luggage",
        label: "Luggage",
        tasks: [t("Inspect wheels & zips", 1, "year", "low")],
      },
      {
        id: "instrument",
        label: "Musical instrument",
        tasks: [t("Restring / tune", 3, "month"), t("Professional setup", 1, "year")],
      },
      {
        id: "furniture",
        label: "Furniture",
        tasks: [t("Clean & tighten fittings", 1, "year", "low")],
      },
      {
        id: "mattress",
        label: "Mattress",
        tasks: [t("Rotate / flip", 3, "month", "low")],
      },
    ],
  },
  {
    id: "health_fitness",
    label: "Health & fitness",
    emoji: "🏋️",
    color: "lime",
    types: [
      {
        id: "treadmill",
        label: "Treadmill / Gym equipment",
        tasks: [t("Lubricate belt", 3, "month"), t("Tighten bolts", 6, "month", "low")],
      },
      {
        id: "cpap",
        label: "CPAP / Medical device",
        tasks: [t("Replace mask & filters", 1, "month", "high"), t("Replace tubing", 3, "month")],
      },
      {
        id: "air_purifier",
        label: "Air purifier / Humidifier",
        tasks: [t("Replace filter", 6, "month"), t("Clean tank", 1, "week", "low")],
      },
      {
        id: "glasses",
        label: "Glasses / Contacts",
        tasks: [t("Eye exam", 1, "year")],
      },
    ],
  },
  {
    id: "other",
    label: "Other",
    emoji: "📦",
    color: "slate",
    types: [{ id: "custom", label: "Custom item", tasks: [] }],
  },
];

const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return categoryById.get(id);
}

export function getItemType(categoryId: string, typeId: string): ItemType | undefined {
  return getCategory(categoryId)?.types.find((ty) => ty.id === typeId);
}

export function categoryLabel(id: string): string {
  return getCategory(id)?.label ?? "Other";
}

export function typeLabel(categoryId: string, typeId: string): string {
  return getItemType(categoryId, typeId)?.label ?? typeId.replace(/_/g, " ");
}

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]];
