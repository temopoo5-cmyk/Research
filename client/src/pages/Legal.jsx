import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

const docs = {
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy Policy.',
    intro:
      'ResearchHub collects only the account details needed to run the repository. This page is a starting template and should be reviewed by your institution before it is published.',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'Registered members provide a name, an email address, and a password. Submissions additionally record authorship, program affiliation, and the document itself. Public visitors are not asked to sign in.',
      },
      {
        heading: 'How Information Is Used',
        body: 'Account data is used to authenticate users and to attribute submitted research. Catalogued works are shown publicly so that the repository is discoverable.',
      },
      {
        heading: 'Retention and Access',
        body: 'Records are retained for as long as the repository is in operation. Members may request correction or removal of their personal details by contacting the repository administrator.',
      },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms of Service.',
    intro:
      'These terms describe the conditions for using the ResearchHub repository. This page is a starting template and should be reviewed by your institution before it is published.',
    sections: [
      {
        heading: 'Acceptable Use',
        body: 'Members are responsible for the works they submit and must hold the rights required to share them. Content must not infringe the rights of others.',
      },
      {
        heading: 'Content Ownership',
        body: 'Authors retain ownership of the research they submit. Submission grants the repository a non-exclusive licence to store, display, and index the work.',
      },
      {
        heading: 'Moderation',
        body: 'Submissions are reviewed before publication. Administrators may decline, edit, or withdraw a record that does not meet these terms.',
      },
    ],
  },
};

export default function Legal({ doc }) {
  const content = docs[doc];
  if (!content) return null;

  return (
    <div className="bg-cream">
      <section className="about-hero">
        <div className="container-page relative z-10 pb-24 pt-12 lg:pb-28 lg:pt-14">
          <div className="max-w-[640px]">
            <div className="eyebrow inline-flex items-center gap-2 text-[#176653]">
              <Scale className="h-[13px] w-[13px]" />
              <span>{content.eyebrow}</span>
            </div>

            <h1 className="about-page-title mt-5">{content.title}</h1>

            <p className="body-copy mt-5">{content.intro}</p>

            <div className="mt-6">
              <Link to="/" className="hero-cta">
                <ArrowLeft className="hero-arrow h-[14px] w-[14px]" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-20 -mt-6">
        <div className="container-page pb-10">
          <div className="content-section">
            {content.sections.map(s => (
              <div key={s.heading} className="mb-6 last:mb-0">
                <h2 className="section-title text-[20px]">{s.heading}</h2>
                <p className="body-copy mt-2.5">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
