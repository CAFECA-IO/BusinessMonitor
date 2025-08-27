export interface INews {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
}

export const mockNews: INews[] = [
  {
    id: '1',
    title: 'Local Community Rallies to Support New Park Initiative',
    content:
      "Following months of spirited public debate and extensive deliberation, the City Council reached a landmark decision last night, officially giving the green light to 'Project Nova.' This comprehensive and exceptionally ambitious multi-year strategic plan is designed to completely reimagine and revitalize the city's historic downtown district. The project promises not only to create a wealth of new economic opportunities by attracting innovative businesses and fostering local entrepreneurship but also to develop a series of vibrant, accessible public spaces, including pedestrian-friendly plazas, modern recreational facilities, and lush green parks for community enjoyment.",
    imageUrl: '/fake_avatar/business_img_1.jpg',
  },
  {
    id: '2',
    title: 'Community Update',
    content:
      'The local community has come together to support a new park initiative aimed at enhancing green spaces and promoting outdoor activities for residents of all ages.',
    imageUrl: '/fake_avatar/business_img_2.png',
  },
  {
    id: '3',
    title: 'Economic Forecast',
    content: `Analysts have released a comprehensive economic forecast surrounding 'Project Nova,' predicting a significant uptick in job creation and local investment over the next five years. According to the report, the project is expected to generate thousands of new jobs across various sectors, stimulating the local economy and enhancing the standard of living for residents. Moreover, the anticipated increase in tourism and business activity is set to transform the downtown area into a vibrant hub of commerce and social interaction.`,
    imageUrl: '/fake_avatar/business_img_3.jpg',
  },
];
