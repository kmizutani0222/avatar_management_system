export interface NavItem {
  href: string;
  label: string;
  icon?: string;
  section?: string;
}

export const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '◫', section: '概要' },
  { href: '/users', label: 'ユーザー', icon: '👤', section: '管理' },
  { href: '/operators', label: '運営者', icon: '🏢', section: '管理' },
  { href: '/avatars', label: 'アバター', icon: '🎭', section: 'コンテンツ' },
  { href: '/parts', label: 'パーツ', icon: '🧩', section: 'コンテンツ' },
  { href: '/templates', label: 'ベーステンプレート', icon: '📦', section: 'コンテンツ' },
  { href: '/settings/expressions', label: '表情モーフ', icon: '😊', section: '設定' },
];

export const USER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'マイアバター', icon: '🎭', section: 'ホーム' },
  { href: '/account', label: 'アカウント', icon: '👤', section: 'ホーム' },
  { href: '/avatars/new', label: '新規作成', icon: '✨', section: '作成' },
  { href: '/sdk-demo', label: 'SDK デモ', icon: '🧪', section: '連携' },
];

export const OPERATOR_NAV: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '◫', section: '概要' },
  { href: '/oauth-clients', label: 'OAuth クライアント', icon: '🔑', section: '連携' },
  { href: '/api-keys', label: 'API キー', icon: '🛡', section: '連携' },
  { href: '/sandbox', label: 'SDK サンドボックス', icon: '🧪', section: '開発' },
  { href: '/sdk', label: 'SDK ガイド', icon: '📘', section: '開発' },
];

export function groupNavBySection(items: NavItem[]): Map<string, NavItem[]> {
  const map = new Map<string, NavItem[]>();
  for (const item of items) {
    const section = item.section ?? 'メニュー';
    if (!map.has(section)) map.set(section, []);
    map.get(section)!.push(item);
  }
  return map;
}
