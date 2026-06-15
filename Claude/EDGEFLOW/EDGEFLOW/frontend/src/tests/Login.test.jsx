import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../pages/Login';
import { AuthContext } from '../context/AuthContext';

// Мок useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

function renderLogin(loginFn = vi.fn()) {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ login: loginFn, user: null, loading: false }}>
        <Login />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe('Login page', () => {
  it('рендерит форму входа', () => {
    renderLogin();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
  });

  it('вызывает login при сабмите', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ role: 'student' });
    renderLogin(mockLogin);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('показывает ошибку при неуспешном входе', async () => {
    const toast = await import('react-hot-toast');
    const mockLogin = vi.fn().mockRejectedValue({
      response: { data: { error: 'Неверный email или пароль' } },
    });
    renderLogin(mockLogin);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Неверный email или пароль');
    });
  });
});
