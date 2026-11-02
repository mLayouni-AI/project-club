import React from "react";

export default function Contact() {
  const admins = [
    { name: "Admin 1", email: "admin1@clubdev.ma" },
    { name: "Admin 2", email: "admin2@clubdev.ma" },
    { name: "Admin 3", email: "admin3@clubdev.ma" },
    { name: "Admin 4", email: "admin4@clubdev.ma" },
    { name: "Admin 5", email: "admin5@clubdev.ma" },
  ];

  const socialLinks = [
    {
      name: "Facebook",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: "https://facebook.com/clubdev"
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      url: "https://linkedin.com/company/clubdev"
    },
    {
      name: "GitHub",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
        </svg>
      ),
      url: "https://github.com/clubdev"
    },
    {
      name: "Instagram",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
        </svg>
      ),
      url: "https://instagram.com/clubdev"
    }
  ];

  return (
    <div className="min-h-screen bg-[--color-background-light]">
      <div className="container-main py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[--color-primary] rounded-full p-4 mb-6">
            <svg className="h-16 w-16 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[--color-text-primary] mb-4">
            <span className="text-[--color-primary]">
              Contactez-Nous
            </span>
          </h1>
          <p className="text-xl text-[--color-text-secondary] max-w-3xl mx-auto leading-relaxed">
            Vous pouvez nous joindre pour des <strong>collaborations</strong>, <strong>événements</strong> ou <strong>demandes d'informations</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Admin Emails Section */}
          <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 card">
            <div className="flex items-center mb-6">
              <div className="bg-[--color-primary] bg-opacity-10 rounded-full p-3 mr-4">
                <svg className="h-6 w-6 text-[--color-primary]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[--color-text-primary]">Emails des Administrateurs</h2>
            </div>
            <div className="space-y-4">
              {admins.map((admin, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                >
                  <div className="bg-[--color-primary] text-white rounded-full h-10 w-10 flex items-center justify-center font-bold mr-4">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[--color-text-primary]">{admin.name}</p>
                    <a
                      href={`mailto:${admin.email}`}
                      className="text-[--color-primary] hover:text-[--color-secondary] font-medium transition-colors no-underline hover:no-underline focus:no-underline"
                    >
                      {admin.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media Section */}
          <div className="bg-[--color-card-bg] rounded-2xl shadow-xl p-8 card">
            <div className="flex items-center mb-6">
              <div className="bg-[--color-secondary] bg-opacity-20 rounded-full p-3 mr-4">
                <svg className="h-6 w-6 text-[--color-primary]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[--color-text-primary]">Réseaux Sociaux</h2>
            </div>
            <div className="space-y-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 bg-[--color-primary] text-white rounded-lg transition-all duration-200 hover:bg-[--color-secondary] shadow-lg hover:shadow-xl no-underline hover:no-underline focus:no-underline"
                >
                  <div className="mr-4">{social.icon}</div>
                  <div>
                    <p className="font-bold text-lg">{social.name}</p>
                    <p className="text-sm opacity-90">{social.url}</p>
                  </div>
                  <svg className="h-5 w-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-[--color-primary] rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Nous Contacter</h2>
          <p className="text-lg mb-6 text-[--color-accent] max-w-2xl mx-auto">
            N'hésitez pas à nous contacter pour toute question, suggestion ou collaboration.
            Notre équipe est toujours ravie d'échanger avec vous !
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-2">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <span className="font-semibold">ISTAG Bab Tizimi, Meknès</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              <span className="font-semibold">contact@clubdev.ma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}