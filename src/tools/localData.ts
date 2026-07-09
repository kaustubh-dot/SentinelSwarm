import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { EvidenceSchema, type Evidence } from "../planner/schema";

const ZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  riskNotes: z.array(z.string())
});

const VolunteerSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(z.string()),
  availability: z.string(),
  zonePreference: z.string(),
  transport: z.string()
});

const SupplySchema = z.object({
  id: z.string(),
  name: z.string(),
  zoneId: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  location: z.string()
});

const RouteSchema = z.object({
  id: z.string(),
  name: z.string(),
  zoneId: z.string(),
  status: z.enum(["open", "caution", "blocked"]),
  notes: z.string()
});

const ShelterSchema = z.object({
  id: z.string(),
  name: z.string(),
  zoneId: z.string(),
  capacity: z.number(),
  availableSpaces: z.number(),
  needs: z.array(z.string())
});

const WeatherMockSchema = z.object({
  zoneId: z.string(),
  source: z.literal("mock"),
  precipitationMm: z.number(),
  summary: z.string()
});

const FloodMockSchema = z.object({
  zoneId: z.string(),
  source: z.literal("mock"),
  floodRiskIndex: z.number(),
  summary: z.string()
});

const MockContextSchema = z.array(EvidenceSchema);

export type Zone = z.infer<typeof ZoneSchema>;
export type Volunteer = z.infer<typeof VolunteerSchema>;
export type Supply = z.infer<typeof SupplySchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Shelter = z.infer<typeof ShelterSchema>;
export type WeatherMock = z.infer<typeof WeatherMockSchema>;
export type FloodMock = z.infer<typeof FloodMockSchema>;

export type LocalData = {
  zones: Zone[];
  volunteers: Volunteer[];
  supplies: Supply[];
  routes: Route[];
  shelters: Shelter[];
};

const DEFAULT_ZONES: Zone[] = [
  {
    id: "zone-b",
    name: "Zone B",
    label: "Riverside Zone B",
    latitude: 19.076,
    longitude: 72.8777,
    riskNotes: [
      "Low-lying riverside corridor",
      "Known drainage overflow during heavy monsoon rain",
      "Primary access depends on Riverside Lane and Hill School Road"
    ]
  }
];

const DEFAULT_VOLUNTEERS: Volunteer[] = [
  {
    id: "vol-1",
    name: "Anika",
    skills: ["first-aid", "4x4 driving", "field checks"],
    availability: "5pm-9pm",
    zonePreference: "zone-b",
    transport: "4x4"
  },
  {
    id: "vol-2",
    name: "Dev",
    skills: ["evacuation support", "radio coordination"],
    availability: "5pm-9pm",
    zonePreference: "zone-b",
    transport: "4x4"
  }
];

const DEFAULT_SUPPLIES: Supply[] = [
  {
    id: "sup-1",
    name: "water cans",
    zoneId: "zone-b",
    quantity: 40,
    unit: "cans",
    location: "Main depot"
  },
  {
    id: "sup-2",
    name: "blankets",
    zoneId: "zone-b",
    quantity: 25,
    unit: "blankets",
    location: "Main depot"
  }
];

const DEFAULT_ROUTES: Route[] = [
  {
    id: "r2",
    name: "R2 via Riverside Lane",
    zoneId: "zone-b",
    status: "blocked",
    notes: "Blocked by debris and standing water for the next 4 hours."
  },
  {
    id: "r4",
    name: "R4 via Hill School Road",
    zoneId: "zone-b",
    status: "open",
    notes: "Best current access for light vehicles to Hill School shelter."
  }
];

const DEFAULT_SHELTERS: Shelter[] = [
  {
    id: "shelter-1",
    name: "Hill School shelter",
    zoneId: "zone-b",
    capacity: 60,
    availableSpaces: 18,
    needs: ["drinking water", "blankets"]
  }
];

const DEFAULT_MOCK_CONTEXT: Evidence[] = [
  {
    id: "ctx-default-1",
    source: "Built-in fallback report",
    channel: "#field-reports",
    text: "Zone B update: water is rising near Riverside Lane. Two homes requesting evacuation support. Elderly residents present.",
    confidence: 0.82,
    sourceType: "mock"
  },
  {
    id: "ctx-default-2",
    source: "Built-in fallback report",
    channel: "#routes",
    text: "Route R2 through Riverside Lane is blocked by debris and standing water. Avoid for the next 4 hours.",
    confidence: 0.84,
    sourceType: "mock"
  },
  {
    id: "ctx-default-3",
    source: "Built-in fallback report",
    channel: "#shelters",
    text: "Hill School shelter has 18 spaces, blankets available, needs drinking water by evening for Zone B evacuees.",
    confidence: 0.8,
    sourceType: "mock"
  }
];

const DEFAULT_WEATHER_MOCKS: WeatherMock[] = [
  {
    zoneId: "zone-b",
    source: "mock",
    precipitationMm: 8.4,
    summary: "Built-in weather fallback: heavy rain expected this evening, with peak hourly precipitation near 8.4 mm."
  }
];

const DEFAULT_FLOOD_MOCKS: FloodMock[] = [
  {
    zoneId: "zone-b",
    source: "mock",
    floodRiskIndex: 0.92,
    summary: "Built-in flood fallback: nearby drainage channels are near high-risk threshold for Zone B."
  }
];

const dataPath = (fileName: string): string => path.join(process.cwd(), "src", "data", fileName);

const readJson = <T>(fileName: string, schema: z.ZodType<T>, fallback: T): T => {
  try {
    const raw = fs.readFileSync(dataPath(fileName), "utf8");
    return schema.parse(JSON.parse(raw));
  } catch {
    return schema.parse(fallback);
  }
};

export const loadLocalData = (): LocalData => ({
  zones: readJson("zones.json", z.array(ZoneSchema), DEFAULT_ZONES),
  volunteers: readJson("volunteers.json", z.array(VolunteerSchema), DEFAULT_VOLUNTEERS),
  supplies: readJson("supplies.json", z.array(SupplySchema), DEFAULT_SUPPLIES),
  routes: readJson("routes.json", z.array(RouteSchema), DEFAULT_ROUTES),
  shelters: readJson("shelters.json", z.array(ShelterSchema), DEFAULT_SHELTERS)
});

export const loadMockContext = (): Evidence[] => readJson("mockContext.json", MockContextSchema, DEFAULT_MOCK_CONTEXT);

export const loadMockWeather = (zoneId: string): WeatherMock => {
  const rows = readJson("mockWeather.json", z.array(WeatherMockSchema), DEFAULT_WEATHER_MOCKS);
  return rows.find((row) => row.zoneId === zoneId) ?? rows[0] ?? DEFAULT_WEATHER_MOCKS[0];
};

export const loadMockFlood = (zoneId: string): FloodMock => {
  const rows = readJson("mockFlood.json", z.array(FloodMockSchema), DEFAULT_FLOOD_MOCKS);
  return rows.find((row) => row.zoneId === zoneId) ?? rows[0] ?? DEFAULT_FLOOD_MOCKS[0];
};

export const findZone = (zones: Zone[], input: string): Zone => {
  const normalized = input.trim().toLowerCase();
  const found = zones.find((zone) => {
    return zone.id.toLowerCase() === normalized || zone.name.toLowerCase() === normalized || zone.label.toLowerCase() === normalized;
  });

  return found ?? zones.find((zone) => zone.name === "Zone B") ?? zones[0];
};
