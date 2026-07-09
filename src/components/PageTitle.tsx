import "./PageTitle.css";

interface PageTitleProps {
  title: string;
}

export default function PageTitle({ title }: PageTitleProps) {
  return (
    <div className="page-title-staff" aria-label={title}>
      <span className="page-title-line"></span>
      <span className="page-title-line"></span>
      <span className="page-title-line"></span>
      <span className="page-title-line"></span>
      <span className="page-title-line"></span>
      <div className="page-title-overlay">
        <span className="page-title-note" aria-hidden="true">♫</span>
        <h1 className="page-title-text">{title}</h1>
        <span className="page-title-note" aria-hidden="true">♫</span>
      </div>
    </div>
  );
}
