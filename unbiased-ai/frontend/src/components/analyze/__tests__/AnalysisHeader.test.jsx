import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalysisHeader from '../AnalysisHeader';

describe('AnalysisHeader', () => {
  it('renders the header title correctly', () => {
    render(<AnalysisHeader />);
    expect(screen.getByText(/SOVEREIGN/i)).toBeInTheDocument();
    expect(screen.getByText(/AUDIT/i)).toBeInTheDocument();
  });

  it('renders neural signature when provided', () => {
    const signature = 'SIG-123-TEST';
    render(<AnalysisHeader neuralSignature={signature} />);
    expect(screen.getByText(signature)).toBeInTheDocument();
  });

  it('does not render signature proof label when no signature provided', () => {
    render(<AnalysisHeader />);
    expect(screen.queryByText(/NEURAL SIGNATURE PROOF/i)).not.toBeInTheDocument();
  });
});
