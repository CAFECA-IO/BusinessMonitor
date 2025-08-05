export interface IBusinessBrief {
  id: number;
  name: string;
  imgSrc: string;
  businessTaxId: string;
  countOfGreenFlags: number;
  countOfRedFlags: number;
  stockPrice: number;
  stockPriceChange: number;
}

export interface IBusinessDetail extends IBusinessBrief {
  address: string;
}

export const dummyBusinesses: IBusinessDetail[] = [
  {
    id: 1,
    name: 'Business Name here with second line',
    imgSrc: '/fake_avatar/business_img_1.jpg',
    businessTaxId: '1234567890',
    countOfGreenFlags: 5,
    countOfRedFlags: 2,
    stockPrice: 150.75,
    stockPriceChange: 0.0043, // Info: (20250804 - Julian) 0.43%
    address: '123 Business St, Business City, BC 12345',
  },
  {
    id: 2,
    name: 'Another Business Name',
    imgSrc: '/fake_avatar/business_img_2.png',
    businessTaxId: '0987654321',
    countOfGreenFlags: 3,
    countOfRedFlags: 1,
    stockPrice: 200.5,
    stockPriceChange: -0.0021, // Info: (20250804 - Julian) -0.21%
    address: '456 Another Ave, Another City, AC 67890',
  },
  {
    id: 3,
    name: 'Third Business Example',
    imgSrc: '/fake_avatar/business_img_3.jpg',
    businessTaxId: '1122334455',
    countOfGreenFlags: 10,
    countOfRedFlags: 0,
    stockPrice: 75.0,
    stockPriceChange: 0.005, // Info: (20250804 - Julian) 0.50%
    address: '789 Third Blvd, Third City, TC 11223',
  },
];
