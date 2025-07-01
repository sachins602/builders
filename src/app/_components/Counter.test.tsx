import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from '../_components/Counter';

describe('Counter', () => {
  it('renders with initial count', () => {
    render(<Counter />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('increments the count when increment button is clicked', () => {
    render(<Counter />);
    fireEvent.click(screen.getByRole('button', { name: /increment/i }));
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('decrements the count when decrement button is clicked', () => {
    render(<Counter />);
    fireEvent.click(screen.getByRole('button', { name: /decrement/i }));
    expect(screen.getByText('Count: -1')).toBeInTheDocument();
  });
});