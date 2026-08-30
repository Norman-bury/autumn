import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { getProfile, updateProfile, uploadResume } from '@/lib/profile';
import type { UserProfile } from '@/lib/types';
import Loading from '../Loading';
import { SettingsBackLink } from './SettingsLayout';

export default function SettingsProfile() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      await updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url,
        city: profile.city,
        country: profile.country,
        highest_degree: profile.highest_degree,
        graduation_year: profile.graduation_year,
        target_roles: profile.target_roles,
        preferred_locations: profile.preferred_locations,
        expected_salary: profile.expected_salary,
        work_history: profile.work_history,
        education: profile.education,
        skills: profile.skills,
        projects: profile.projects,
        certificates: profile.certificates,
        languages: profile.languages,
        self_summary: profile.self_summary,
      });
      toast.success('Profile saved successfully');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(field: keyof UserProfile, value: string) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value || null });
  }

  function handleListChange(field: keyof UserProfile, value: string) {
    if (!profile) return;
    const items = value
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    setProfile({ ...profile, [field]: items.length ? items : null });
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadResume(file);
      setProfile(result.profile);
      toast.success(
        result.source === 'ai'
          ? 'Resume parsed with AI and profile updated'
          : 'Resume uploaded; profile updated with local extraction'
      );
    } catch {
      toast.error('Failed to upload or parse resume');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function formatResumeSize(sizeBytes: number | null): string | null {
    if (!sizeBytes) return null;
    if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
    return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <>
        <div className="md:hidden">
          <SettingsBackLink />
        </div>
        <div className="bg-secondary rounded-lg p-4 md:p-6">
          <Loading message="Loading profile..." />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <SettingsBackLink />
      </div>

      <form
        onSubmit={handleSave}
        className="bg-secondary rounded-lg p-4 md:p-6"
      >
        <h2 className="text-fg1 mb-4 text-xl font-bold">Profile</h2>
        <p className="text-muted mb-4 text-sm">
          Your personal information for autofill and communications.
        </p>

        <div className="border-bg3 bg-bg1 mb-6 rounded-lg border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-fg1 font-semibold">Resume parser</h3>
              <p className="text-muted text-sm">
                Upload your PDF resume to extract contact info, education, skills,
                projects and internship experience for online applications.
              </p>
              {profile?.resume_original_filename && (
                <p className="text-muted mt-2 text-xs">
                  Current: {profile.resume_original_filename}
                  {profile.resume_parsed_at
                    ? ` · parsed ${new Date(profile.resume_parsed_at).toLocaleString()}`
                    : ''}
                </p>
              )}
              {profile?.resume_versions?.length ? (
                <div className="mt-3 space-y-2">
                  {profile.resume_versions
                    .slice()
                    .reverse()
                    .map((version) => {
                      const size = formatResumeSize(version.size_bytes);
                      return (
                        <div
                          key={`${version.file_path}-${version.uploaded_at}`}
                          className="border-bg3 bg-bg2 rounded border px-3 py-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-fg1 font-medium">
                              {version.original_filename}
                            </span>
                            {version.is_current && (
                              <span className="bg-accent/15 text-accent rounded px-2 py-0.5">
                                Current
                              </span>
                            )}
                            {version.source && (
                              <span className="text-muted">{version.source}</span>
                            )}
                            {size && <span className="text-muted">{size}</span>}
                          </div>
                          <div className="text-muted mt-1">
                            uploaded {new Date(version.uploaded_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : null}
            </div>
            <label className="bg-accent text-bg0 hover:bg-accent-bright inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out">
              <i className={`bi-${uploading ? 'arrow-repeat animate-spin' : 'upload'} icon-sm`} />
              {uploading ? 'Parsing...' : 'Upload PDF'}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={uploading}
                onChange={handleResumeUpload}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* First Name */}
          <div>
            <label
              htmlFor="first-name"
              className="text-muted mb-1.5 block text-sm"
            >
              First Name
            </label>
            <input
              id="first-name"
              type="text"
              value={profile?.first_name || ''}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="John"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="last-name"
              className="text-muted mb-1.5 block text-sm"
            >
              Last Name
            </label>
            <input
              id="last-name"
              type="text"
              value={profile?.last_name || ''}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Doe"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="profile-email"
              className="text-muted mb-1.5 block text-sm"
            >
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={profile?.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john@example.com"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="text-muted mb-1.5 block text-sm">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={profile?.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="text-muted mb-1.5 block text-sm">
              City
            </label>
            <input
              id="city"
              type="text"
              value={profile?.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="San Francisco"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Country */}
          <div>
            <label
              htmlFor="country"
              className="text-muted mb-1.5 block text-sm"
            >
              Country
            </label>
            <input
              id="country"
              type="text"
              value={profile?.country || ''}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="United States"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label
              htmlFor="linkedin-url"
              className="text-muted mb-1.5 block text-sm"
            >
              LinkedIn URL
            </label>
            <input
              id="linkedin-url"
              type="url"
              value={profile?.linkedin_url || ''}
              onChange={(e) =>
                handleInputChange('linkedin_url', e.target.value)
              }
              placeholder="https://linkedin.com/in/johndoe"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="github-url" className="text-muted mb-1.5 block text-sm">
              GitHub URL
            </label>
            <input
              id="github-url"
              type="url"
              value={profile?.github_url || ''}
              onChange={(e) => handleInputChange('github_url', e.target.value)}
              placeholder="https://github.com/username"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="degree" className="text-muted mb-1.5 block text-sm">
              Highest Degree
            </label>
            <input
              id="degree"
              type="text"
              value={profile?.highest_degree || ''}
              onChange={(e) => handleInputChange('highest_degree', e.target.value)}
              placeholder="Bachelor / Master"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="graduation-year" className="text-muted mb-1.5 block text-sm">
              Graduation Year
            </label>
            <input
              id="graduation-year"
              type="text"
              value={profile?.graduation_year || ''}
              onChange={(e) => handleInputChange('graduation_year', e.target.value)}
              placeholder="2027"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="target-roles" className="text-muted mb-1.5 block text-sm">
              Target Roles
            </label>
            <input
              id="target-roles"
              type="text"
              value={profile?.target_roles?.join(', ') || ''}
              onChange={(e) => handleListChange('target_roles', e.target.value)}
              placeholder="大模型算法工程师, AI 应用开发工程师"
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="skills" className="text-muted mb-1.5 block text-sm">
              Skills
            </label>
            <textarea
              id="skills"
              value={profile?.skills?.join(', ') || ''}
              onChange={(e) => handleListChange('skills', e.target.value)}
              placeholder="Python, PyTorch, RAG, Agent, FastAPI"
              rows={3}
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="summary" className="text-muted mb-1.5 block text-sm">
              Application Summary
            </label>
            <textarea
              id="summary"
              value={profile?.self_summary || ''}
              onChange={(e) => handleInputChange('self_summary', e.target.value)}
              placeholder="A concise self introduction for application forms"
              rows={5}
              className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-bg0 hover:bg-accent-bright flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 font-medium transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <i className="bi-arrow-repeat icon-sm animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi-check-lg icon-sm" />
                Save
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
