import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login.jsx";
import { AuthProvider } from "../contexts/AuthContext.jsx";

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe("Login Page", () => {
  test("renders login form", () => {
    renderWithProviders(<Login />);
    expect(screen.getByText("EdgeFlow")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByText("Войти")).toBeInTheDocument();
  });

  test("shows error on empty submit", async () => {
    renderWithProviders(<Login />);
    fireEvent.click(screen.getByText("Войти"));
    const emailInput = screen.getByPlaceholderText("you@example.com");
    expect(emailInput).toBeInvalid();
  });
});
