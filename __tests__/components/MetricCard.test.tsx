import React from 'react';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

describe('MetricCard', () => {
  it('renders the metric card with correct title, value, and icon', () => {
    render(
      <MetricCard
        title='Total Users'
        value={12345}
        icon={Users}
        color='primary'
        format='number'
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('12,345')).toBeInTheDocument();

    // Check if the icon is rendered
    const icon = screen.getByTestId('metric-icon');
    expect(icon).toBeInTheDocument();
  });
});
