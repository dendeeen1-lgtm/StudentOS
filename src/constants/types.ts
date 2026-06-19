import { UserRole, AttendanceStatus, SessionState, QRType } from './index';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  createdAt: Date;
}

export interface StudentProfile extends UserProfile {
  role: UserRole.STUDENT | UserRole.MONITOR;
  age: number;
  birthday: string;
  section: string;
  lrn: string;
  school: string;
  address: string;
  photoURL?: string;
  isApproved: boolean;
  sectionId: string;
  parentLinkCode?: string;
  parentLinkExpiry?: Date;
  linkedParentUids: string[];
}

export interface AdviserProfile extends UserProfile {
  role: UserRole.ADVISER;
  sectionId: string;
  sectionName: string;
  school: string;
}

export interface ParentProfile extends UserProfile {
  role: UserRole.PARENT;
  mobileNumber: string;
  relationship: string;
  linkedStudentUids: string[];
}

export interface Section {
  id: string;
  name: string;
  school: string;
  schoolYear: string;
  adviserUid: string;
  monitorUid?: string;
  joinCode: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  sectionId: string;
  name: string;
  state: SessionState;
  presentWindowMinutes: number;
  durationMinutes: number;
  startedAt?: Date;
  pausedAt?: Date;
  endedAt?: Date;
  scheduledStartAt?: Date;
  autoEnd: boolean;
  createdBy: string;
  qrPayloadPresent: string;
  qrPayloadExcused: string;
  qrPayloadOutside: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  sectionId: string;
  studentUid: string;
  studentName: string;
  status: AttendanceStatus;
  scannedAt?: Date;
  updatedAt: Date;
  updatedBy?: string;
  note?: string;
}

export interface ExcusedRequest {
  id: string;
  sessionId: string;
  sectionId: string;
  studentUid: string;
  studentName: string;
  studentAge: number;
  explanation: string;
  letterPhotoURL: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNote?: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface QRPayload {
  type: QRType;
  sessionId: string;
  sectionId: string;
  nonce: string;
  expiresAt: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}
