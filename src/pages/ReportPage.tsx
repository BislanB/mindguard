import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/index.js';
import { ReportForm } from '../components/report/ReportForm.js';
import type { ReportEntry } from '../types/index.js';

export function ReportPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reports = useAppStore((s) => s.reports);
  const saveReport = useAppStore((s) => s.saveReport);

  const existing = id ? reports.find((r) => r.id === id) : undefined;
  const templateId = searchParams.get('template') ?? undefined;

  const handleSave = async (report: ReportEntry) => {
    await saveReport(report);
    navigate('/history');
  };

  return (
    <ReportForm
      report={existing}
      templateId={templateId}
      onSave={handleSave}
      onCancel={() => navigate(-1)}
    />
  );
}
