import {
  ApiResponse,
  BuildingRecord,
  BuildingReport,
  DefectRecord,
  DefectSeverity,
  DefectStatus,
  DocumentRecord,
  InspectionRecord,
  MaintenanceRecord,
  MaintenanceStatus,
  UserRole,
  UserSession,
  HealthAssessmentRecord,
  UserProfile,
  AccountStatus,
  OtpPurpose,
} from "./types";

export interface SystemHealthData {
  status: string;
  timestamp: string;
  environment: string;
  database: {
    provider: string;
    connected: boolean;
    mode: string;
    notice: string;
  };
  version: string;
}

const getBaseUrl = (): string => {
  return ""; // Relative URL in browser works across environments
};

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("bp_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: `Network error or invalid server response (${response.status})`,
  }));

  if (!response.ok || !data.success) {
    const errorMsg = data.error || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  return data.data as T;
}

export const api = {
  // System Health
  async getHealth(): Promise<SystemHealthData> {
    return request<SystemHealthData>("/api/health");
  },

  // Auth
  auth: {
    async register(payload: { name: string; email: string; password: string; role?: UserRole; mobile?: string }) {
      return request<{ token: string; user: UserSession; verificationSent: boolean; message: string }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    async login(credentials: { email: string; password: string }) {
      return request<{ token: string; user: UserSession }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
    },

    async logout() {
      return request<{ message: string }>("/api/auth/logout", {
        method: "POST",
      });
    },

    async getMe() {
      return request<UserSession>("/api/auth/me");
    },

    async requestOtp(payload: { destination: string; purpose: OtpPurpose }) {
      return request<{ destination: string; expiresAt?: string }>("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    async verifyOtp(payload: { destination: string; otp: string; purpose: "EMAIL_VERIFICATION" | "MOBILE_VERIFICATION" }) {
      return request<{ message: string }>("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    async verifyEmail(payload: { email: string; otp: string }) {
      return request<{ message: string }>("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    async forgotPassword(payload: { email: string }) {
      return request<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    async resetPassword(payload: { email: string; otp: string; newPassword: string }) {
      return request<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    async changePassword(payload: { currentPassword: string; newPassword: string }) {
      return request<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
  },

  // Users (Profile & Admin Management)
  users: {
    async getMe() {
      return request<UserProfile>("/api/users/me");
    },

    async updateProfile(data: { name?: string; mobile?: string | null }) {
      return request<UserProfile>("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    async list(filters?: { search?: string; role?: UserRole; status?: AccountStatus; limit?: number; offset?: number }) {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.role) params.append("role", filters.role);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());
      const qs = params.toString() ? `?${params.toString()}` : "";
      return request<{ users: UserProfile[]; total: number; limit: number; offset: number }>(`/api/users${qs}`);
    },

    async getById(id: string) {
      return request<UserProfile>(`/api/users/${encodeURIComponent(id)}`);
    },

    async create(data: { name: string; email: string; password: string; role: UserRole; mobile?: string }) {
      return request<UserProfile>("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    async updateStatus(id: string, status: AccountStatus) {
      return request<UserProfile>(`/api/users/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },

    async updateRole(id: string, role: UserRole) {
      return request<UserProfile>(`/api/users/${encodeURIComponent(id)}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    },
  },

  // Public QR Access
  public: {
    async getBuildingPassport(passportId: string) {
      return request<BuildingRecord>(`/api/public/building/${encodeURIComponent(passportId)}`);
    },
  },

  // Buildings
  buildings: {
    async list(filters?: { search?: string; type?: string; condition?: string; maintenanceStatus?: string }) {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.type && filters.type !== "all") params.append("type", filters.type);
      if (filters?.condition && filters.condition !== "all") params.append("condition", filters.condition);
      if (filters?.maintenanceStatus && filters.maintenanceStatus !== "all") {
        params.append("maintenanceStatus", filters.maintenanceStatus);
      }
      const qs = params.toString() ? `?${params.toString()}` : "";
      return request<BuildingRecord[]>(`/api/buildings${qs}`);
    },

    async getById(id: string) {
      return request<BuildingRecord>(`/api/buildings/${encodeURIComponent(id)}`);
    },

    async create(buildingData: Partial<BuildingRecord>) {
      return request<BuildingRecord>("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildingData),
      });
    },

    async update(id: string, updates: Partial<BuildingRecord>) {
      return request<BuildingRecord>(`/api/buildings/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    },

    async getReport(id: string) {
      return request<BuildingReport>(`/api/buildings/${encodeURIComponent(id)}/report`);
    },
  },

  // Inspections
  inspections: {
    async list(buildingId: string) {
      return request<InspectionRecord[]>(`/api/buildings/${encodeURIComponent(buildingId)}/inspections`);
    },

    async create(buildingId: string, data: { date: string; observations: string; remarks: string }) {
      return request<InspectionRecord>(`/api/buildings/${encodeURIComponent(buildingId)}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  },

  // Defects
  defects: {
    async list(buildingId: string) {
      return request<DefectRecord[]>(`/api/buildings/${encodeURIComponent(buildingId)}/defects`);
    },

    async create(
      buildingId: string,
      data: {
        inspectionId?: string;
        category: string;
        location: string;
        severity: DefectSeverity;
        status?: DefectStatus;
        details: string;
        imageRef?: string;
      }
    ) {
      return request<DefectRecord>(`/api/buildings/${encodeURIComponent(buildingId)}/defects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    async update(defectId: string, updates: Partial<DefectRecord>) {
      return request<DefectRecord>(`/api/defects/${encodeURIComponent(defectId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    },
  },

  // Maintenance
  maintenance: {
    async list(buildingId: string) {
      return request<MaintenanceRecord[]>(`/api/buildings/${encodeURIComponent(buildingId)}/maintenance`);
    },

    async create(
      buildingId: string,
      data: {
        repairType: string;
        repairDate: string;
        description: string;
        cost: number;
        status?: MaintenanceStatus;
        contractor: string;
        warrantyDetails?: string;
        expectedRepairs?: string;
        futureRequirements?: string;
      }
    ) {
      return request<MaintenanceRecord>(`/api/buildings/${encodeURIComponent(buildingId)}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  },

  // Documents
  documents: {
    async list(buildingId: string) {
      return request<DocumentRecord[]>(`/api/buildings/${encodeURIComponent(buildingId)}/documents`);
    },

    async upload(buildingId: string, formData: FormData) {
      const url = `/api/buildings/${encodeURIComponent(buildingId)}/documents`;
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Document upload failed");
      }
      return data.data as DocumentRecord;
    },
  },

  // Photographs
  photographs: {
    async upload(buildingId: string, formData: FormData) {
      const url = `/api/buildings/${encodeURIComponent(buildingId)}/photographs`;
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Photo upload failed");
      }
      return data.data;
    },
  },

  // Stage 3 Health Assessments
  healthAssessments: {
    async list(buildingId: string): Promise<HealthAssessmentRecord[]> {
      return request<HealthAssessmentRecord[]>(
        `/api/buildings/${encodeURIComponent(buildingId)}/health-assessments`
      );
    },

    async getLatest(buildingId: string): Promise<HealthAssessmentRecord> {
      return request<HealthAssessmentRecord>(
        `/api/buildings/${encodeURIComponent(buildingId)}/health-assessments/latest`
      );
    },

    async getById(id: string): Promise<HealthAssessmentRecord> {
      return request<HealthAssessmentRecord>(
        `/api/health-assessments/${encodeURIComponent(id)}`
      );
    },

    async generate(buildingId: string): Promise<HealthAssessmentRecord> {
      return request<HealthAssessmentRecord>(
        `/api/buildings/${encodeURIComponent(buildingId)}/health-assessments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
    },
  },
};
