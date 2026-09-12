import React from 'react';
import { Users, BookMarked, MapPin, Building, ExternalLink, Calendar, Globe } from 'lucide-react';
import { GitHubUser } from '../types';

interface UserCardProps {
  user: GitHubUser;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  const websiteUrl = user.blog
    ? user.blog.startsWith('http')
      ? user.blog
      : `https://${user.blog}`
    : null;

  return (
    <div id="user-profile-bar" className="bg-neutral-900 border-b border-neutral-800 px-4 py-3.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* User Info Left */}
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={user.avatar_url}
            alt={user.login}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl border-2 border-neutral-700 object-cover shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-neutral-100 truncate">
                {user.name || user.login}
              </h2>
              <span className="text-xs text-neutral-400 font-mono">
                @{user.login}
              </span>
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open on GitHub"
                className="text-neutral-400 hover:text-emerald-400 transition-colors p-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {user.bio && (
              <p className="text-xs text-neutral-300 mt-0.5 line-clamp-1 max-w-2xl">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats and metadata Right */}
        <div className="flex items-center gap-3 text-xs text-neutral-400 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800">
            <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-200 font-semibold">{user.public_repos}</span>
            <span>repos</span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-neutral-200 font-semibold">{user.followers}</span>
            <span>followers</span>
          </div>

          {websiteUrl && (
            <a
              id="user-website-link"
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-emerald-400 hover:text-emerald-300 hover:border-emerald-700/60 transition-colors"
              title={`Visit website: ${websiteUrl}`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[130px] font-mono text-[11px]">{user.blog}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          )}

          {user.location && (
            <div className="hidden lg:flex items-center gap-1 text-neutral-400">
              <MapPin className="w-3.5 h-3.5 text-neutral-500" />
              <span className="truncate max-w-[140px]">{user.location}</span>
            </div>
          )}

          {user.company && (
            <div className="hidden lg:flex items-center gap-1 text-neutral-400">
              <Building className="w-3.5 h-3.5 text-neutral-500" />
              <span className="truncate max-w-[140px]">{user.company}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1 text-neutral-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Since {memberSince}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
