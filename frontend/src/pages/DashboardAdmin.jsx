import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function DashboardAdmin() {
  const { user, members, projects, announcements } = useAuth();

  const stats = [
    {
      title: "Membres",
      value: members.length,
      color: "from-[--color-primary] to-[--color-secondary]",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: "/members"
    },
    {
      title: "Projets",
      value: projects.length,
      color: "from-[--color-accent] to-orange-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      link: "/projects"
    },
    {
      title: "Événements",
      value: announcements.length,
      color: "from-green-500 to-green-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: "/announcements"
    },
    {
      title: "Admins",
      value: members.filter(m => m.role === 'admin').length,
      color: "from-purple-600 to-purple-700",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: "/members"
    }
  ];

  const quickActions = [
    {
      title: "Gérer les Membres",
      description: "Ajouter, modifier ou supprimer des membres",
      link: "/members",
      color: "bg-[--color-primary] hover:bg-[--color-secondary]",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: "Gérer les Projets",
      description: "Créer et suivre les projets du club",
      link: "/projects",
      color: "bg-[--color-accent] hover:bg-orange-500",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      title: "Gérer les Événements",
      description: "Publier des annonces et événements",
      link: "/announcements",
      color: "bg-green-600 hover:bg-green-700",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Statistiques",
      description: "Voir les rapports et analytics",
      link: "/dashboard/admin",
      color: "bg-purple-600 hover:bg-purple-700",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  // Les 5 derniers membres
  const recentMembers = members.slice(-5).reverse();
  
  // Les 5 derniers projets
  const recentProjects = projects.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-[--color-background-light]">
      <div className="container-main py-12">
        {/* Header */}
        <div className="bg-[--color-primary] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Tableau de bord Administrateur
              </h1>
              <p className="text-[--color-accent] text-lg">
                Bienvenue, {user?.first_name} ! Gérez votre club ici.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-xl flex items-center justify-center">
                <img 
                  src="/images/logo.svg" 
                  alt="Club Dev Logo"
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%231A73E8'/%3E%3Cpath d='M30 30 L20 50 L30 70' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Cpath d='M70 30 L80 50 L70 70' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Ctext x='50' y='58' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3E%26lt;/%26gt;%3C/text%3E%3Ccircle cx='35' cy='35' r='3' fill='white'/%3E%3Ccircle cx='65' cy='35' r='3' fill='white'/%3E%3Ccircle cx='50' cy='65' r='3' fill='white'/%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="group bg-[--color-card-bg] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 card-hover no-underline hover:no-underline focus:no-underline"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[--color-text-primary]">{stat.value}</div>
                  <div className="text-sm text-[--color-text-secondary]">{stat.title}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 mb-8 card">
          <h2 className="text-2xl font-bold text-[--color-text-primary] mb-6">
            Actions Rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 no-underline hover:no-underline focus:no-underline`}
              >
                <div className="mb-3">
                  {action.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-white text-opacity-90 text-sm">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Derniers Membres */}
          <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[--color-text-primary]">
                Derniers Membres
              </h2>
              <Link to="/members" className="text-[--color-primary] hover:text-[--color-secondary] font-semibold text-sm no-underline hover:no-underline focus:no-underline">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {recentMembers.length > 0 ? (
                recentMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-[--color-primary] text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-[--color-text-primary]">{member.first_name} {member.last_name}</p>
                        <p className="text-sm text-[--color-text-secondary]">{member.email}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'admin' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {member.role === 'admin' ? 'Admin' : 'Membre'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[--color-text-secondary] text-center py-4">Aucun membre pour le moment</p>
              )}
            </div>
          </div>

          {/* Derniers Projets */}
          <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[--color-text-primary]">
                Derniers Projets
              </h2>
              <Link to="/projects" className="text-[--color-primary] hover:text-[--color-secondary] font-semibold text-sm no-underline hover:no-underline focus:no-underline">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {recentProjects.length > 0 ? (
                recentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <h3 className="font-semibold text-[--color-text-primary] mb-1">{project.title}</h3>
                    <p className="text-sm text-[--color-text-secondary] line-clamp-2">{project.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-[--color-text-secondary] text-center py-4">Aucun projet pour le moment</p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 mb-8 card">
          <h2 className="text-2xl font-bold text-[--color-text-primary] mb-6">
            Statistiques du Club
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Members Chart */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[--color-text-primary] mb-4">Évolution des Membres</h3>
              <div className="h-64 flex items-end justify-between space-x-2 pt-8">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t-lg" style={{height: '30%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">Jan</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t-lg" style={{height: '50%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">Fév</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[--color-primary] rounded-t-lg" style={{height: '70%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">Mar</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[--color-primary] rounded-t-lg" style={{height: '90%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">Avr</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[--color-primary] rounded-t-lg" style={{height: '100%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">Mai</span>
                </div>
              </div>
            </div>
            
            {/* Projects Chart */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[--color-text-primary] mb-4">Projets Actifs</h3>
              <div className="h-64 flex items-end justify-between space-x-2 pt-8">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t-lg" style={{height: '20%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">Planifié</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[--color-accent] rounded-t-lg" style={{height: '60%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">En cours</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[--color-success] rounded-t-lg" style={{height: '40%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">Terminé</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[--color-danger] rounded-t-lg" style={{height: '30%'}}></div>
                  <span className="text-xs text-[--color-text-secondary] mt-2">En attente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}