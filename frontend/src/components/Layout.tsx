import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const { user, signOut, singleUserMode } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function isActive(path: string) {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  }

  function linkClass(path: string) {
    return isActive(path)
      ? 'text-accent-bright'
      : 'text-accent hover:text-accent-bright transition-all duration-200 ease-in-out';
  }

  function mobileLinkClass(path: string) {
    return `block py-3 ${linkClass(path)}`;
  }

  return (
    <div className="bg-primary min-h-screen">
      <nav className="bg-secondary border-tertiary border-b" ref={menuRef}>
        <a
          href="#main-content"
          className="focus:bg-accent focus:text-bg0 sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-4 focus:py-2"
        >
          跳到主要内容
        </a>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-fg1 hover:text-accent-bright flex items-center gap-2 text-xl font-bold transition-all duration-200 ease-in-out"
            >
              <span className="bg-accent text-bg0 flex h-8 w-8 items-center justify-center rounded">
                <i className="bi bi-briefcase-fill icon-md" />
              </span>
              秋招进度台
            </Link>
            {/* Desktop nav links */}
            <div className="hidden items-center gap-6 md:flex">
              <Link to="/job-leads" className={linkClass('/job-leads')}>
                岗位线索
              </Link>
              <Link to="/applications" className={linkClass('/applications')}>
                投递记录
              </Link>
              <Link to="/schedule" className={linkClass('/schedule')}>
                流程日程
              </Link>
              <Link
                to="/company-portals"
                className={linkClass('/company-portals')}
              >
                企业入口
              </Link>
              <Link to="/analytics" className={linkClass('/analytics')}>
                数据复盘
              </Link>
              <Link to="/settings" className={linkClass('/settings')}>
                设置
              </Link>
              {user?.is_admin && !singleUserMode && (
                <Link to="/admin" className={linkClass('/admin')}>
                  管理
                </Link>
              )}
            </div>
          </div>
          {/* Desktop user area */}
          <div className="hidden items-center gap-4 md:flex">
            {singleUserMode ? (
              <span className="text-muted inline-flex items-center gap-2 text-sm">
                <i className="bi bi-hdd" />
                本机模式
              </span>
            ) : (
              <>
                <span className="text-muted">{user?.email}</span>
                <button
                  onClick={signOut}
                  className="text-fg1 hover:bg-bg2 hover:text-fg0 cursor-pointer rounded-md bg-transparent px-4 py-2 transition-all duration-200 ease-in-out"
                >
                  退出
                </button>
              </>
            )}
          </div>
          {/* Mobile hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-fg1 hover:bg-bg2 hover:text-fg0 cursor-pointer rounded bg-transparent p-2 transition-all duration-200 ease-in-out md:hidden"
            aria-label="切换菜单"
            aria-expanded={menuOpen}
          >
            <i className={`bi-${menuOpen ? 'x-lg' : 'list'} icon-lg`} />
          </button>
        </div>
        {/* Mobile menu panel */}
        <div
          className="border-tertiary border-t transition-all duration-200 ease-in-out md:hidden"
          style={{
            display: 'grid',
            gridTemplateRows: menuOpen ? '1fr' : '0fr',
            opacity: menuOpen ? 1 : 0,
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <div className="px-4 pb-4">
              <Link to="/job-leads" className={mobileLinkClass('/job-leads')}>
                岗位线索
              </Link>
              <Link
                to="/applications"
                className={mobileLinkClass('/applications')}
              >
                投递记录
              </Link>
              <Link to="/schedule" className={mobileLinkClass('/schedule')}>
                流程日程
              </Link>
              <Link
                to="/company-portals"
                className={mobileLinkClass('/company-portals')}
              >
                企业入口
              </Link>
              <Link to="/analytics" className={mobileLinkClass('/analytics')}>
                数据复盘
              </Link>
              <Link to="/settings" className={mobileLinkClass('/settings')}>
                设置
              </Link>
              {user?.is_admin && !singleUserMode && (
                <Link to="/admin" className={mobileLinkClass('/admin')}>
                  管理
                </Link>
              )}
              {!singleUserMode && (
                <div className="border-tertiary mt-2 border-t pt-3 pb-2">
                  <span className="text-muted mb-3 block text-sm">
                    {user?.email}
                  </span>
                  <button
                    onClick={signOut}
                    className="text-fg1 hover:bg-bg2 hover:text-fg0 w-full cursor-pointer rounded-md bg-transparent px-4 py-2 text-left transition-all duration-200 ease-in-out"
                  >
                    退出
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main id="main-content">{children}</main>
    </div>
  );
}
