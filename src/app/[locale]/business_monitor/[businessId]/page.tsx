import BusinessDetailPageBody from '@/components/business/business_detail_page_body';

export const metadata = {
  title: 'CAFECA - Business Detail',
};
interface IBusinessDetailPageProps {
  params: {
    businessId: string;
  };
}

export default async function BusinessDetailPage({ params }: IBusinessDetailPageProps) {
  const { businessId } = await params;

  return <BusinessDetailPageBody businessId={businessId} />;
}
