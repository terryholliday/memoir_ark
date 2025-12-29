export type StoryId = string;

export interface Story {
  id: StoryId;
  title: string;
  body: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  audioUri?: string;
}
