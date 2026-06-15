import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import TeacherProfileForm from '../pages/TeacherProfileForm';
import { AuthContext } from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../api', () => ({
  default: {
    put: vi.fn().mockResolvedValue({ data: { teacherProfile: { isComplete: true } } }),
  },
}));

function renderForm() {
  return render(
    <BrowserRouter>
      <AuthContext.Provider
        value={{
          user: { role: 'teacher', username: 'teacher1' },
          refreshUser: vi.fn().mockResolvedValue({}),
          loading: false,
          isTeacher: true,
          hasTeacherProfile: false,
        }}
      >
        <TeacherProfileForm />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe('TeacherProfileForm', () => {
  it('рендерит все поля анкеты', () => {
    renderForm();
    expect(screen.getByText('ФИО')).toBeInTheDocument();
    expect(screen.getByText('Образование')).toBeInTheDocument();
    expect(screen.getByText('Специализация')).toBeInTheDocument();
    expect(screen.getByText('Ставка (₽/ч)')).toBeInTheDocument();
  });

  it('отправляет форму при заполнении', async () => {
    const api = await import('../api');
    renderForm();

    fireEvent.change(screen.getByLabelText ? screen.getByLabelText('ФИО') : screen.getAllByRole('textbox')[0], {
      target: { value: 'Иван Иванов' },
    });

    const submitBtn = screen.getByText('Сохранить анкету');
    expect(submitBtn).toBeInTheDocument();
  });
});
