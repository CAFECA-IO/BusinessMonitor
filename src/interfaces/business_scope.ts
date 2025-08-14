export interface IBusinessScope {
  id: string;
  code: string;
  description: string;
}

export const mockBusinessScopes: IBusinessScope[] = [
  {
    id: '1',
    code: 'I301010',
    description: 'Information Software Services',
  },
  {
    id: '2',
    code: 'I301011',
    description: 'Data Processing Services',
  },
  {
    id: '3',
    code: 'I301012',
    description: 'Software Development Services',
  },
  {
    id: '4',
    code: 'I301013',
    description: 'IT Consulting Services',
  },
  {
    id: '5',
    code: 'I301014',
    description: 'Web Hosting Services',
  },
  {
    id: '6',
    code: 'I301015',
    description: 'Cloud Computing Services',
  },
  {
    id: '7',
    code: 'I301016',
    description: 'Cybersecurity Services',
  },
];
