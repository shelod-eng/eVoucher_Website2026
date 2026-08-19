import HomepageLanding from './homepage/HomepageLanding';
import MaintenancePage from './components/MaintenancePage';

export const dynamic = 'force-dynamic';

export default function Home() {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  return <HomepageLanding />;
}
