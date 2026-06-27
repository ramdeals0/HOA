export type ResolutionType = 'RESOLUTION' | 'VIEWPOINT';
export type ResolutionStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export type ResolutionSummary = {
  id: string;
  title: string;
  description: string | null;
  type: ResolutionType;
  status: ResolutionStatus;
  opensAt: string | null;
  closesAt: string | null;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
  options: Array<{ id: string; label: string; sortOrder: number }>;
  voteCount: number;
  userVote: { optionId: string; createdAt: string } | null;
  votingOpen: boolean;
  results: Array<{
    optionId: string;
    label: string;
    count: number;
    percentage: number;
  }> | null;
};

export function resolutionTypeLabel(type: ResolutionType) {
  return type === 'RESOLUTION' ? 'Board Resolution' : 'Community Viewpoint';
}

export function resolutionStatusLabel(status: ResolutionStatus) {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'OPEN':
      return 'Open';
    case 'CLOSED':
      return 'Closed';
    default:
      return status;
  }
}

export function resolutionStatusVariant(status: ResolutionStatus): 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'OPEN':
      return 'success';
    case 'CLOSED':
      return 'outline';
    default:
      return 'warning';
  }
}
