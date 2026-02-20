import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import MerchantPartnershipInteractive from './components/MerchantPartnershipInteractive';

export const metadata: Metadata = {
  title: 'Merchant Partnership - eVoucher Platform',
  description: 'Join South Africa\'s leading social impact commerce platform. Increase revenue by 47%, gain 320+ new customers monthly, and receive free analytics tools. Same-day settlement, no setup fees, and dedicated township business support.',
};

export default function MerchantPartnershipPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <MerchantPartnershipInteractive />
      </main>
    </>
  );
}