export interface IAnnouncementItem {
  id: number;
  title: string;
  date: string;
  content?: string | null;
  imageUrl?: string | null;
  views?: number;
  shares?: number;
  isPinned?: boolean;
}
