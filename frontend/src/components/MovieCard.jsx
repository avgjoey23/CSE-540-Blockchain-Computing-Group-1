import './MovieCard.css';

function MovieCard({ movie, isCenter, isVisible, offset, getX, onClick }) {
  return (
    <div
      className={`movie-card ${isCenter ? 'center' : 'side'}`}
      style={{
        transform: `translateX(calc(-50% + ${getX(offset)}px))`,
        opacity: isVisible ? (isCenter ? 1 : 0.75) : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      onClick={onClick}
    >
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
  );
}

export default MovieCard;