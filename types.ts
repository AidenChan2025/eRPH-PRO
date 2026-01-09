
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  GPK = 'GPK',
  GPK_1 = 'GPK_1',
  GPK_HEM = 'GPK_HEM',
  GPK_KOKO = 'GPK_KOKO',
  TEACHER = 'TEACHER'
}

export enum Language {
  EN = 'en',
  MS = 'ms',
  ZH = 'zh',
  TA = 'ta',
  JV = 'jv'
}

export enum SchoolType {
  PRIMARY = 'SR', // Legacy
  SK = 'SK',
  SECONDARY = 'SMK',
  SJKC = 'SJKC',
  SJKT = 'SJKT',
  PRASEKOLAH = 'PRASEKOLAH',
  PEMULIHAN = 'PEMULIHAN',
  KELAS_BERCANTUM = 'KELAS BERCANTUM',
  ALL = 'ALL'
}

export interface LoginRecord {
  id: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
  status: 'Success' | 'Failed';
}

export interface SecurityConfig {
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  lastPasswordChange: string;
  loginAlerts: boolean;
}

export interface DashboardConfig {
  showQuote: boolean;
  showQuickLinks: boolean;
  showTasks: boolean;
  showCalendar: boolean;
  showStats: boolean;
  showRecentPlans: boolean;
  showTodaySchedule: boolean;
  themeColor: 'blue' | 'purple' | 'emerald' | 'orange' | 'rose' | 'slate';
  greetingType: 'formal' | 'casual' | 'minimal';
}

export interface SystemSettings {
  googleAnalyticsId?: string;
  googleSearchConsoleId?: string;
  googleAdsenseId?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    fromEmail: string;
  };
  cmsConfig: {
    autoCrawlEnabled: boolean;
    authorName: string;
    articlesPerDay: number;
  };
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  publishedAt: string;
  featuredImage?: string;
  viewCount: number;
}

export interface AcademicWeek {
  id: string;
  order: number;
  academicWeekValue: number;
  startDate: string;
  endDate: string;
  isHoliday: boolean;
  notes?: string;
}

export interface SchoolSettings {
  termStartDate?: string;
  weekendType?: 'FriSat' | 'SatSun';
  schoolGroup?: 'A' | 'B';
  defaultLanguage?: string;
  academicCalendar?: AcademicWeek[];
  customTimeSlots?: string[];
  customClasses?: string[];
  customSubjects?: string[];
}

export interface School {
  id: string;
  name: string;
  code: string;
  district: string;
  type?: SchoolType;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  settings?: SchoolSettings;
}

export interface ServiceRecord {
  id: string;
  schoolName: string;
  startDate: string;
  endDate: string;
  position: string;
}

export interface User {
  id: string;
  schoolId?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  grade?: string;
  signatureUrl?: string;
  dashboardConfig?: DashboardConfig;
  securityConfig?: SecurityConfig;
  bio?: string;
  serviceHistory?: ServiceRecord[];
  loginHistory?: LoginRecord[];
  google_token?: string;
}



export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum RecurrenceFrequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export interface TaskRecurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
}

export interface Task {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  assignerId: string;
  assignerName: string;
  dependencies?: string[];
  recurrence?: TaskRecurrence;
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum LeaveType {
  ANNUAL = 'Annual Leave',
  MEDICAL = 'Medical Leave',
  EMERGENCY = 'Emergency Leave',
  OFFICIAL_DUTY = 'Official Duty (CRK)',
  OTHERS = 'Others'
}

export interface LeaveRecord {
  id: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  location?: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface DSKPStandard {
  id: string | number;
  schoolType: SchoolType;
  subject: string;
  grade: string;
  contentStandard: string;
  learningStandard: string;
  topic?: string;
  temaBidang?: string;
  tema?: string;
  tajukKemahiran?: string;
  tajuk?: string;
}

export type DSKPStructure = Record<string, string[]>; // Grade -> Subjects[]

export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  class: string;
  color?: string;
}

export interface TimetableTemplate {
  id: string;
  teacherId: string;
  schoolId: string;
  name: string;
  effectiveDate: string;
  isActive: boolean;
  slots: TimetableSlot[];
}



export enum ReferenceSource {
  PUBLIC = 'Public',
  SCHOOL = 'School'
}

export interface ReferenceItem {
  id: string;
  title: string;
  description: string;
  link: string;
  source: ReferenceSource;
  schoolId?: string;
  uploadedBy: string;
  uploaderName: string;
  category: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

export interface CalendarEvent {
  id: string;
  schoolId: string;
  title: string;
  start: string;
  end?: string;
  type: 'personal' | 'school' | 'holiday' | 'term';
  group?: 'A' | 'B' | 'ALL';
  createdBy?: string;
}

export interface Email {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied';
  labels?: string[];
  replyToId?: string;
}

export interface TimetableConfig {
  id: string; // usually 'default' or a specific term ID
  label: string;
  slots: {
    day: number; // 0-6 (Sun-Sat)
    period: number;
    subjectId: string;
    classId: string;
    startTime: string;
    endTime: string;
  }[];
}

export interface DSKPStandardEntry {
  theme: string;
  topic?: string;
  sk: string; // Standard Kandungan
  sp: string; // Standard Pembelajaran
  sk_code?: string;
  sp_code?: string;
}

// Document ID: {Subject}_{Grade} e.g. "English_Year1"
export interface DSKPRecord {
  id: string;
  subject: string;
  grade: string;
  standards: DSKPStandardEntry[];
  lastUpdated: string;
}

// Composite ID: {teacherId}_{year}_{week}_{day}
// Composite ID: {teacherId}_{year}_{week}_{day}
export interface LessonRecord {
  id: string;
  teacherId: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  year: number;
  week: number;
  day: number; // 0-6

  // DSKP References
  theme?: string;
  topic?: string;
  contentStandard?: string; // SK
  learningStandard?: string; // SP

  objectives: string; // Changed to string for RichText
  activities: string; // Changed to string for RichText
  reflection?: string;
  abm?: string; // Alat Bantu Mengajar

  status: 'Draft' | 'Submitted' | 'Verified';
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySubmission {
  id: string; // Format: {teacherId}_{year}_{week}
  teacherId: string;
  schoolId: string;
  year: number;
  week: number;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
  comments?: string;

  // Integrity & Audit
  signatureUrl?: string;
  signedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}
