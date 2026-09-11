'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth, handleApiError } from '../../../lib/api';

interface Team {
  id: string;
  name: string;
  slug: string;
  members: number;
  created: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joined: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'teams' | 'users' | 'roles'>('teams');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [newTeam, setNewTeam] = useState({ name: '', slug: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'member' as const });

  const userEmail = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}')?.email : null;
  const isSuperAdmin = userEmail === 'admin';

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'var(--color-accent-primary)';
      case 'admin': return 'var(--color-accent-cyan)';
      case 'member': return 'var(--color-text-secondary)';
      case 'viewer': return 'var(--color-text-tertiary)';
      default: return 'var(--color-text-tertiary)';
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        // Load all organizations and users for superadmin
        const [orgsRes, usersRes] = await Promise.all([
          fetchWithAuth('/auth/superadmin/organizations'),
          fetchWithAuth('/auth/superadmin/users'),
        ]);

        const orgsData = await orgsRes.json();
        const usersData = await usersRes.json();

        setTeams(orgsData.map((org: any) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          members: org.memberCount,
          created: org.created_at.split('T')[0],
        })));

        setUsers(usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.memberships[0]?.role?.toLowerCase() || 'member',
          status: 'active',
          joined: user.created_at.split('T')[0],
        })));
      } else {
        // Load current organization's users
        const usersRes = await fetchWithAuth('/users');

        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to load data:', handleApiError(error));
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (newTeam.name) {
      try {
        const response = await fetchWithAuth('/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newTeam.name,
            slug: newTeam.slug || undefined,
          }),
        });

        const org = await response.json();
        setTeams([...teams, {
          id: org.id,
          name: org.name,
          slug: org.slug,
          members: 1,
          created: new Date().toISOString().split('T')[0],
        }]);
        setNewTeam({ name: '', slug: '' });
        setShowCreateTeam(false);
      } catch (error) {
        setError(handleApiError(error));
      }
    }
  };

  const handleInviteUser = async () => {
    if (newUser.name && newUser.email && newUser.password) {
      try {
        const response = await fetchWithAuth('/users/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUser),
        });

        const user = await response.json();
        setUsers([...users, user]);
        setNewUser({ name: '', email: '', password: '', role: 'member' });
        setShowInviteUser(false);
      } catch (error) {
        setError(handleApiError(error));
      }
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetchWithAuth(`/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      }
    } catch (error) {
      setError(handleApiError(error));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      const response = await fetchWithAuth(`/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      setError(handleApiError(error));
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetchWithAuth(`/organizations/${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTeams(teams.filter(t => t.id !== teamId));
      }
    } catch (error) {
      setError(handleApiError(error));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4, letterSpacing: '-0.4px' }}>
          SETTINGS
        </h1>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          Manage teams, users, and access control
        </div>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--color-accent-red-subtle)',
          border: '1px solid var(--color-border-red)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-accent-red)',
          fontSize: 10,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 10 }}>
        {[
          { id: 'teams' as const, label: 'TEAMS', icon: '👥' },
          { id: 'users' as const, label: 'USERS', icon: '👤' },
          { id: 'roles' as const, label: 'ROLES', icon: '🔐' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 12px',
              background: activeTab === tab.id ? 'var(--color-bg-card-elevated)' : 'transparent',
              border: activeTab === tab.id ? '1px solid var(--color-border-accent)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: activeTab === tab.id ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.4px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '0.4px', margin: 0 }}>
              TEAMS ({teams.length})
            </h2>
            {isSuperAdmin && (
              <button
                onClick={() => setShowCreateTeam(true)}
                className="monara-button monara-button-xs"
                style={{ padding: '4px 10px', fontSize: 10 }}
              >
                <span>+</span> Create Team
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 10 }}>
              Loading...
            </div>
          ) : (
            <>
              {showCreateTeam && (
            <div className="scamnet-panel" style={{ marginBottom: 14, padding: 14 }}>
              <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10, letterSpacing: '0.4px' }}>
                CREATE NEW TEAM
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="e.g., Investigations Team"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: 10,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>
                    Team Slug
                  </label>
                  <input
                    type="text"
                    value={newTeam.slug}
                    onChange={(e) => setNewTeam({ ...newTeam, slug: e.target.value })}
                    placeholder="e.g., investigations-team"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: 10,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={handleCreateTeam}
                    className="monara-button monara-button-primary"
                    style={{ padding: '6px 12px', fontSize: 10, flex: 1 }}
                  >
                    Create Team
                  </button>
                  <button
                    onClick={() => setShowCreateTeam(false)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 8 }}>
            {teams.map((team) => (
              <div key={team.id} className="scamnet-panel" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                      {team.name}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      @{team.slug}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                      {team.members} members
                    </div>
                    <button
                      style={{
                        padding: '2px 6px',
                        background: 'var(--color-accent-primary-subtle)',
                        border: '1px solid var(--color-border-accent)',
                        color: 'var(--color-accent-primary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 9,
                        cursor: 'pointer',
                      }}
                    >
                      Switch
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      style={{
                        padding: '2px 6px',
                        background: 'transparent',
                        border: '1px solid var(--color-border-red)',
                        color: 'var(--color-accent-red)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 9,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                  Created {team.created}
                </div>
              </div>
            ))}
          </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '0.4px', margin: 0 }}>
              USERS ({users.length})
            </h2>
            {isSuperAdmin && (
              <button
                onClick={() => setShowInviteUser(true)}
                className="monara-button monara-button-xs"
                style={{ padding: '4px 10px', fontSize: 10 }}
              >
                <span>+</span> Invite User
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 10 }}>
              Loading...
            </div>
          ) : (
            <>
              {showInviteUser && (
            <div className="scamnet-panel" style={{ marginBottom: 14, padding: 14 }}>
              <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10, letterSpacing: '0.4px' }}>
                INVITE NEW USER
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Full name"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: 10,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: 10,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: 10,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: 10,
                      outline: 'none',
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={handleInviteUser}
                    className="monara-button monara-button-primary"
                    style={{ padding: '6px 12px', fontSize: 10, flex: 1 }}
                  >
                    Create User
                  </button>
                  <button
                    onClick={() => setShowInviteUser(false)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 8 }}>
            <>
              {users.map((user) => (
              <div key={user.id} className="scamnet-panel" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-card-elevated)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                      style={{
                        padding: '2px 6px',
                        background: 'var(--color-bg-input)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: getRoleColor(user.role),
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.4px',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="owner">OWNER</option>
                      <option value="admin">ADMIN</option>
                      <option value="member">MEMBER</option>
                      <option value="viewer">VIEWER</option>
                    </select>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        padding: '2px 6px',
                        background: 'transparent',
                        border: '1px solid var(--color-border-red)',
                        color: 'var(--color-accent-red)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 9,
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                  Joined {user.joined}
                </div>
              </div>
            ))}
            </>
          </div>
            </>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '0.4px', marginBottom: 14 }}>
            ROLE PERMISSIONS
          </h2>

          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { role: 'OWNER', color: 'var(--color-accent-primary)', permissions: ['Full access', 'Team management', 'User management', 'Billing', 'Settings'] },
              { role: 'ADMIN', color: 'var(--color-accent-cyan)', permissions: ['Team management', 'User management', 'Case creation', 'Evidence management'] },
              { role: 'MEMBER', color: 'var(--color-text-secondary)', permissions: ['Case creation', 'Evidence upload', 'Intelligence collection', 'View reports'] },
              { role: 'VIEWER', color: 'var(--color-text-tertiary)', permissions: ['View cases', 'View evidence', 'View reports', 'Read-only access'] },
            ].map((roleInfo) => (
              <div key={roleInfo.role} className="scamnet-panel" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: roleInfo.color, letterSpacing: '0.4px' }}>
                    {roleInfo.role}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                    {roleInfo.permissions.length} permissions
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {roleInfo.permissions.map((perm) => (
                    <span key={perm} style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      background: 'var(--color-bg-card-elevated)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
