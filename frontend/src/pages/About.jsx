import React from "react";

export default function About() {
  const objectives = [
    {
      title: "Développer les compétences techniques",
      description: "Former les étudiants aux technologies web modernes et aux bonnes pratiques de développement"
    },
    {
      title: "Organiser des ateliers et formations",
      description: "Proposer des sessions pratiques sur différents sujets : React, Django, bases de données, etc."
    },
    {
      title: "Créer des projets réels",
      description: "Développer des applications et plateformes pour répondre aux besoins de l'institut"
    },
    {
      title: "Participer à des compétitions",
      description: "Représenter l'ISTAG dans des hackathons et événements tech nationaux et internationaux"
    },
    {
      title: "Encourager l'innovation",
      description: "Stimuler la créativité et l'esprit d'initiative à travers des projets innovants"
    }
  ];

  const reasons = [
    {
      title: "Travail en équipe",
      description: "Collaborer avec des étudiants passionnés sur des projets concrets"
    },
    {
      title: "Ambiance professionnelle",
      description: "Découvrir les méthodes de travail du monde professionnel"
    },
    {
      title: "Apprentissage rapide",
      description: "Progresser rapidement grâce à la pratique et l'entraide"
    },
    {
      title: "Encadrement des projets",
      description: "Bénéficier du mentorat de membres expérimentés"
    },
    {
      title: "Collaboration inter-clubs",
      description: "Travailler avec d'autres clubs tech et élargir votre réseau"
    }
  ];

  return (
    <div className="min-h-screen bg-[--color-background-light]">
      <div className="container-main py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[--color-primary] rounded-full p-4 mb-6">
            <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 5c2.33 0 4.32-1.45 5.12-3.5H6.88c.8 2.05 2.79 3.5 5.12 3.5z"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[--color-text-primary] mb-4">
            <span className="text-[--color-primary]">
              Club Dev
            </span>
          </h1>
          <p className="text-xl text-[--color-text-secondary] max-w-3xl mx-auto leading-relaxed">
            <strong>Club Dev</strong> est un club créé à l'<strong>ISTAG Bab Tizimi – Meknès</strong>.
            Notre objectif est de développer des sites web, des plateformes, des applications,
            et en général répondre aux besoins numériques de l'institut.
          </p>
        </div>

        {/* Objectives Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[--color-text-primary] mb-3">
              Nos Objectifs
            </h2>
            <div className="w-24 h-1 bg-[--color-primary] mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.map((objective, index) => (
              <div
                key={index}
                className="bg-[--color-card-bg] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 card-hover"
              >
                <div className="bg-[--color-primary] bg-opacity-10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-[--color-primary]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[--color-text-primary] mb-3">
                  {objective.title}
                </h3>
                <p className="text-[--color-text-secondary] leading-relaxed">
                  {objective.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Join Section */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[--color-text-primary] mb-3">
              Pourquoi Nous Rejoindre ?
            </h2>
            <div className="w-24 h-1 bg-[--color-primary] mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="bg-[--color-card-bg] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 card-hover"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-[--color-secondary] bg-opacity-20 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-[--color-primary]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[--color-text-primary] mb-2">
                      {reason.title}
                    </h3>
                    <p className="text-[--color-text-secondary] leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[--color-primary] rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Prêt à rejoindre l'aventure ?</h2>
          <p className="text-lg mb-6 text-[--color-accent]">
            Rejoignez Club Dev et développez vos compétences techniques dans une ambiance collaborative !
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-[--color-primary] font-bold py-3 px-8 rounded-full hover:bg-[--color-accent] transition-colors duration-200 shadow-lg hover:shadow-xl no-underline hover:no-underline focus:no-underline"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  );
}