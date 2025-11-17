export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string | null;
  isAdmin?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  status: string;
  createdAt?: Date;
  attendees?: string[];
  timeRange?: string;
  day?: string;
  photoURL?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
} 