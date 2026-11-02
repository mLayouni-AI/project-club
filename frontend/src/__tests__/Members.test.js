import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Members from '../pages/Members';

// Mock the useAuth hook
jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: jest.fn(),
}));

const MockMembersPage = ({ user }) => {
  useAuth.mockReturnValue({
    user: user,
    members: [
      { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 'member' },
      { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', role: 'admin' },
    ],
    addMember: jest.fn(),
    removeMember: jest.fn(),
    updateMember: jest.fn(),
  });

  return (
    <MemoryRouter>
      <Members />
    </MemoryRouter>
  );
};

describe('Members Component', () => {
  test('renders members list for admin user', () => {
    render(<MockMembersPage user={{ role: 'admin', first_name: 'Admin', last_name: 'User' }} />);
    
    expect(screen.getByText('Membres du Club')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Admin should see add member form
    expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
  });

  test('renders members list for regular member', () => {
    render(<MockMembersPage user={{ role: 'member', first_name: 'Regular', last_name: 'User' }} />);
    
    expect(screen.getByText('Membres du Club')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Regular members should not see add member form
    expect(screen.queryByPlaceholderText('Prénom')).not.toBeInTheDocument();
  });

  test('shows admin-only buttons for admin user', () => {
    render(<MockMembersPage user={{ role: 'admin', first_name: 'Admin', last_name: 'User' }} />);
    
    const editButtons = screen.getAllByText('Modifier');
    const deleteButtons = screen.getAllByText('Supprimer');
    
    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  test('does not show admin-only buttons for regular member', () => {
    render(<MockMembersPage user={{ role: 'member', first_name: 'Regular', last_name: 'User' }} />);
    
    const editButtons = screen.queryAllByText('Modifier');
    const deleteButtons = screen.queryAllByText('Supprimer');
    
    expect(editButtons).toHaveLength(0);
    expect(deleteButtons).toHaveLength(0);
  });

  test('allows admin to add a new member', async () => {
    const addMemberMock = jest.fn();
    useAuth.mockReturnValue({
      user: { role: 'admin', first_name: 'Admin', last_name: 'User' },
      members: [],
      addMember: addMemberMock,
      removeMember: jest.fn(),
      updateMember: jest.fn(),
    });

    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Prénom'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    
    fireEvent.click(screen.getByText('Ajouter'));

    await waitFor(() => {
      expect(addMemberMock).toHaveBeenCalledWith({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        role: 'member'
      });
    });
  });
});