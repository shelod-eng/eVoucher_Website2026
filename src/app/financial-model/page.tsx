import type { Metadata } from 'next';
import FinancialModelInteractive from './components/FinancialModelInteractive';

export const metadata: Metadata = {
  title: 'Financial Model - eVoucher Platform',
  description:
    "Transparent economic framework showing sustainable benefit distribution across consumers, merchants, and government stakeholders. Complete breakdown of revenue model, cost structure, growth projections, and investment opportunities for South Africa's leading social impact commerce platform.",
};

export default function FinancialModelPage() {
  return <FinancialModelInteractive />;
}
