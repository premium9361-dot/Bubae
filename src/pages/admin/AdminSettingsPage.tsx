import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchActiveSessions,
  revokeSession,
  logoutAllOtherDevices,
  formatRelativeTime,
  getCurrentSessionTokenId,
  DeviceSession,
} from '../../services/sessionTracker';
import {
  Shield,
  KeyRound,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  RefreshCw,
  Lock,
  User,
  Trash2,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { user, changePassword, signOut } = useAuth();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Active Sessions State
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsActionLoading, setSessionsActionLoading] = useState(false);
  const [sessionsSuccess, setSessionsSuccess] = useState<string | null>(null);
  const [confirmingRevokeId, setConfirmingRevokeId] = useState<string | null>(null);
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);

  const currentTokenId = getCurrentSessionTokenId();

  const loadSessions = async () => {
    if (!user) return;
    setSessionsLoading(true);
    const data = await fetchActiveSessions(user.id);
    setSessions(data);
    setSessionsLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (result.success) {
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.error || 'Failed to update password.');
    }
  };

  const handleRevokeSingle = async (sessionTokenId: string) => {
    setSessionsActionLoading(true);
    setSessionsSuccess(null);
    await revokeSession(sessionTokenId);
    if (user) {
      const data = await fetchActiveSessions(user.id);
      setSessions(data);
    }
    setSessionsActionLoading(false);
    setSessionsSuccess('Session revoked successfully.');
  };

  const handleLogoutAllOther = async () => {
    if (!user) return;
    setSessionsActionLoading(true);
    setSessionsSuccess(null);
    await logoutAllOtherDevices(user.id);
    const data = await fetchActiveSessions(user.id);
    setSessions(data);
    setSessionsActionLoading(false);
    setSessionsSuccess('All other device sessions have been logged out.');
  };

  const getDeviceIcon = (deviceType: 'Desktop' | 'Mobile' | 'Tablet') => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-[#BE185D]" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-[#BE185D]" />;
      case 'Desktop':
      default:
        return <Laptop className="w-4 h-4 text-[#BE185D]" />;
    }
  };

  const otherSessionsCount = sessions.filter(s => s.sessionTokenId !== currentTokenId).length;

  return (
    <AdminLayout activeTab="settings">
      <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="border-b border-stone-200 pb-5">
          <span className="text-[11px] uppercase tracking-widest text-[#BE185D] font-bold">
            Bubaé Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Security & Account Settings
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage administrator credentials, password requirements, and active device sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Account & Password Settings */}
          <div className="lg:col-span-6 space-y-6">
            {/* Account Card */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <div className="p-1.5 rounded-lg bg-[#FFF0F3] text-[#BE185D]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Administrator Account</h2>
                  <p className="text-[11px] text-stone-500">Authenticated profile details</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-500 block text-[11px] font-medium mb-1">
                    Admin Username
                  </span>
                  <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl font-mono text-stone-800 font-medium">
                    {user?.username || 'BUBAE2008'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-[#FFF9FA] border border-[#F9CAD5]/40 rounded-xl">
                    <span className="text-[10px] text-stone-500 block uppercase tracking-wider font-semibold">
                      Role
                    </span>
                    <span className="text-xs font-bold text-[#BE185D] capitalize">
                      {user?.role || 'Admin'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FFF9FA] border border-[#F9CAD5]/40 rounded-xl">
                    <span className="text-[10px] text-stone-500 block uppercase tracking-wider font-semibold">
                      Access Status
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      Authorized
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <div className="p-1.5 rounded-lg bg-[#FFF0F3] text-[#BE185D]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Change Password</h2>
                  <p className="text-[11px] text-stone-500">Update your administrator password securely</p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block">
                    Current Password <span className="text-[#BE185D]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] text-xs bg-stone-50/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block">
                    New Password <span className="text-[#BE185D]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] text-xs bg-stone-50/40"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">
                    Must be at least 8 characters. Do not share your password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-700 block">
                    Confirm New Password <span className="text-[#BE185D]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] text-xs bg-stone-50/40"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black text-[#FFF0F3] font-bold text-xs rounded-xl transition-all duration-300 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {passwordLoading ? 'Verifying & Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Active Devices & Session Management */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#FFF0F3] text-[#BE185D]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-stone-900">Active Devices</h2>
                    <p className="text-[11px] text-stone-500">Currently connected administrator sessions</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadSessions}
                  disabled={sessionsLoading}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                  title="Refresh device list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sessionsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {sessionsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{sessionsSuccess}</span>
                </div>
              )}

              {/* Sessions List */}
              <div className="space-y-3">
                {sessionsLoading ? (
                  <div className="py-8 text-center text-xs text-stone-500">
                    Checking active device sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-500">
                    No active sessions recorded.
                  </div>
                ) : (
                  sessions.map(sess => {
                    const isCurrent = sess.sessionTokenId === currentTokenId;

                    return (
                      <div
                        key={sess.sessionTokenId}
                        className={`p-4 rounded-xl border transition-all text-xs ${
                          isCurrent
                            ? 'bg-[#FFF5F8]/70 border-[#F7D8E2] shadow-2xs'
                            : 'bg-stone-50/50 border-stone-200/80 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white border border-stone-200/60 shadow-2xs mt-0.5">
                              {getDeviceIcon(sess.deviceType)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900">
                                  {sess.browser} • {sess.os}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BE185D] text-white tracking-wide">
                                    Current Session
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-stone-500 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  <span>
                                    {isCurrent
                                      ? 'Active now'
                                      : `Last active: ${formatRelativeTime(sess.lastActiveAt)}`}
                                  </span>
                                </span>
                                <span>•</span>
                                <span>{sess.deviceType}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {isCurrent ? (
                              <span className="text-[11.5px] text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                This Device
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={sessionsActionLoading}
                                onClick={() => setConfirmingRevokeId(sess.sessionTokenId)}
                                className="px-3 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Remove Device</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Subtle In-Place Confirmation Step */}
                        {!isCurrent && confirmingRevokeId === sess.sessionTokenId && (
                          <div className="mt-3.5 pt-3.5 border-t border-rose-100 bg-rose-50/70 p-3.5 rounded-xl space-y-2.5 transition-all duration-300 animate-in fade-in">
                            <div className="flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-rose-900">Remove this device?</h4>
                                <p className="text-[11px] text-rose-700 leading-relaxed">
                                  This will sign out this device and require the Admin to log in again.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                disabled={sessionsActionLoading}
                                onClick={() => setConfirmingRevokeId(null)}
                                className="px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={sessionsActionLoading}
                                onClick={async () => {
                                  await handleRevokeSingle(sess.sessionTokenId);
                                  setConfirmingRevokeId(null);
                                }}
                                className="px-3 py-1.5 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                              >
                                {sessionsActionLoading ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Log Out All Other Devices */}
              {otherSessionsCount > 0 && (
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  {confirmingLogoutAll ? (
                    <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2.5 transition-all duration-300 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-rose-900">Log out all other devices?</h4>
                          <p className="text-[11px] text-rose-700 leading-relaxed">
                            This will immediately terminate all {otherSessionsCount} other connected sessions. Those devices will be required to enter the Admin username and password again.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={sessionsActionLoading}
                          onClick={() => setConfirmingLogoutAll(false)}
                          className="px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={sessionsActionLoading}
                          onClick={async () => {
                            await handleLogoutAllOther();
                            setConfirmingLogoutAll(false);
                          }}
                          className="px-3.5 py-1.5 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-2xs flex items-center gap-1.5"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>{sessionsActionLoading ? 'Logging out...' : 'Log Out All Other Devices'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={sessionsActionLoading}
                        onClick={() => setConfirmingLogoutAll(true)}
                        className="w-full py-2.5 px-4 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out All Other Devices ({otherSessionsCount})</span>
                      </button>
                      <p className="text-[10px] text-stone-500 text-center mt-1">
                        Terminates all other connected browser sessions except this current device.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Current Session Summary Card */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs text-xs space-y-2.5">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block">
                Session Security Notice
              </span>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Bubaé Studio utilizes encrypted sessions. Password hashes and credentials are never transmitted in clear text or exposed on customer-facing routes.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-rose-700 font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out of this device</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
