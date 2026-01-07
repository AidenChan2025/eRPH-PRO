
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
  PRIMARY = 'SR',
  SECONDARY = 'SMK',
  SJKC = 'SJKC',
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

export enum LessonStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface LessonPlan {
  id: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  grade: string;
  className?: string;
  time?: string;
  topic: string;
  date: string;
  contentStandard?: string;
  learningStandard?: string;
  objectives: string[];
  successCriteria: string[];
  activities: string[];
  teachingAids: string[];
  pak21: string[];
  assessment: string[];
  reflection?: string;
  status: LessonStatus;
  version: number;
  updatedAt: string;
  hots?: string[];
  civicValues?: string;
  history?: LessonPlan[];
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

export type DSKPStructure = Record<string, Record<string, string[]>>;

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

export interface LessonTemplate {
  id: string;
  name: string;
  subject: string;
  grade: string;
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
