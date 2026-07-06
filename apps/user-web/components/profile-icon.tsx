'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@ams/web-auth';
import { getProfileIconUrl } from '@/lib/user-profile';

export function ProfileIcon({
  size = 96,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const { profile, token } = useAuth();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.hasProfileIcon || !token) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    fetch(getProfileIconUrl(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile?.hasProfileIcon, token, profile?.id]);

  const initials = (profile?.displayName ?? profile?.email ?? '?').slice(0, 1).toUpperCase();

  return (
    <div
      className={`profile-icon${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {url ? (
        <img src={url} alt="" className="profile-icon-image" />
      ) : (
        <span className="profile-icon-fallback">{initials}</span>
      )}
    </div>
  );
}
