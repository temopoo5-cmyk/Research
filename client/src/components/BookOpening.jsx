import React from 'react';
import { GraduationCap } from 'lucide-react';

function BookHalf({ side }) {
  return (
    <>
      <div className={`book-leaf book-page book-leaf-${side}`} />
      <div className={`book-leaf book-cover book-leaf-${side}`}>
        <div className="book-cover-text">
          <GraduationCap className="h-8 w-8" strokeWidth={1.6} />
          <span className="book-cover-brand">ResearchHub</span>
        </div>
      </div>
    </>
  );
}

export default function BookOpening({ title, authors, type }) {
  const [leaving, setLeaving] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`book-overlay${leaving ? ' book-leaving' : ''}`} role="status" aria-label="Opening document">
      <div className="book-scene">
        <div className="book-wrap">
          <BookHalf side="left" />
          <BookHalf side="right" />
        </div>
      </div>
      <div className="book-caption">
        <p className="book-caption-label">Now Opening</p>
        <p className="book-caption-title">{title || 'Research Document'}</p>
        {authors && <p className="book-caption-authors">{authors}</p>}
        {type && <p className="book-caption-meta">{type}</p>}
      </div>
    </div>
  );
}