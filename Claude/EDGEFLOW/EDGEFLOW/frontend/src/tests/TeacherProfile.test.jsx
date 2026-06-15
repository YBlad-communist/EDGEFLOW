import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import TeacherProfileForm from "../pages/TeacherProfileForm";
import { AuthContext } from "../contexts/AuthContext.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderForm() {
  return render(
    <BrowserRouter>
      <AuthContext.Provider
        value={{
          user: { role: "teacher", username: "teacher1" },
          updateUser: vi.fn(),
          updateTeacherProfile: vi.fn(),
          loading: false,
          isTeacher: true,
        }}
      >
        <TeacherProfileForm />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe("TeacherProfileForm", () => {
  it("renders all form fields", () => {
    renderForm();
    expect(screen.getByText("ФИО")).toBeInTheDocument();
    expect(screen.getByText("Образование")).toBeInTheDocument();
    expect(screen.getByText("Специализация")).toBeInTheDocument();
    expect(screen.getByText("Часовая ставка (₽)")).toBeInTheDocument();
  });

  it("shows submit button", async () => {
    renderForm();
    const submitBtn = screen.getByText("Сохранить анкету");
    expect(submitBtn).toBeInTheDocument();
  });
});
