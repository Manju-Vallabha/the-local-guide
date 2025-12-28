import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LanguageDisplayCard from './LanguageDisplayCard';
import type { SupportedLanguage } from '../types/translation';

describe('LanguageDisplayCard', () => {
  const mockOnLanguageChange = vi.fn();

  beforeEach(() => {
    mockOnLanguageChange.mockClear();
  });

  it('displays the current language correctly', () => {
    render(
      <LanguageDisplayCard
        currentLanguage="hi"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    expect(screen.getByText('Hindi')).toBeInTheDocument();
    expect(screen.getByText('हिन्दी')).toBeInTheDocument();
    expect(screen.getByText('🇮🇳')).toBeInTheDocument();
  });

  it('enters edit mode when clicked', () => {
    render(
      <LanguageDisplayCard
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(screen.getByText('Change Language')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onLanguageChange when saving a new language', async () => {
    const mockAsyncOnLanguageChange = vi.fn().mockResolvedValue(undefined);
    
    render(
      <LanguageDisplayCard
        currentLanguage="en"
        onLanguageChange={mockAsyncOnLanguageChange}
      />
    );

    // Enter edit mode
    const card = screen.getByRole('button');
    fireEvent.click(card);

    // Change language selection
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'hi' } });

    // Save changes
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAsyncOnLanguageChange).toHaveBeenCalledWith('hi');
    });
  });

  it('cancels edit mode without calling onLanguageChange', () => {
    render(
      <LanguageDisplayCard
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    // Enter edit mode
    const card = screen.getByRole('button');
    fireEvent.click(card);

    // Change language selection
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'hi' } });

    // Cancel changes
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnLanguageChange).not.toHaveBeenCalled();
    expect(screen.getAllByText('English')[0]).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <LanguageDisplayCard
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        disabled={true}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '-1');
    
    fireEvent.click(card);
    
    // Should not enter edit mode
    expect(screen.queryByText('Change Language')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <LanguageDisplayCard
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    const card = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(screen.getByText('Change Language')).toBeInTheDocument();
    
    // Test Escape key to cancel
    fireEvent.keyDown(card, { key: 'Escape' });
    expect(screen.queryByText('Change Language')).not.toBeInTheDocument();
  });
});