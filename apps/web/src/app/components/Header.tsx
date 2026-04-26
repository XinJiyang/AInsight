import { Link, NavLink } from 'react-router';
import { Search, Bell, Menu, Rss, Cpu, Bookmark, UserCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { user, logout } = useAuth()
  const userInitial = user?.name?.charAt(0).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-50 border-b border-brand-200 bg-brand-50/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="AInsight home" className="flex flex-shrink-0 items-center">
          <img
            src="/images/AInsight.svg"
            alt="AInsight"
            className="h-9 w-auto max-w-[172px] sm:h-10 sm:max-w-[208px]"
          />
        </Link>

        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AI models, companies, papers, or keywords..."
              className="w-full rounded-[8px] border border-brand-200 bg-white py-2 pl-10 pr-4 text-[15px] text-brand-900 outline-none transition focus:border-brand-accent/40 focus:ring-2 focus:ring-brand-accent/15 placeholder:text-brand-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button className="rounded-[8px] p-2 transition-colors hover:bg-brand-100 md:hidden">
            <Search size={20} className="text-brand-500" />
          </button>
          
          <button className="relative rounded-[8px] p-2 transition-colors hover:bg-brand-100">
            <Bell size={20} className="text-brand-500" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-accent"></span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-brand-200 bg-brand-100 text-sm font-bold text-brand-accent"
                title={user.email}
              >
                {userInitial}
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="hidden rounded-[8px] px-2.5 py-1.5 text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-900 sm:inline-flex"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-brand-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
            >
              <UserCircle size={16} />
              Login
            </Link>
          )}
          
          <button className="rounded-[8px] p-2 transition-colors hover:bg-brand-100 sm:hidden">
            <Menu size={20} className="text-brand-500" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-brand-200 bg-brand-50/90 px-4 scrollbar-hide">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 md:gap-8">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => 
              `flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-[15px] font-semibold transition-colors ${
                isActive 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-brand-500 hover:text-brand-900'
              }`
            }
          >
            <Rss size={16} /> Latest Feed
          </NavLink>
          
          <NavLink 
            to="/models" 
            className={({ isActive }) => 
              `flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-[15px] font-semibold transition-colors ${
                isActive 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-brand-500 hover:text-brand-900'
              }`
            }
          >
            <Cpu size={16} /> Models
          </NavLink>

          <NavLink 
            to="/bookmarks" 
            className={({ isActive }) => 
              `flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-[15px] font-semibold transition-colors ${
                isActive 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-brand-500 hover:text-brand-900'
              }`
            }
          >
            <Bookmark size={16} /> Bookmarks
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
