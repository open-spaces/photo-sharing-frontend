import { render, screen } from '@testing-library/react';
import App from './App';

test('renders wedding app welcome message', () => {
  render(<App />);
  const headingElement = screen.getByText(/welcome to wedding app/i);
  expect(headingElement).toBeInTheDocument();
});
