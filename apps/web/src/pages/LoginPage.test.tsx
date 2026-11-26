import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockCheckAuth = vi.fn();
const mockToggleTheme = vi.fn();
const mockSetTheme = vi.fn();

const renderLoginPage = () => {
  return render(
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: mockToggleTheme, setTheme: mockSetTheme }}>
      <AuthContext.Provider
        value={{
          user: null,
          isAuthenticated: false,
          isLoading: false,
          login: mockLogin,
          logout: mockLogout,
          checkAuth: mockCheckAuth,
        }}
      >
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>,
  );
};

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with all required inputs and attributes', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /Remember me/i });
    const submitButton = screen.getByRole('button', { name: /Sign in/i });

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autocomplete', 'email');

    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');

    expect(rememberMeCheckbox).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it('validates invalid email format and displays error message', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email address/i);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });

    await user.type(emailInput, 'not-an-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('validates password length under 8 characters', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility when eye button is clicked', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/^Password/i);
    const toggleButton = screen.getByRole('button', { name: /Show password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideButton = screen.getByRole('button', { name: /Hide password/i });
    await user.click(hideButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits valid credentials and calls login handler', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
      createdAt: new Date().toISOString(),
    });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123',
        rememberMe: false,
      });
    });
  });

  it('renders API error banner when authentication fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Invalid email or password' },
      },
    });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Invalid email or password/i);
    });
  });
});

