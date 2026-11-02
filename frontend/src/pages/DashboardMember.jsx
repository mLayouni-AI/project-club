import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function DashboardMember() {
  const { user, projects, announcements } = useAuth();

  const activities = [
    {
      title: "Explorer les Projets",
      description: "Découvrez les projets en cours du club",
      link: "/projects",
      color: "from-purple-600 to-purple-700"
    },
    {
      title: "Voir les Événements",
      description: "Restez informé des dernières annonces",
      link: "/announcements",
      color: "from-green-600 to-green-700"
    },
    {
      title: "Membres du Club",
      description: "Connectez-vous avec les autres membres",
      link: "/members",
      color: "from-[--color-primary] to-[--color-secondary]"
    }
  ];

  // Les 5 derniers projets
  const recentProjects = projects.slice(-5).reverse();
  
  // Les 5 derniers événements
  const recentAnnouncements = announcements.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-[--color-background-light]">
      <div className="container-main py-12">
        {/* Hero Welcome */}
        <div className="bg-[--color-primary] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="text-center">
            <div className="inline-block bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4 mb-4 flex items-center justify-center">
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
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Bienvenue dans Club Dev
            </h1>
            <p className="text-xl text-[--color-accent] mb-2">
              Bonjour, {user?.first_name} {user?.last_name} !
            </p>
            <p className="text-[--color-accent]">
              Explorez les activités du club et restez connecté avec la communauté
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-[--color-primary] p-6 rounded-lg mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-[--color-primary]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-[--color-primary] font-semibold">
                En tant que membre, vous pouvez consulter toutes les informations du club.
              </p>
              <p className="text-sm text-[--color-text-secondary] mt-1">
                Pour contribuer aux projets ou proposer des événements, contactez un administrateur.
              </p>
            </div>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[--color-text-primary] mb-6">
            Voici les Activités du Club
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities.map((activity, index) => (
              <Link
                key={index}
                to={activity.link}
                className={`bg-gradient-to-r ${activity.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 no-underline hover:no-underline focus:no-underline`}
              >
                <div className="mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{activity.title}</h3>
                <p className="text-white text-opacity-90 text-sm">{activity.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projets Récents */}
          <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[--color-text-primary]">
                Projets Récents
              </h2>
              <Link to="/projects" className="text-[--color-primary] hover:text-[--color-secondary] font-semibold text-sm no-underline hover:no-underline focus:no-underline">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-[--color-primary] text-white rounded-lg p-2 flex-shrink-0">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[--color-text-primary] mb-1">{project.title}</h3>
                        <p className="text-sm text-[--color-text-secondary] line-clamp-2">{project.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <p className="text-[--color-text-secondary] mt-2">Aucun projet pour le moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Événements Récents */}
          <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[--color-text-primary]">
                Événements Récents
              </h2>
              <Link to="/announcements" className="text-[--color-primary] hover:text-[--color-secondary] font-semibold text-sm no-underline hover:no-underline focus:no-underline">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-4">
              {recentAnnouncements.length > 0 ? (
                recentAnnouncements.map((announcement, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-600 text-white rounded-lg p-2 flex-shrink-0">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[--color-text-primary] mb-1">{announcement.title}</h3>
                        <p className="text-sm text-[--color-text-secondary] line-clamp-2">{announcement.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                  </svg>
                  <p className="text-[--color-text-secondary] mt-2">Aucun événement pour le moment</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 bg-[--color-primary] rounded-2xl shadow-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Envie de contribuer ?</h3>
          <p className="text-[--color-accent] mb-6">
            Proposez vos idées de projets ou participez aux événements du club !
          </p>
          <Link
            to="/contact"
            className="inline-block bg-white text-[--color-primary] font-bold py-3 px-8 rounded-full hover:bg-[--color-accent] transition-all duration-200 shadow-lg hover:shadow-xl no-underline hover:no-underline focus:no-underline"
          >
            Contactez l'équipe
          </Link>
        </div>
      </div>
    </div>
  );
}