// Types matching the backend ReturnBase<T> wrapper
export interface ReturnBase<T> {
  statusCode: number;
  succeeded: boolean;
  message: string;
  errors: string[];
  data: T | null;
}

// Auth types
export type UserRole = 'Patient' | 'Doctor' | 'Admin';

export interface DecodedToken {
  userId: string;
  role: UserRole;
  exp: number;
  iat?: number;
}

export interface AuthUser {
  userId: string;
  role: UserRole;
}

// Register patient payload (matches RegisterPatientCommand.cs)
export interface RegisterPatientPayload {
  fullName: string;
  password: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string; // ISO date string "YYYY-MM-DD"
  bloodType?: string;
  chronicDiseases?: string[];
  familyHistory?: string[];
  allergies?: string[];
  currentMedications?: string[];
}

// Login payload (matches LoginCommand.cs)
export interface LoginPayload {
  email: string;
  password: string;
}

// Reset password email payload
export interface ResetPasswordEmailPayload {
  email: string;
}

// Reset password payload (matches ResetPasswordCommand.cs)
export interface ResetPasswordPayload {
  email: string;
  newPassword: string;
  resetPasswordToken: string;
}

// Refresh token payload (matches RefreshTokenCommand.cs)
export interface RefreshTokenPayload {
  accessToken: string;
}

// Change password payload (matches ChangePasswordCommand.cs)
export interface ChangePasswordPayload {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// ─── Phase 2: Patient Profile ─────────────────────────────────────────────────
// Matches GetPatientProfileResponse.cs
export interface PatientHistoryItem {
  patientId: string;
  id: number;
  name: string;
}

export interface PatientProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string; // DateOnly → ISO string "YYYY-MM-DD"
  chronicDiseases: PatientHistoryItem[];
  allergies: PatientHistoryItem[];
  currentMedication: PatientHistoryItem[];
  bloodType?: string;
  familyHistory?: PatientHistoryItem[];
}

// ─── Phase 2: Appointments ────────────────────────────────────────────────────
// Matches GetPatientAppointmentsResponse.cs
export interface AppointmentResponse {
  appointmentId: number;
  patientName: string | null;
  date: string;   // ISO DateTime string
  status: string; // "Pending" | "Confirmed" | "Completed" | "Cancelled"
  reason: string;
}

// Matches BookAppointmentCommand.cs
export interface BookAppointmentPayload {
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string;   // ISO DateTime string
  reason: string;
  status: string; // always "Pending"
}

// Matches CancelAppointmentCommand.cs
export interface CancelAppointmentPayload {
  appointmentId: number;
}

// Matches GetDoctorsForAppointmentsResponse.cs
export interface DoctorForAppointment {
  id: string;
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  availableStartTimes: string[];
}

// ─── Phase 2: AI Models ───────────────────────────────────────────────────────
// Matches ModelResponse.cs — used by Brain Tumor, X-Ray, Breast Cancer, Skin
export interface ModelDiagnosisResponse {
  classLabelEn: string;
  classLabelAr: string;
  confidenceLevel: string;
  generatedAdvice: string;
}

// Matches LabModelResponse.cs — used by Lab OCR
export interface LabAnalysisResponse {
  status: string;
  analysis: string;
  imagePath: string;
  timeStamp: string;
  cached: boolean;
}

// Matches ChatbotResponse.cs
export interface ChatbotApiResponse {
  status: string;
  sessionId: string;
  response: string;
  timeStamp: string;
  cached: boolean;
}

// Client-side chat message (not from API)
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// ─── Phase 2: Notifications ───────────────────────────────────────────────────
// Matches NotificationController anonymous object shape
export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: string;
  isRead: boolean;
  type: 'Appointment' | 'Report' | 'System';
}

// ─── Phase 3: Profile Update ──────────────────────────────────────────────────
// Matches UpdatePatientProfileCommand.cs  (PUT /api/patient/UpdateProfile)
export interface UpdatePatientProfilePayload {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string; // "YYYY-MM-DD" sent as DateOnly-compatible string
  bloodType?: string;
  familyHistory?: string[];
  chronicDiseases?: string[];
  allergies?: string[];
  currentMedications?: string[];
}

// ─── Phase 3: Medical History CRUD ───────────────────────────────────────────
// Shared add payload for allergy / chronic-disease / medication
export interface AddMedicalHistoryPayload {
  patientId: string;
  name: string;
}

// Shared delete payload — all three controllers take { id: int }
export interface DeleteMedicalHistoryPayload {
  id: number;
}

// ─── Phase 3: AI Medical Report (Python RAG service, port 8000) ──────────────
export interface MedicalReportResponse {
  status: string;
  patient_id: string;
  report: string;       // Markdown text — Arabic for patient role
  generated_at: string; // ISO datetime
  profile_based?: boolean;
}

// ─── Phase 3: Patient Warnings / NAM (Python RAG service, port 8000) ─────────
export interface PatientWarning {
  type: string;         // 'allergy' | 'drug_interaction' | etc.
  severity: string;     // 'high' | 'medium' | 'low'
  message: string;
}

