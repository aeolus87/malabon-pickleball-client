// AdminPage type definitions

export interface Attendee {
  id: string;
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
}

export interface Venue {
  id: string;
  name: string;
  status: string;
  photoURL?: string;
  attendees: Attendee[];
  createdAt: string;
  updatedAt: string;
  timeRange?: string;
  day?: string;
  cancellationCounts?: Record<string, number>;
  latitude?: number;
  longitude?: number;
}

export interface VenueFormData {
  name: string;
  status: string;
  latitude?: string;
  longitude?: string;
}

export interface PendingStatusAction {
  venueId: string;
  currentStatus: string;
}

export interface SelectedVenue {
  id: string;
  name: string;
  status: string;
}


