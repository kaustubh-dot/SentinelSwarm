import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { EvidenceSchema, IncidentPlanSchema, type Evidence, type IncidentPlan } from "../planner/schema";

export type StoredPlan = {
  plan: IncidentPlan;
  reportEvidence?: Evidence;
  approvedBy?: string;
  messageTs?: string;
  sourceChannel?: string;
  threadTs?: string;
  state: "draft" | "approved" | "posted";
  refreshCount?: number;
  lastRefreshedAt?: string;
  updatedAt: string;
};

const StoredPlanSchema = z.object({
  plan: IncidentPlanSchema,
  reportEvidence: EvidenceSchema.optional(),
  approvedBy: z.string().optional(),
  messageTs: z.string().optional(),
  sourceChannel: z.string().optional(),
  threadTs: z.string().optional(),
  state: z.enum(["draft", "approved", "posted"]),
  refreshCount: z.number().int().min(0).optional(),
  lastRefreshedAt: z.string().optional(),
  updatedAt: z.string()
});

const StoreFileSchema = z.object({
  plans: z.array(StoredPlanSchema)
});

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

export class LocalPlanStore {
  private readonly plans = new Map<string, StoredPlan>();
  private loaded = false;

  constructor(
    private readonly filePath = path.join(process.cwd(), ".tmp", "plan-store.json"),
    private readonly ttlMs = DEFAULT_TTL_MS,
    private readonly now = () => Date.now()
  ) {}

  async get(planId: string | undefined): Promise<StoredPlan | undefined> {
    if (!planId) {
      return undefined;
    }

    await this.load();
    const plan = this.plans.get(planId);
    if (!plan) {
      return undefined;
    }

    if (this.isExpired(plan)) {
      this.plans.delete(planId);
      await this.save();
      return undefined;
    }

    return plan;
  }

  async set(planId: string, plan: Omit<StoredPlan, "updatedAt"> | StoredPlan): Promise<void> {
    await this.load();
    this.plans.set(planId, {
      ...plan,
      updatedAt: new Date(this.now()).toISOString()
    });
    await this.save();
  }

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    this.loaded = true;
    try {
      const payload = StoreFileSchema.parse(JSON.parse(await readFile(this.filePath, "utf8")));
      for (const plan of payload.plans) {
        if (!this.isExpired(plan)) {
          this.plans.set(plan.plan.planId, plan);
        }
      }
    } catch {
      this.plans.clear();
    }
  }

  private async save(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const plans = Array.from(this.plans.values()).filter((plan) => !this.isExpired(plan));
    await writeFile(this.filePath, `${JSON.stringify({ plans }, null, 2)}\n`, "utf8");
  }

  private isExpired(plan: StoredPlan): boolean {
    const updatedAt = Date.parse(plan.updatedAt);
    return !Number.isFinite(updatedAt) || this.now() - updatedAt > this.ttlMs;
  }
}

export const createLocalPlanStore = (): LocalPlanStore => new LocalPlanStore();