export interface PatientWarningsResponse {
  status: string;
  patient_id: string;
  warnings: PatientWarning[];
}

// ─── Phase 3: Children's Health (client-side / localStorage) ─────────────────
export interface GrowthEntry {
  date: string;
  height: number; // cm
  weight: number; // kg
}

export interface VaccinationEntry {
  name: string;
  status: 'completed' | 'upcoming' | 'future';
  date?: string;     // administered or due date
  notes?: string;
}

export interface MilestoneEntry {
  label: string;
  expectedAgeMonths: number;
  achieved: boolean;
  achievedDate?: string;
}

// ─── Phase 4: Doctor Portal ───────────────────────────────────────────────────
// Matches GetDoctorAppointmentsAndDoctorInfoResponse.cs
// GET /api/doctor/GetInfoAndAppointments?DoctorId={id}
export interface DoctorPatientEntry {
  appointmentId: number;
  patientId: string;
  patientName: string;
  reason: string;
  chronicDiseases: string[];
  allergies: string[];
  currentMedicine: string[];
  appointmentDate: string; // ISO date string
  medicalReport: string;   // may be empty
}

export interface DoctorDashboardResponse {
  doctorId: string;
  doctorName: string;
  patients: DoctorPatientEntry[];
}

// PUT /api/appointment/Complete — Doctor role only
export interface CompleteAppointmentPayload {
  appointmentId: number;
}

// ─── Phase 5: Admin Portal ─────────────────────────────────────────────────────

// GET /api/patient/GetPatientsCount
export interface PatientsCountResponse {
  count: number;
}

// GET /api/doctor/GetAll — [Authorize(Roles = "Admin")]
export interface DoctorListEntry {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  // Merged from GET /api/appointment/GetDoctors (may be absent on merge failure)
  specialization?: string;
  yearsOfExperience?: number;
}

// GET /api/appointment/GetDoctors — used by admin booking form
export interface DoctorForAppointment {
  id: string;
  fullName: string;
  specialization: string;
  yearsOfExperience: number;
  availableStartTimes: string[];
}

// GET /api/appointment/GetForToday — [Authorize(Roles = "Admin")]
export interface TodayAppointmentEntry {
  id: number;
  patientName: string;
  doctorName: string;
  time: string;
  status: string;
}

// POST /api/authentication/RegisterDoctor — [Authorize(Roles = "Admin")]
export interface RegisterDoctorPayload {
  fullName: string;
  password: string;
  email: string;
  phoneNumber: string;
  yearsOfExperience: number;
  specializationId: number;
  workDays: string[];   // lowercase: saturday, sunday, ...
  startTime: string;    // "HH:mm:ss"
  endTime: string;      // "HH:mm:ss"
}

// POST /api/authentication/RegisterAdmin — [Authorize(Roles = "Admin")]
export interface RegisterAdminPayload {
  userName: string;
  email: string;
  password: string;
}

// POST /api/appointment/BookAppointmentByAdmin — [Authorize(Roles = "Admin")]
export interface BookAppointmentByAdminPayload {
  patientId: null;        // always null — no patient list endpoint
  patientName: string;    // manual text input
  doctorId: string;
  date: string;           // ISO datetime string
  reason: string;
  status: string;
}

// POST /api/appointment/Confirm — [Authorize(Roles = "Admin")]
export interface ConfirmAppointmentPayload {
  appointmentId: number;
}

// PUT /api/appointment/Cancel — [Authorize(Roles = "Patient, Admin")]
export interface CancelAppointmentPayload {
  appointmentId: number;
}

// POST /api/doctor/DeleteDoctor — [Authorize(Roles = "Admin,Doctor")]
export interface DeleteDoctorPayload {
  doctorId: string;
}

// POST /api/doctor/RestoreDoctor — [Authorize(Roles = "Admin,Doctor")]
export interface RestoreDoctorPayload {
  doctorId: string;
}

// ─── Phase 12: Doctor Extra & Reviews ──────────────────────────────────────────

export interface UpdateDoctorExtraPayload {
  doctorId: string;
  bio?: string;
  clinicAddress?: string;
  consultationFee?: number;
  governorate?: string;
  photoBase64?: string;
}

export interface DoctorExtraResponse {
  bio: string | null;
  clinicAddress: string | null;
  consultationFee: number | null;
  governorate: string | null;
  photoBase64: string | null;
}

export interface SubmitDoctorReviewPayload {
  doctorId: string;
  patientId: string;
  rating: number;
  comment?: string;
}

export interface DoctorReviewResponse {
  id: number;
  patientName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// ─── Phase 12: Website Reviews ────────────────────────────────────────────────

export interface SubmitWebsiteReviewPayload {
  patientId: string;
  firstName: string;
  rating: number;
  comment?: string;
}

export interface WebsiteReviewResponse {
  id: number;
  patientId: string;
  firstName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}
