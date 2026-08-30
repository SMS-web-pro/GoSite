import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

export type StoreData = {
  nextBusinessId: number;
  nextProspectId: number;
  nextCampaignId: number;
  businesses: any[];
  prospects: any[];
  campaigns: any[];
  messageLogs: any[];
};

function ensureStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial: StoreData = {
        nextBusinessId: 1,
        nextProspectId: 1,
        nextCampaignId: 1,
        businesses: [],
        prospects: [],
        campaigns: [],
        messageLogs: [],
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Local store read error:", err);
    return {
      nextBusinessId: 1,
      nextProspectId: 1,
      nextCampaignId: 1,
      businesses: [],
      prospects: [],
      campaigns: [],
      messageLogs: [],
    };
  }
}

function saveStore(data: StoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write store file:", err);
  }
}

export const localStore = {
  get: ensureStore,
  save: saveStore,

  addBusiness(b: any) {
    const data = ensureStore();
    const id = data.nextBusinessId++;
    const newBiz = { id, createdAt: new Date().toISOString(), ...b };
    data.businesses.push(newBiz);
    saveStore(data);
    return newBiz;
  },

  updateBusiness(id: number, updates: any) {
    const data = ensureStore();
    const index = data.businesses.findIndex((b) => b.id === id);
    if (index < 0) return null;
    data.businesses[index] = { ...data.businesses[index], ...updates };
    saveStore(data);
    return data.businesses[index];
  },

  getBusinessById(id: number) {
    const data = ensureStore();
    return data.businesses.find((b) => b.id === id) || null;
  },

  addProspect(p: any) {
    const data = ensureStore();
    const existingIndex = data.prospects.findIndex(
      (item) => item.businessId === p.businessId
    );
    if (existingIndex >= 0) {
      data.prospects[existingIndex] = {
        ...data.prospects[existingIndex],
        ...p,
        updatedAt: new Date().toISOString(),
      };
      saveStore(data);
      return data.prospects[existingIndex];
    }
    const id = data.nextProspectId++;
    const newProspect = {
      id,
      workflowStage: "discovered",
      paymentStatus: "pending",
      depositStatus: "pending",
      finalPaymentStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...p,
    };
    data.prospects.push(newProspect);
    saveStore(data);
    return newProspect;
  },

  getProspects() {
    const data = ensureStore();
    return data.prospects.map((prospect) => {
      const business = data.businesses.find(
        (b) => b.id === prospect.businessId
      ) || {
        id: prospect.businessId,
        name: "Entreprise locale",
      };
      return { prospect, business };
    });
  },

  getProspectById(id: number) {
    const data = ensureStore();
    const prospect = data.prospects.find((p) => p.id === id);
    if (!prospect) return null;
    const business = data.businesses.find(
      (b) => b.id === prospect.businessId
    ) || {
      id: prospect.businessId,
      name: "Entreprise locale",
    };
    return { prospect, business };
  },

  updateProspect(id: number, updates: any) {
    const data = ensureStore();
    const index = data.prospects.findIndex((p) => p.id === id);
    if (index < 0) return null;
    data.prospects[index] = {
      ...data.prospects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(data);
    return data.prospects[index];
  },

  deleteProspect(id: number) {
    const data = ensureStore();
    data.prospects = data.prospects.filter((p) => p.id !== id);
    saveStore(data);
  },

  deleteProspects(ids: number[]) {
    const data = ensureStore();
    const idSet = new Set(ids);
    const businessIds = data.prospects
      .filter((p) => idSet.has(p.id))
      .map((p) => p.businessId);
    data.prospects = data.prospects.filter((p) => !idSet.has(p.id));
    // Clean up orphan businesses
    const bizIdSet = new Set(businessIds);
    const orphanBizIds = Array.from(bizIdSet).filter(
      (bizId) => !data.prospects.some((p) => p.businessId === bizId)
    );
    data.businesses = data.businesses.filter((b) => !orphanBizIds.includes(b.id));
    saveStore(data);
    return { deleted: ids.length, deletedBusinesses: orphanBizIds.length };
  },

  addCampaign(c: any) {
    const data = ensureStore();
    const id = data.nextCampaignId++;
    const newCampaign = {
      id,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...c,
    };
    data.campaigns.push(newCampaign);
    saveStore(data);
    return newCampaign;
  },

  getCampaigns() {
    const data = ensureStore();
    return data.campaigns;
  },

  getCampaignById(id: number) {
    const data = ensureStore();
    return data.campaigns.find((c) => c.id === id) || null;
  },

  getSettings() {
    const data = ensureStore() as any;
    return data.settings || null;
  },

  saveSettings(s: any) {
    const data = ensureStore() as any;
    // Merge with existing settings to preserve 12 split-payment fields when partial updates occur
    data.settings = { ...(data.settings || {}), ...s, updatedAt: new Date().toISOString() };
    saveStore(data);
    return data.settings;
  },

  addMessageLog(log: any) {
    const data = ensureStore();
    const id = Date.now() + Math.random();
    const entry = { id, sentAt: new Date().toISOString(), ...log };
    data.messageLogs.push(entry);
    saveStore(data);
    return entry;
  },

  getMessageLogs() {
    const data = ensureStore();
    return data.messageLogs || [];
  },

  getMessageLogsByProspectId(prospectId: number) {
    const data = ensureStore();
    return (data.messageLogs || []).filter((l: any) => l.prospectId === prospectId);
  },

  getMessageLogsByCampaignId(campaignId: number) {
    const data = ensureStore();
    return (data.messageLogs || []).filter((l: any) => l.campaignId === campaignId);
  },
};
