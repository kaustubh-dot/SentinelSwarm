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

const dataPath = (fileName: string): string => path.join(process.cwd(), "src", "data", fileName);

const readJson = <T>(fileName: string, schema: z.ZodType<T>): T => {
  const raw = fs.readFileSync(dataPath(fileName), "utf8");
  return schema.parse(JSON.parse(raw));
};

export const loadLocalData = (): LocalData => ({
  zones: readJson("zones.json", z.array(ZoneSchema)),
  volunteers: readJson("volunteers.json", z.array(VolunteerSchema)),
  supplies: readJson("supplies.json", z.array(SupplySchema)),
  routes: readJson("routes.json", z.array(RouteSchema)),
  shelters: readJson("shelters.json", z.array(ShelterSchema))
});

export const loadMockContext = (): Evidence[] => readJson("mockContext.json", MockContextSchema);

export const loadMockWeather = (zoneId: string): WeatherMock => {
  const rows = readJson("mockWeather.json", z.array(WeatherMockSchema));
  return rows.find((row) => row.zoneId === zoneId) ?? rows[0];
};

export const loadMockFlood = (zoneId: string): FloodMock => {
  const rows = readJson("mockFlood.json", z.array(FloodMockSchema));
  return rows.find((row) => row.zoneId === zoneId) ?? rows[0];
};

export const findZone = (zones: Zone[], input: string): Zone => {
  const normalized = input.trim().toLowerCase();
  const found = zones.find((zone) => {
    return zone.id.toLowerCase() === normalized || zone.name.toLowerCase() === normalized || zone.label.toLowerCase() === normalized;
  });

  return found ?? zones.find((zone) => zone.name === "Zone B") ?? zones[0];
};
