export interface IAnnouncement {
  id: string;
  date: number;
  content: string;
}

export const mockAnnouncements: IAnnouncement[] = [
  {
    id: 'ANN-001',
    date: 1696118400,
    content: 'We are excited to announce the launch of our new feature!',
  },
  {
    id: 'ANN-002',
    date: 1696204800,
    content: 'Scheduled maintenance will occur on September 15th from 1 AM to 3 AM UTC.',
  },
  {
    id: 'ANN-003',
    date: 1696291200,
    content: 'Our team has expanded! Welcome our new members joining this month.',
  },
  {
    id: 'ANN-004',
    date: 1696377600,
    content:
      'We have updated our privacy policy. Please review the changes at your earliest convenience.',
  },
];
