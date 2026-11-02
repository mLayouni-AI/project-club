import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  const domains = [
    {
      title: "Développement Web",
      description: "Création de sites web modernes et performants avec les dernières technologies"
    },
    {
      title: "Développement d'Applications",
      description: "Applications mobiles et desktop pour répondre aux besoins digitaux"
    },
    {
      title: "UX/UI Design",
      description: "Interfaces utilisateur intuitives et expérience utilisateur optimale"
    },
    {
      title: "Projets Digitaux",
      description: "Solutions digitales sur mesure pour l'ISTAG et ses partenaires"
    }
  ];

  const achievements = [
    {
      title: "15+ Projets Réalisés",
      description: "Sites web, applications et outils pour l'institut"
    },
    {
      title: "50+ Membres Formés",
      description: "Étudiants formés aux technologies web modernes"
    },
    {
      title: "10+ Ateliers Organisés",
      description: "Formations pratiques en développement et design"
    }
  ];

  const reasons = [
    {
      title: "Travail en Équipe",
      description: "Collaborez sur des projets réels avec d'autres passionnés"
    },
    {
      title: "Formations Gratuites",
      description: "Accédez à des formations de qualité sans frais"
    },
    {
      title: "Encadrement Professionnel",
      description: "Bénéficiez de l'expertise de mentors expérimentés"
    },
    {
      title: "Expérience Réelle",
      description: "Travaillez sur de vrais projets pour votre portfolio"
    }
  ];

  return (
    <div className="bg-[--color-background-light]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[--color-primary]">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container-main py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 slide-in">
              Bienvenue dans{" "}
              <span className="text-[--color-secondary]">
                Club Dev
              </span>
            </h1>
            <p className="text-xl text-[--color-accent] mb-10 fade-in">
              Le club qui forme les développeurs de demain à l'ISTAG Meknès
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in">
              <Link
                to="/signup"
                className="btn-primary px-8 py-4 text-lg no-underline hover:no-underline focus:no-underline"
              >
                Rejoindre le Club
              </Link>
              <Link
                to="/projects"
                className="btn-outline px-8 py-4 text-lg no-underline hover:no-underline focus:no-underline"
              >
                Découvrir nos Projets
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Nos Domaines */}
      <div className="container-main py-20">
        <div className="text-center mb-16">
          <h2 className="section-title">Nos Domaines d'Expertise</h2>
          <p className="section-subtitle">Technologies et compétences que nous maîtrisons</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {domains.map((domain, index) => (
            <div
              key={index}
              className="card-hover p-8 text-center group"
            >
              <div className="bg-[--color-primary] bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[--color-primary] group-hover:bg-opacity-20 transition-all duration-300">
                <svg className="h-8 w-8 text-[--color-primary] group-hover:text-[--color-secondary]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[--color-text-primary] mb-3">{domain.title}</h3>
              <p className="text-[--color-text-secondary]">{domain.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nos Réalisations */}
      <div className="bg-[--color-background-light] py-20">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="section-title">Nos Réalisations</h2>
            <p className="section-subtitle">Ce que nous avons accompli ensemble</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-[--color-card-bg] p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center card"
              >
                <div className="bg-[--color-primary] bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="h-8 w-8 text-[--color-primary]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[--color-text-primary] mb-3">{achievement.title}</h3>
                <p className="text-[--color-text-secondary]">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pourquoi Club Dev */}
      <div className="container-main py-20">
        <div className="text-center mb-16">
          <h2 className="section-title">Pourquoi Club Dev ?</h2>
          <p className="section-subtitle">Les avantages de rejoindre notre communauté</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="flex items-start space-x-6 p-6 card-hover"
            >
              <div className="flex-shrink-0 bg-[--color-primary] bg-opacity-10 w-12 h-12 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-[--color-primary]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[--color-text-primary] mb-2">{reason.title}</h3>
                <p className="text-[--color-text-secondary]">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-[--color-primary] py-20">
        <div className="container-main text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Deviens Membre Maintenant
          </h2>
          <p className="text-xl text-[--color-accent] mb-8 max-w-2xl mx-auto">
            C'est gratuit ! Rejoins une communauté de passionnés et développe tes compétences
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="btn-primary px-10 py-4 text-lg no-underline hover:no-underline focus:no-underline"
            >
              Inscription Gratuite
            </Link>
            <Link
              to="/about"
              className="btn-outline px-10 py-4 text-lg text-white border-white hover:bg-white hover:text-[--color-primary] no-underline hover:no-underline focus:no-underline"
            >
              En Savoir Plus
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}