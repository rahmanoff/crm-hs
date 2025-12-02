import React from 'react';
import { render, screen } from '@testing-library/react';
import TrendChart from '@/components/TrendChart';

const sampleData = [
  {
    date: '2025-01-01',
    contacts: 1,
    companies: 0,
    deals: 0,
    revenue: 0,
    lostRevenue: 0,
  },
  {
    date: '2025-01-02',
    contacts: 2,
    companies: 1,
    deals: 1,
    revenue: 100,
    lostRevenue: 0,
  },
];

describe('TrendChart', () => {
  it('renders a line chart with provided data', () => {
    const { container } = render(
      <div style={{ width: 800, height: 400 }}>
        <TrendChart
          title='Revenue Trends'
          data={sampleData}
          type='line'
          dataKeys={['revenue']}
          colors={['#10b981']}
        />
      </div>
    );

    // Title is rendered
    expect(screen.getByText('Revenue Trends')).toBeInTheDocument();
    // Recharts should render an SVG container
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // At least one <path> should be present for the line
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('renders an area chart with provided data', () => {
    const { container } = render(
      <div style={{ width: 800, height: 400 }}>
        <TrendChart
          title='Revenue Area'
          data={sampleData}
          type='area'
          dataKeys={['revenue']}
          colors={['#10b981']}
        />
      </div>
    );

    expect(screen.getByText('Revenue Area')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Area chart should render paths as well (area shape + lines)
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });
});
