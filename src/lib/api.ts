const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const userId = localStorage.getItem('userId');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'receptionist' | 'nurse' | 'doctor' | 'lab_tech' | 'pharmacist';
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: string;
  name: string;
  code: string;
  prefix: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export type Patient = {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string[];
  created_at: string;
  updated_at: string;
};

export type Visit = {
  id: string;
  ticket_number: string;
  patient_id: string;
  current_department_id: string | null;
  status: 'waiting' | 'in_progress' | 'completed' | 'transferred' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  chief_complaint: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  patient?: Partial<Patient>;
  department?: Department | null;
};

export type VisitStep = {
  id: string;
  visit_id: string;
  department_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assigned_staff_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  department?: Department;
};

export type QueueEntry = {
  id: string;
  visit_id: string;
  department_id: string;
  position: number;
  is_called: boolean;
  called_at: string | null;
  room_number: string | null;
  created_at: string;
  visit?: Partial<Visit> & { patient?: Partial<Patient> };
  department?: Department;
};

export type Stats = {
  total_patients: number;
  waiting: number;
  in_progress: number;
  completed_today: number;
};

export type HospitalSettings = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Hospital = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Auth API
export async function login(email: string, password: string) {
  return request<{ user: { id: string; email: string }; profile: Profile }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getSession() {
  return request<{ user: { id: string; email: string }; profile: Profile }>('/auth/session');
}

// Profiles API
export async function getProfiles() {
  return request<Profile[]>('/profiles');
}

export async function createProfile(data: Partial<Profile>) {
  return request<Profile>('/profiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProfile(id: string, data: Partial<Profile>) {
  return request<Profile>(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProfile(id: string) {
  return request(`/profiles/${id}`, { method: 'DELETE' });
}

// Departments API
export async function getDepartments() {
  return request<Department[]>('/departments');
}

export async function createDepartment(data: Partial<Department>) {
  return request<Department>('/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(id: string, data: Partial<Department>) {
  return request<Department>(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: string) {
  return request(`/departments/${id}`, { method: 'DELETE' });
}

// Patients API
export async function getPatients() {
  return request<Patient[]>('/patients');
}

export async function getPatient(id: string) {
  return request<Patient>(`/patients/${id}`);
}

export async function createPatient(data: Partial<Patient>) {
  return request<Patient>('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatient(id: string, data: Partial<Patient>) {
  return request<Patient>(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Visits API
export async function getVisits() {
  return request<Visit[]>('/visits');
}

export async function createVisit(data: Partial<Visit>) {
  return request<Visit>('/visits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateVisit(id: string, data: Partial<Visit>) {
  return request<Visit>(`/visits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Visit Steps API
export async function getVisitSteps(visitId: string) {
  return request<VisitStep[]>(`/visit-steps/${visitId}`);
}

export async function updateVisitStep(id: string, data: Partial<VisitStep>) {
  return request<VisitStep>(`/visit-steps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Queue API
export async function getQueue(departmentId?: string) {
  if (departmentId) {
    return request<QueueEntry[]>(`/queue?department_id=${departmentId}`);
  }
  return request<QueueEntry[]>('/queue');
}

export async function createQueueEntry(data: Partial<QueueEntry>) {
  return request<QueueEntry>('/queue', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQueueEntry(id: string, data: Partial<QueueEntry>) {
  return request<QueueEntry>(`/queue/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteQueueEntry(id: string) {
  return request(`/queue/${id}`, { method: 'DELETE' });
}

export async function callNextPatient(departmentId: string, roomNumber?: string) {
  return request<QueueEntry>('/queue/call-next', {
    method: 'POST',
    body: JSON.stringify({ department_id: departmentId, room_number: roomNumber }),
  });
}

// Stats API
export async function getStats() {
  return request<Stats>('/stats');
}

// SMS API
export async function sendSMS(phone: string, message: string) {
  return request<{ success: boolean; message: string; phone: string; timestamp: string }>('/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone, message }),
  });
}

// Notification API
export async function notifyPatient(visitId: string, type: 'called' | 'next' | 'reminder') {
  return request<{ success: boolean; type: string; phone: string; message: string }>(`/notify/${visitId}`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

// Hospital Settings API
export async function getHospitalSettings() {
  return request<HospitalSettings>('/hospital-settings');
}

export async function updateHospitalSettings(data: Partial<HospitalSettings>) {
  return request<HospitalSettings>('/hospital-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadHospitalSettingsLogo(logoUrl: string) {
  return request<HospitalSettings>('/hospital-settings/logo', {
    method: 'POST',
    body: JSON.stringify({ logo_url: logoUrl }),
  });
}

// Hospitals API (Superadmin)
export async function getHospitals() {
  return request<Hospital[]>('/hospitals');
}

export async function createHospital(data: Partial<Hospital>) {
  return request<Hospital>('/hospitals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHospital(id: string, data: Partial<Hospital>) {
  return request<Hospital>(`/hospitals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteHospital(id: string) {
  return request(`/hospitals/${id}`, { method: 'DELETE' });
}

export async function uploadHospitalLogo(id: string, logoUrl: string) {
  return request<Hospital>(`/hospitals/${id}/logo`, {
    method: 'POST',
    body: JSON.stringify({ logo_url: logoUrl }),
  });
}
