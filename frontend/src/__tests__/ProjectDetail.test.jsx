import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectDetail from "../pages/ProjectDetail";
import { useAuth } from "../context/AuthContext";
import { projectsAPI } from "../services/api";

const mocks = vi.hoisted(() => ({
  getById: vi.fn(), tasks: vi.fn(), getMemberships: vi.fn(), getMembershipCandidates: vi.fn(), addMembership: vi.fn(),
  getMilestones: vi.fn(), createMilestone: vi.fn(), deleteMilestone: vi.fn(), completeMilestone: vi.fn(), reopenMilestone: vi.fn(),
  getFiles: vi.fn(), uploadFile: vi.fn(), deleteFile: vi.fn(), downloadFile: vi.fn(), getTaskComments: vi.fn(), addTaskComment: vi.fn(),
  updateTask: vi.fn(), createTask: vi.fn(), deleteTask: vi.fn(),
}));

vi.mock("../services/api", () => ({ projectsAPI: mocks, errorMessage: (error) => error.message }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

function renderProject() {
  return render(
    <MemoryRouter initialEntries={["/projects/7"]}>
      <Routes><Route path="/projects/:id" element={<ProjectDetail />} /></Routes>
    </MemoryRouter>,
  );
}

describe("ProjectDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 3 },
      loading: false,
      hasCapability: (capability) => capability === "projects.manage_team" || capability === "projects.manage_tasks",
    });
    projectsAPI.getById.mockResolvedValue({ data: { id: 7, name: "Projet DIA", domain: "ai", status: "in_progress", member_count: 1, task_count: 1 } });
    projectsAPI.tasks.mockResolvedValue({ results: [{ id: 12, project: 7, project_name: "Projet DIA", title: "Préparer l'atelier", status: "todo", assignee: 3 }] });
    projectsAPI.getMemberships.mockResolvedValue([]);
    projectsAPI.getMembershipCandidates.mockResolvedValue([{ id: 4, full_name: "Membre DIA" }]);
    projectsAPI.addMembership.mockResolvedValue({ data: { id: 5, user_name: "Membre DIA", role: "member" } });
    projectsAPI.getMilestones.mockResolvedValue([]);
    projectsAPI.createMilestone.mockResolvedValue({ data: { id: 9, title: "Version bêta" } });
    projectsAPI.getFiles.mockResolvedValue([]);
    projectsAPI.uploadFile.mockResolvedValue({ data: { id: 11 } });
    projectsAPI.getTaskComments.mockResolvedValue([]);
    projectsAPI.addTaskComment.mockResolvedValue({ data: { id: 20 } });
  });

  it("loads the team candidates and sends the project ID with a membership", async () => {
    renderProject();
    expect(await screen.findByRole("heading", { name: "Projet DIA" })).toBeInTheDocument();
    fireEvent.click(await screen.findByText("Ajouter un membre"));
    await screen.findByRole("option", { name: "Membre DIA" });
    fireEvent.change(screen.getByLabelText("Membre"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => expect(projectsAPI.addMembership).toHaveBeenCalledWith("7", { user: "4", role: "member" }));
    expect(projectsAPI.getMembershipCandidates).toHaveBeenCalledWith("7");
  });

  it("posts comments through the selected task endpoint", async () => {
    renderProject();
    await screen.findByRole("heading", { name: "Projet DIA" });
    fireEvent.click(screen.getByRole("button", { name: "Commentaires" }));
    await waitFor(() => expect(projectsAPI.getTaskComments).toHaveBeenCalledWith("12"));
    fireEvent.change(screen.getByLabelText("Votre commentaire"), { target: { value: "Le premier jet est prêt." } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    await waitFor(() => expect(projectsAPI.addTaskComment).toHaveBeenCalledWith("12", { content: "Le premier jet est prêt." }));
  });

  it("uploads the selected file with its project ID", async () => {
    renderProject();
    await screen.findByRole("heading", { name: "Projet DIA" });
    fireEvent.click(screen.getByRole("button", { name: "Livrables" }));
    await screen.findByText("Aucun livrable déposé pour ce projet.");
    const file = new File(["%PDF-1.7 test"], "livrable.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Fichier à téléverser"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Déposer" }));

    await waitFor(() => expect(projectsAPI.uploadFile).toHaveBeenCalledWith("7", file));
  });
});
