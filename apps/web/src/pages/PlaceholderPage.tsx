import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({
  title,
  description = 'Tính năng đang trong lộ trình phát triển của các giai đoạn tiếp theo.',
}: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <EmptyState
        title={title}
        description={description}
        icon={<Sparkles className="h-6 w-6 text-indigo-600" />}
        actionText="Quay lại Tổng quan"
        onAction={() => navigate('/')}
      />
    </div>
  );
}
