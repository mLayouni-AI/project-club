import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Projects from "../pages/Projects";
import { useAuth } from "../context/AuthContext";
import { projectsAPI } from "../services/api";

const mocks = vi.hoisted(() => ({ getAll: vi.fn(), create: vi.fn(), delete: vi.fn(), tasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn() }));
vi.mock("../services/api", () => ({ projectsAPI: mocks, errorMessage: (error) => error.message }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

describe("Projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 2 },
      hasCapability: (capability) => capability === "projects.propose_project",
    });
    projectsAPI.getAll.mockResolvedValue([]);
    projectsAPI.tasks.mockResolvedValue({ results: [], count: 0, next: null, previous: null });
  });

  it("reports a failed proposal without showing a false success", async () => {
    projectsAPI.create.mockRejectedValue(new Error("Serveur indisponible"));
    render(<MemoryRouter><Projects /></MemoryRouter>);
    fireEvent.click(await screen.findByText("Proposer un projet"));
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Outil étudiant" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Une proposition de test." } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer la proposition" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Serveur indisponible");
    expect(screen.queryByText("Projet ajouté avec succès !")).not.toBeInTheDocument();
    expect(projectsAPI.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Outil étudiant" }));
    expect(projectsAPI.tasks).toHaveBeenCalledWith({ page: 1 });
  });

  it("loads project tasks and persists a status change", async () => {
    useAuth.mockReturnValue({
      user: { id: 2 },
      hasCapability: (capability) => capability === "projects.manage_tasks",
    });
    projectsAPI.getAll.mockResolvedValue([{ id: 1, name: "Projet DIA", task_count: 1 }]);
    projectsAPI.tasks.mockResolvedValue({
      results: [{ id: 7, project: 1, project_name: "Projet DIA", title: "Préparer la maquette", status: "todo", priority: "normal", assignee: 2, assignee_name: "Membre DIA" }],
      count: 1,
      next: null,
      previous: null,
    });
    projectsAPI.updateTask.mockResolvedValue({ data: { id: 7, status: "in_progress" } });

    render(<MemoryRouter><Projects /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "À faire" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "En cours" })).toBeInTheDocument();
    const status = await screen.findByRole("combobox", { name: "Statut de Préparer la maquette" });
    fireEvent.change(status, { target: { value: "in_progress" } });

    await waitFor(() => expect(projectsAPI.updateTask).toHaveBeenCalledWith(7, { status: "in_progress" }));
  });

  it("links an accessible project card to its detail page", async () => {
    projectsAPI.getAll.mockResolvedValue([{ id: 41, name: "Projet DIA", description: "Projet public", status: "approved", domain: "ai" }]);
    render(<MemoryRouter><Projects /></MemoryRouter>);

    expect(await screen.findByRole("link", { name: /ouvrir le projet/i })).toHaveAttribute("href", "/projects/41");
  });
});
