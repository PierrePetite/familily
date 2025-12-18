import { SetupWizard } from '@/components/setup/setup-wizard';

export const metadata = {
  title: 'Familily einrichten',
  description: 'Richte deinen Familienkalender ein',
};

export default function SetupPage() {
  return <SetupWizard />;
}
