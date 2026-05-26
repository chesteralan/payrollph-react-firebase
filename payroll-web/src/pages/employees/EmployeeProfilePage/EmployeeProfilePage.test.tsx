import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { EmployeeProfilePage } from "./EmployeeProfilePage";

// Mock firebase
vi.mock("@/config/firebase", () => ({
  db: {},
  storage: {},
}));

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(() =>
    Promise.resolve({
      exists: () => true,
      id: "test-id",
      data: () => ({
        employeeCode: "EMP001",
        statusId: "active",
      }),
    }),
  ),
  updateDoc: vi.fn(),
  collection: vi.fn(() => ""),
  query: vi.fn(() => ""),
  where: vi.fn(() => ""),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

// Mock firebase/storage
vi.mock("firebase/storage", () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-id" }),
    useNavigate: () => vi.fn(),
  };
});

// Mock useToast
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe("EmployeeProfilePage", () => {
  it("renders loading state initially", () => {
    render(
      <MemoryRouter initialEntries={["/employees/test-id"]}>
        <Routes>
          <Route
            path="/employees/:id"
            element={<EmployeeProfilePage />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders employee code after loading", async () => {
    render(
      <MemoryRouter initialEntries={["/employees/test-id"]}>
        <Routes>
          <Route
            path="/employees/:id"
            element={<EmployeeProfilePage />}
          />
        </Routes>
      </MemoryRouter>,
    );
    // Wait for the loading to finish
    const employeeCode = await screen.findByText("EMP001");
    expect(employeeCode).toBeDefined();
  });
});
