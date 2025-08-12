import TabBar from '@/components/business/tab_bar';
import Layout from '@/components/common/layout';
import { BM_URL } from '@/constants/url';

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

  const crumbsItems = [
    { name: 'Home', link: BM_URL.HOME },
    { name: 'Searching Result', link: BM_URL.SEARCH },
    { name: businessId, link: '' }, // ToDo: (20250811 - Julian) 應改為 Business name
  ];

  return (
    <Layout
      crumbsItems={crumbsItems}
      pageBgColor="bg-surface-background"
      className="gap-60px px-80px"
    >
      {/* Info: (20250811 - Julian) Tab Bar */}
      <TabBar />
    </Layout>
  );
}
