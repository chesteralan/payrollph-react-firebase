import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PayrollWizardPage } from './PayrollWizardPage';

// Mock the firebase config
vi.mock('@/config/firebase', () => ({
  db: {},
}));

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ currentCompanyId: 'test-company' }),
}));

describe('PayrollWizardPage', () => {
  it('renders the wizard heading', () => {
    render(
      <BrowserRouter>
        <PayrollWizardPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Payroll Setup Wizard')).toBeTruthy();
  });
});
