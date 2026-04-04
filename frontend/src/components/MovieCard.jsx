import './MovieCard.css';

function MovieCard({ movie, isCenter, isVisible, offset, getX, sideWidth, centerWidth, onWatch, onPurchase, onClick }) {
  return (
    <div
      className={`movie-card ${isCenter ? 'center' : 'side'}`}
      style={{
        transform: `translateX(calc(-50% + ${getX(offset)}px))`,
        opacity: isVisible ? (isCenter ? 1 : 0.75) : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        ...(isCenter && centerWidth && { width: centerWidth, marginTop: -(centerWidth * 0.75) }),
        ...(!isCenter && sideWidth && { width: sideWidth, marginTop: -(sideWidth * 0.75) }),
      }}
      onClick={onClick}
    >
      <div className="movie-cover-wrapper">
        <img
          className="movie-cover"
          src={movie.cover}
          alt={movie.title}
        />
        {isCenter && (
          <div className="movie-title-overlay">
            <span className="movie-title-text">{movie.title}</span>
          </div>
        )}
      </div>
      {isCenter && (
        <div className="movie-buttons">
          <button className="btn btn-purchase" onClick={e => { e.stopPropagation(); onPurchase && onPurchase(); }}>Purchase</button>
          <button className="btn btn-watch" onClick={e => { e.stopPropagation(); onWatch && onWatch(); }}>Watch</button>
        </div>
      )}
    </div>
  );
}

export default MovieCard;