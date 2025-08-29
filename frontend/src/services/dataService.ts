import { api } from './api';

// Types for our data entities
export interface Company {
  id: string;
  name: string;
  shuttle_number: number;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shuttle {
  id: string;
  company_id: string;
  name: string;
  shuttle_number: number;
  capacity: number;
  status: string;
  is_active: boolean;
  csv_file_path?: string;
  csv_uploaded_at?: string;
  csv_status: string;
  created_at: string;
  updated_at: string;
}

export interface ShuttleSchedule {
  id: string;
  shuttle_id: string;
  time_slot: string;
  route_description: string;
  route_type: string;
  direction: string;
  departure_time: string;
  arrival_time?: string;
  days_of_week: number[];
  is_break: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShuttleRegistration {
  id: string;
  schedule_id?: string;
  time_slot: string;
  route_type: string;
  direction: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email?: string;
  user_name: string;
  phone_number: string;
  registration_date: string;
  registration_time: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const dataService = {
  // Companies
  companies: {
    async getAll(): Promise<Company[]> {
      return api.get('/api/companies');
    },

    async getById(id: string): Promise<Company> {
      return api.get(`/api/companies/${id}`);
    },

    async create(company: Partial<Company>): Promise<Company> {
      return api.post('/api/companies', company);
    },

    async update(id: string, company: Partial<Company>): Promise<Company> {
      return api.put(`/api/companies/${id}`, company);
    },

    async delete(id: string): Promise<void> {
      return api.delete(`/api/companies/${id}`);
    }
  },

  // Shuttles
  shuttles: {
    async getAll(): Promise<Shuttle[]> {
      return api.get('/api/shuttles');
    },

    async getById(id: string): Promise<Shuttle> {
      return api.get(`/api/shuttles/${id}`);
    },

    async getByCompany(companyId: string): Promise<Shuttle[]> {
      return api.get(`/api/shuttles?company_id=${companyId}`);
    },

    async create(shuttle: Partial<Shuttle>): Promise<Shuttle> {
      return api.post('/api/shuttles', shuttle);
    },

    async update(id: string, shuttle: Partial<Shuttle>): Promise<Shuttle> {
      return api.put(`/api/shuttles/${id}`, shuttle);
    },

    async delete(id: string): Promise<void> {
      return api.delete(`/api/shuttles/${id}`);
    }
  },

  // Shuttle Schedules
  schedules: {
    async getAll(): Promise<ShuttleSchedule[]> {
      return api.get('/api/schedules');
    },

    async getById(id: string): Promise<ShuttleSchedule> {
      return api.get(`/api/schedules/${id}`);
    },

    async getByShuttle(shuttleId: string): Promise<ShuttleSchedule[]> {
      return api.get(`/api/schedules?shuttle_id=${shuttleId}`);
    },

    async create(schedule: Partial<ShuttleSchedule>): Promise<ShuttleSchedule> {
      return api.post('/api/schedules', schedule);
    },

    async update(id: string, schedule: Partial<ShuttleSchedule>): Promise<ShuttleSchedule> {
      return api.put(`/api/schedules/${id}`, schedule);
    },

    async delete(id: string): Promise<void> {
      return api.delete(`/api/schedules/${id}`);
    },

    async bulkCreate(schedules: Partial<ShuttleSchedule>[]): Promise<ShuttleSchedule[]> {
      return api.post('/api/schedules/bulk', { schedules });
    }
  },

  // Registrations
  registrations: {
    async getAll(): Promise<ShuttleRegistration[]> {
      return api.get('/api/registrations');
    },

    async getById(id: string): Promise<ShuttleRegistration> {
      return api.get(`/api/registrations/${id}`);
    },

    async getByDate(date: string): Promise<ShuttleRegistration[]> {
      return api.get(`/api/registrations?date=${date}`);
    },

    async create(registration: Partial<ShuttleRegistration>): Promise<ShuttleRegistration> {
      return api.post('/api/registrations', registration);
    },

    async update(id: string, registration: Partial<ShuttleRegistration>): Promise<ShuttleRegistration> {
      return api.put(`/api/registrations/${id}`, registration);
    },

    async delete(id: string): Promise<void> {
      return api.delete(`/api/registrations/${id}`);
    },

    async getCount(params: { date?: string; time_slot?: string; route_type?: string }): Promise<{ count: number }> {
      const queryParams = new URLSearchParams();
      if (params.date) queryParams.append('date', params.date);
      if (params.time_slot) queryParams.append('time_slot', params.time_slot);
      if (params.route_type) queryParams.append('route_type', params.route_type);
      
      return api.get(`/api/registrations/count?${queryParams}`);
    }
  },

  // CSV Processing
  csv: {
    async uploadFile(shuttleId: string, file: File): Promise<{ filename: string; originalName: string }> {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('shuttle_id', shuttleId);
      
      return api.uploadFile('/api/csv/upload', formData);
    },

    async processFile(shuttleId: string, filePath: string): Promise<{ success: boolean; processed_records: number }> {
      return api.post('/api/csv/process', { shuttle_id: shuttleId, file_path: filePath });
    },

    async uploadAndProcess(shuttleId: string, file: File): Promise<{ success: boolean; processed_records: number; filename: string }> {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('shuttle_id', shuttleId);
      
      return api.uploadFile('/api/csv/upload-and-process', formData);
    },

    async getProcessingLogs(shuttleId: string): Promise<any[]> {
      return api.get(`/api/csv/logs/${shuttleId}`);
    },

    async deleteFile(filename: string): Promise<void> {
      return api.delete(`/api/csv/file/${filename}`);
    }
  },

  // Admin functions
  admin: {
    async getStats(): Promise<any> {
      return api.get('/api/admin/stats');
    },

    async getUsers(): Promise<any[]> {
      return api.get('/api/admin/users');
    }
  },

  // Convenience methods for backward compatibility
  async getCompanies(): Promise<Company[]> {
    return this.companies.getAll();
  },

  async createCompany(company: Partial<Company>): Promise<Company> {
    return this.companies.create(company);
  },

  async updateCompany(id: string, company: Partial<Company>): Promise<Company> {
    return this.companies.update(id, company);
  },

  async deleteCompany(id: string): Promise<void> {
    return this.companies.delete(id);
  },

  async getShuttles(): Promise<Shuttle[]> {
    return this.shuttles.getAll();
  },

  async createShuttle(shuttle: Partial<Shuttle>): Promise<Shuttle> {
    return this.shuttles.create(shuttle);
  },

  async updateShuttle(id: string, shuttle: Partial<Shuttle>): Promise<Shuttle> {
    return this.shuttles.update(id, shuttle);
  },

  async deleteShuttle(id: string): Promise<void> {
    return this.shuttles.delete(id);
  },

  async getSchedules(): Promise<ShuttleSchedule[]> {
    return this.schedules.getAll();
  },

  async createSchedule(schedule: Partial<ShuttleSchedule>): Promise<ShuttleSchedule> {
    return this.schedules.create(schedule);
  },

  async updateSchedule(id: string, schedule: Partial<ShuttleSchedule>): Promise<ShuttleSchedule> {
    return this.schedules.update(id, schedule);
  },

  async deleteSchedule(id: string): Promise<void> {
    return this.schedules.delete(id);
  },

  async getRegistrations(params?: { time_slot?: string; route_type?: string; direction?: string; registration_date?: string }): Promise<ShuttleRegistration[]> {
    if (params) {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params.time_slot) queryParams.append('time_slot', params.time_slot);
      if (params.route_type) queryParams.append('route_type', params.route_type);
      if (params.direction) queryParams.append('direction', params.direction);
      if (params.registration_date) queryParams.append('registration_date', params.registration_date);
      
      return api.get(`/api/registrations?${queryParams}`);
    }
    return this.registrations.getAll();
  },

  async createRegistration(registration: Partial<ShuttleRegistration>): Promise<ShuttleRegistration> {
    return this.registrations.create(registration);
  },

  async deleteRegistration(id: string): Promise<void> {
    return this.registrations.delete(id);
  }
};