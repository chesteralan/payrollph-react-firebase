import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PayrollDetailPage } from './PayrollDetailPage';

// Mock the firebase config
vi.mock('@/config/firebase', () => ({
  db: {},
}));

// Mock hooks
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ id: 'test-id' }) };
});

describe('PayrollDetailPage', () => {
  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <PayrollDetailPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading...')).toBeTruthy();
  });
});
