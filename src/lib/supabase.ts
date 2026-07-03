import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  patient?: Patient;
  department?: Department;
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
  visit?: Visit;
  department?: Department;
};
