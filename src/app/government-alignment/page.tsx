import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import GovernmentAlignmentInteractive from './components/GovernmentAlignmentInteractive';

export const metadata: Metadata = {
  title: 'Government Alignment - eVoucher Platform',
  description:
    'Comprehensive policy alignment, real-time impact analytics, advanced fraud prevention, and transparency tools for South African social welfare programs. Partner with eVoucher for accountable and measurable social impact delivery.',
};

export default function GovernmentAlignmentPage() {
  return (
    <>
      <Header />
      <GovernmentAlignmentInteractive />
    </>
  );
}
