import { AuthGate } from '@/components/AuthGate';
import { InstructorPanelHome } from '@/components/panels/InstructorPanel';

export default function EgitmenPanel() {
  return (
    <AuthGate role="instructor">
      <InstructorPanelHome />
    </AuthGate>
  );
}
