export interface User {
  id: string;
  email: string;
  password: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  url: string;
  description?: string;
  createdAt: string;
}

export interface Database {
  users: User[];
  bookmarks: Bookmark[];
}

export interface JWTPayload extends Record<string, unknown> {
  userId: string;
  email: string;
}
