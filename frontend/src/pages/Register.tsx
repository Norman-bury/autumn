import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { register, login } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const isSetupMode = searchParams.get('setup') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      await register({ email, password }, isSetupMode);
      await login({ email, password });
      await refreshUser();
      navigate('/');
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || '创建账户失败'
          : '创建账户失败'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="bg-secondary w-full max-w-md rounded-lg p-8">
        <h1 className="text-accent-bright mb-6 text-2xl font-bold">
          {isSetupMode ? '初始化本机账户' : '创建账户'}
        </h1>

        {error && (
          <div className="bg-red-bright/20 border-red-bright text-red-bright mb-4 rounded border p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-muted mb-1 block text-sm font-semibold"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              required
            />
          </div>

          <PasswordInput
            value={password}
            onChange={setPassword}
            label="密码"
            required
            autoComplete="new-password"
          />

          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            label="确认密码"
            required
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-bg0 hover:bg-accent-bright w-full cursor-pointer rounded-md px-4 py-2 font-medium transition-all duration-200 ease-in-out disabled:opacity-50"
          >
            {loading ? '创建中...' : isSetupMode ? '开始使用' : '创建账户'}
          </button>
        </form>

        {!isSetupMode && (
          <p className="text-muted mt-4 text-center">
            已有账户？{' '}
            <Link
              to="/login"
              className="text-accent hover:text-accent-bright transition-all duration-200 ease-in-out"
            >
              登录
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
