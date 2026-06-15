import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import Login from "../pages/Login";
import { AuthContext } from "../contexts/AuthContext.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin(loginFn = vi.fn()) {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ login: loginFn, user: null, loading: false }}>
        <Login />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe("Login page", () => {
  it("renders login form", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByText("Войти")).toBeInTheDocument();
  });

  it("calls login on submit", async () => {
    const mockLogin = vi.fn();
    renderLogin(mockLogin);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Войти"));
    await waitFor(() => { expect(mockLogin).toHaveBeenCalled(); });
  });
});
