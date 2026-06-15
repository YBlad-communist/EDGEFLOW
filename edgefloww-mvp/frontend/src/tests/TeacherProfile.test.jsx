import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import TeacherProfileForm from "../pages/TeacherProfileForm.jsx";

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe("TeacherProfileForm", () => {
  test("renders form title", () => {
    renderWithProviders(<TeacherProfileForm />);
    expect(screen.getByText("Анкета учителя")).toBeInTheDocument();
  });
});
