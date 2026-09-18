/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  User,
  Camera,
  KeyRound,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  Edit3,
  Lock,
  Mail,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/auth';
import { useAdminStore } from '@/lib/data/adminStore';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
}

type ViewMode = 'overview' | 'edit_profile' | 'reset_password';

export function UserDrawer({ isOpen, onClose, user }: UserDrawerProps) {
  const router = useRouter();
  const { updateMyProfile } = useAdminStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  // Overrides when modified in the current session
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);

  const displayName = nameOverride !== null ? nameOverride : (user?.full_name || 'TwoStep Forward Staff');
  const avatarUrl = avatarOverride !== null ? (avatarOverride || null) : (user?.avatar_url || null);

  // Edit Profile States
  const [nameInput, setNameInput] = useState(user?.full_name || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Reset States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClose = () => {
    setViewMode('overview');
    setProfileMsg(null);
    setPasswordMsg(null);
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  if (!isOpen) return null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    handleClose();
    router.push('/login');
    router.refresh();
  };

  const displayEmail = user?.email || 'learner@twostepforward.com';
  const displayId = user?.id ? user.id.replace(/-/g, '').slice(0, 11) : '50035940404';

  const roleLabel = (() => {
    switch (user?.role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'org_admin':
        return 'Organization Admin';
      case 'manager':
        return 'Manager';
      case 'instructor':
        return 'Instructor';
      default:
        return 'Learner';
    }
  })();

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMsg({ type: 'error', text: 'Please select an image file (JPG, PNG, or WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image must be under 5MB.' });
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setProfileMsg(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatars');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload image.');
      }

      const newAvatarUrl = uploadData.url as string;
      setAvatarOverride(newAvatarUrl);

      // Persist to profile in DB
      await updateMyProfile({
        name: displayName,
        avatarUrl: newAvatarUrl,
      });

      setProfileMsg({ type: 'success', text: 'Profile photo updated successfully!' });
      router.refresh();
    } catch (err: unknown) {
      setProfileMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Photo upload failed',
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Photo Removal
  const handleRemovePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      setProfileMsg(null);
      setAvatarOverride('');

      await updateMyProfile({
        name: displayName,
        avatarUrl: '',
      });

      setProfileMsg({ type: 'success', text: 'Profile photo removed.' });
      router.refresh();
    } catch (err: unknown) {
      setProfileMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not remove photo.',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Save Profile Name
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setProfileMsg({ type: 'error', text: 'Please enter your full name.' });
      return;
    }

    try {
      setIsSaving(true);
      setProfileMsg(null);

      await updateMyProfile({
        name: nameInput.trim(),
        avatarUrl: avatarUrl || undefined,
      });

      setNameOverride(nameInput.trim());
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh();
      setTimeout(() => {
        setViewMode('overview');
      }, 700);
    } catch (err: unknown) {
      setProfileMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle In-App Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    try {
      setIsPasswordUpdating(true);
      setPasswordMsg(null);

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setViewMode('overview');
      }, 1000);
    } catch (err: unknown) {
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not update password.',
      });
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  // Handle Email Password Reset Link
  const handleSendResetEmail = async () => {
    try {
      setIsSendingResetEmail(true);
      setPasswordMsg(null);

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(displayEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setPasswordMsg({
        type: 'success',
        text: `A reset link was sent to ${displayEmail}. Check your inbox.`,
      });
    } catch (err: unknown) {
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not send reset link.',
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Hidden Native File Input for Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-xl flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Bar (Close or Back) */}
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
              {viewMode !== 'overview' ? (
                <button
                  onClick={() => {
                    setViewMode('overview');
                    setProfileMsg(null);
                    setPasswordMsg(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Profile</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Account
                </span>
              )}

              <button
                onClick={handleClose}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* VIEW MODE: OVERVIEW */}
            {viewMode === 'overview' && (
              <>
                {/* Profile Header & Avatar */}
                <div className="px-6 py-6 text-center border-b border-slate-100">
                  <div className="relative w-20 h-20 mx-auto mb-3 group">
                    <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xs">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                      ) : avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-slate-400 stroke-[1.8]" />
                      )}
                    </div>

                    {/* Camera Button to Quick Upload */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      title="Upload photo"
                      className="absolute bottom-0 right-0 w-7 h-7 bg-white hover:bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center shadow-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{displayName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{displayEmail}</p>

                  <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {roleLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ID: {displayId}
                    </span>
                  </div>

                  {profileMsg && (
                    <div
                      className={`mt-3 p-2 rounded-md text-xs text-left flex items-start gap-2 ${
                        profileMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {profileMsg.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <span>{profileMsg.text}</span>
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="p-4 space-y-1.5 border-b border-slate-100">
                  {/* Edit Profile */}
                  <button
                    onClick={() => {
                      setNameInput(displayName);
                      setViewMode('edit_profile');
                      setProfileMsg(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Edit3 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-800">Edit Profile</div>
                        <div className="text-[11px] text-slate-400">Name & profile photo</div>
                      </div>
                    </div>
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => {
                      setViewMode('reset_password');
                      setPasswordMsg(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-800">Reset Password</div>
                        <div className="text-[11px] text-slate-400">Update or request reset link</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Appearance Section */}
                <div className="p-5">
                  <h4 className="text-xs font-semibold text-slate-700 mb-3">
                    Appearance
                  </h4>
                  <div className="w-28">
                    <div className="p-2 rounded-lg border border-indigo-600 ring-1 ring-indigo-600/30 text-center bg-indigo-50/10">
                      <div className="w-full h-10 bg-white border border-slate-200 rounded p-1 flex flex-col gap-1 mb-1.5 shadow-2xs">
                        <div className="w-4 h-1 bg-slate-300 rounded" />
                        <div className="w-8 h-1 bg-slate-200 rounded" />
                        <div className="w-6 h-1 bg-slate-200 rounded" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-700">Light</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* VIEW MODE: EDIT PROFILE */}
            {viewMode === 'edit_profile' && (
              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Edit Profile</h3>

                {profileMsg && (
                  <div
                    className={`mb-4 p-2.5 rounded-md text-xs flex items-start gap-2 ${
                      profileMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {profileMsg.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                {/* Avatar change controls */}
                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {isUploadingPhoto ? (
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400 stroke-[1.8]" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isUploadingPhoto}
                        className="block text-[11px] text-red-600 hover:text-red-700 font-medium cursor-pointer"
                      >
                        Remove photo
                      </button>
                    )}
                    <p className="text-[10px] text-slate-400">JPG, PNG, or WebP. Max 5MB.</p>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary,#E11D48)] focus:border-[var(--brand-primary,#E11D48)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={displayEmail}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Managed by your organization administrator
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      disabled
                      value={roleLabel}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-2 px-3 rounded-md bg-[var(--brand-primary,#E11D48)] hover:bg-[var(--brand-primary-hover,#BE123C)] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('overview')}
                      disabled={isSaving}
                      className="px-3 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW MODE: RESET PASSWORD */}
            {viewMode === 'reset_password' && (
              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Reset Password</h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Set a new password directly or request a reset link to your email.
                </p>

                {passwordMsg && (
                  <div
                    className={`mb-4 p-2.5 rounded-md text-xs flex items-start gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {passwordMsg.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                {/* Direct Password Change Form */}
                <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary,#E11D48)] focus:border-[var(--brand-primary,#E11D48)]"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary,#E11D48)] focus:border-[var(--brand-primary,#E11D48)]"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPasswordUpdating}
                    className="w-full py-2 px-3 rounded-md bg-[var(--brand-primary,#E11D48)] hover:bg-[var(--brand-primary-hover,#BE123C)] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPasswordUpdating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    <span>Update Password</span>
                  </button>
                </form>

                {/* Divider */}
                <div className="my-5 flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] uppercase font-semibold text-slate-400">or</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Email Reset Link Button */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={isSendingResetEmail}
                    className="w-full py-2 px-3 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingResetEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Send Reset Link to Email</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Sends a recovery link to {displayEmail}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button at Bottom */}
          <div className="p-5 border-t border-slate-100 flex justify-center bg-slate-50/50">
            <button
              onClick={handleSignOut}
              className="w-full py-2 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
