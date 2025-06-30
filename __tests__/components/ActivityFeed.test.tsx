import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityFeed from '@/components/ActivityFeed';

const mockActivities = [
  {
    type: 'contact' as const,
    id: '1',
    title: 'New Contact Added',
    date: new Date().toISOString(),
    description: 'John Doe was added.',
  },
  {
    type: 'deal' as const,
    id: '2',
    title: 'Deal Won',
    date: new Date().toISOString(),
    description: 'ACME Corp deal closed.',
  },
];

describe('ActivityFeed', () => {
  it('renders a list of activities', () => {
    render(<ActivityFeed activities={mockActivities} />);

    expect(screen.getByText('New Contact Added')).toBeInTheDocument();
    expect(screen.getByText('John Doe was added.')).toBeInTheDocument();
    expect(screen.getByText('Deal Won')).toBeInTheDocument();
    expect(
      screen.getByText('ACME Corp deal closed.')
    ).toBeInTheDocument();
  });

  it('renders an empty state when no activities are provided', () => {
    render(<ActivityFeed activities={[]} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });
});
