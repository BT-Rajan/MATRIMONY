// Full-width banner at the top of every inner page.
export default function PageHero({ title, sub, children }) {
  return (
    <section className="page-hero">
      <div className="page-hero-in">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
        {children}
      </div>
    </section>
  );
}
