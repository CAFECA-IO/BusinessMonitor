export interface IPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  createdAt: number;
  content: string;
  countOfLikes: number;
  countOfDislikes: number;
  countOfComments: number;
}

export const mockPosts: IPost[] = [
  {
    id: 'POST-001',
    author: {
      id: 'USER-001',
      name: 'Alice Johnson',
      avatarUrl: '/fake_avatar/business_img_3.jpg',
    },
    createdAt: 1693651200,
    content:
      'This is an excellent chance for you to express your opinions! Im really curious to hear your thoughts on the recent updates. How do you feel about the changes that have been made? Lets dive into a discussion!',
    countOfLikes: 34,
    countOfDislikes: 2,
    countOfComments: 5,
  },
  {
    id: 'POST-002',
    author: {
      id: 'USER-002',
      name: 'Bob Smith',
      avatarUrl: '/fake_avatar/avatar_2.png',
    },
    createdAt: 1693737600,
    content:
      'I appreciate the efforts made towards improving user experience! The new features seem promising, but I would love to see more transparency in the implementation process. What do you all think?',
    countOfLikes: 2129,
    countOfDislikes: 123,
    countOfComments: 23,
  },
  {
    id: 'POST-003',
    author: {
      id: 'USER-003',
      name: 'Charlie Davis',
      avatarUrl: '/fake_avatar/avatar_1.png',
    },
    createdAt: 1693824000,
    content:
      'The recent updates have significantly improved my experience. The interface is more intuitive, and the performance enhancements are noticeable. Kudos to the development team for their hard work!',
    countOfLikes: 4215,
    countOfDislikes: 274,
    countOfComments: 83,
  },
  {
    id: 'POST-004',
    author: {
      id: 'USER-004',
      name: 'Diana Evans',
      avatarUrl: '/fake_avatar/business_img_2.png',
    },
    createdAt: 1693910400,
    content:
      'While I’m excited about the new changes, I have some concerns regarding performance. Have any of you faced issues post-update? Let’s troubleshoot together!',
    countOfLikes: 128,
    countOfDislikes: 56,
    countOfComments: 0,
  },
];
