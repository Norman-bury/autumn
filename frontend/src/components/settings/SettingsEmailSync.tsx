import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import {
  getEmailSyncConfig,
  listRecruitmentMails,
  syncRecruitmentMails,
  updateEmailSyncConfig,
  type EmailSyncConfigUpdate,
} from '@/lib/emailSync';
import type { RecruitmentMail } from '@/lib/types';
import Loading from '../Loading';
import { SettingsBackLink } from './SettingsLayout';

const DEFAULT_CONFIG: EmailSyncConfigUpdate = {
  provider: 'imap',
  imap_host: '',
  imap_port: 993,
  username: '',
  password: '',
  use_ssl: true,
  enabled: true,
};

export default function SettingsEmailSync() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [form, setForm] = useState<EmailSyncConfigUpdate>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<RecruitmentMail[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [config, mails] = await Promise.all([
          getEmailSyncConfig(),
          listRecruitmentMails(),
        ]);
        if (config) {
          setForm({
            provider: config.provider,
            imap_host: config.imap_host,
            imap_port: config.imap_port,
            username: config.username,
            password: '',
            use_ssl: config.use_ssl,
            enabled: config.enabled,
          });
          setHasPassword(config.has_password);
        }
        setMessages(mails);
      } catch {
        toast.error('Failed to load email sync settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const config = await updateEmailSyncConfig(payload);
      setHasPassword(config.has_password);
      setForm((current) => ({ ...current, password: '' }));
      toast.success('Email sync settings saved');
    } catch {
      toast.error('Failed to save email sync settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncRecruitmentMails();
      const mails = await listRecruitmentMails();
      setMessages(mails);
      toast.success(`Imported ${result.imported}, skipped ${result.skipped}`);
    } catch {
      toast.error('Email sync failed. Check IMAP host, username and app password.');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <>
        <div className="md:hidden">
          <SettingsBackLink />
        </div>
        <div className="bg-secondary rounded-lg p-4 md:p-6">
          <Loading message="Loading email sync settings..." />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <SettingsBackLink />
      </div>
      <div className="space-y-6">
        <form onSubmit={handleSave} className="bg-secondary rounded-lg p-4 md:p-6">
          <h2 className="text-fg1 mb-2 text-xl font-bold">Email Sync</h2>
          <p className="text-muted mb-4 text-sm">
            Connect an IMAP inbox to collect recruitment notifications, interview
            invitations, assessments and offer updates.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-muted mb-1.5 block text-sm">IMAP Host</label>
              <input
                value={form.imap_host}
                onChange={(e) => setForm({ ...form, imap_host: e.target.value })}
                placeholder="imap.qq.com"
                className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-muted mb-1.5 block text-sm">IMAP Port</label>
              <input
                type="number"
                value={form.imap_port}
                onChange={(e) => setForm({ ...form, imap_port: Number(e.target.value) })}
                className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-muted mb-1.5 block text-sm">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="your@email.com"
                className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-muted mb-1.5 block text-sm">
                App Password {hasPassword ? '(leave blank to keep current)' : ''}
              </label>
              <input
                type="password"
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="text-fg1 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.use_ssl}
                onChange={(e) => setForm({ ...form, use_ssl: e.target.checked })}
              />
              Use SSL
            </label>
            <label className="text-fg1 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              Enable sync
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || saving}
              className="border-bg3 text-fg1 hover:bg-bg2 rounded-md border px-4 py-2 font-medium disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-bg0 hover:bg-accent-bright rounded-md px-4 py-2 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        <div className="bg-secondary rounded-lg p-4 md:p-6">
          <h3 className="text-fg1 mb-4 text-lg font-semibold">Recent recruitment mails</h3>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-muted text-sm">No synced recruitment emails yet.</p>
            ) : (
              messages.map((mail) => (
                <div key={mail.id} className="bg-bg1 rounded p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-accent text-xs uppercase">{mail.category}</span>
                    {mail.company && <span className="text-muted text-xs">{mail.company}</span>}
                  </div>
                  <div className="text-fg1 mt-1 font-medium">{mail.subject}</div>
                  <div className="text-muted mt-1 text-sm">{mail.snippet}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
