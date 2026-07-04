'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from './auth-context';

interface RegisterFormProps {
  role: 'user' | 'operator';
  onSuccess?: () => void;
}

export function RegisterForm({ role, onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [extra, setExtra] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        email,
        password,
        ...(role === 'user' ? { displayName: extra || undefined } : { companyName: extra || undefined }),
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}
      <label>
        メールアドレス
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label>
        パスワード（8文字以上）
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <label>
        {role === 'user' ? '表示名（任意）' : '会社名（任意）'}
        <input
          type="text"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          autoComplete="organization"
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? '登録中...' : '新規登録'}
      </button>
    </form>
  );
}
