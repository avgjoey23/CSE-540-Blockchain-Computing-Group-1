import { useState, useRef, useEffect } from 'react';
import './Carousel.css';
import MovieCard from './MovieCard';

const CENTER_WIDTH = 280;
const SIDE_WIDTH = 140;
const GAP = 12;
const ARROW_SPACE = 96;

function Carousel({ movies }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [sidesVisible, setSidesVisible] = useState(3);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const available = (entry.contentRect.width - ARROW_SPACE - CENTER_WIDTH) / 2;
      const count = Math.min(3, Math.max(1, Math.floor((available + GAP) / (SIDE_WIDTH + GAP))));
      setSidesVisible(count);
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const navigate = (newIdx) => {
    if (animating || newIdx === current) return;
    setAnimating(true);
    setCurrent(newIdx);
    setTimeout(() => setAnimating(false), 400);
  };

  const prevIdx = (current - 1 + movies.length) % movies.length;
  const nextIdx = (current + 1) % movies.length;

  const getOffset = (i) => {
    let offset = i - current;
    // Wrap to shortest path
    if (offset > movies.length / 2) offset -= movies.length;
    if (offset < -movies.length / 2) offset += movies.length;
    return offset;
  };

  const getX = (offset) => {
    if (offset === 0) return 0;
    const sign = Math.sign(offset);
    return sign * (CENTER_WIDTH / 2 + GAP + SIDE_WIDTH / 2 + (Math.abs(offset) - 1) * (SIDE_WIDTH + GAP));
  };

  const visibleHalfWidth = CENTER_WIDTH / 2 + sidesVisible * (SIDE_WIDTH + GAP);

  return (
    <div className="carousel-wrapper" ref={wrapperRef}>
      <div className="carousel">
        <button
          className="carousel-arrow left"
          style={{ left: `calc(50% - ${visibleHalfWidth + 48}px)` }}
          onClick={() => navigate(prevIdx)}
          aria-label="Previous"
        >&#8592;</button>

        <div className="carousel-clip">
          <div className="carousel-track">
            {movies.map((movie, i) => {
              const offset = getOffset(i);
              const isCenter = offset === 0;
              const isVisible = Math.abs(offset) <= sidesVisible;

              return (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isCenter={isCenter}
                  isVisible={isVisible}
                  offset={offset}
                  getX={getX}
                  onClick={() => !isCenter && navigate(i)}
                />
              );
            })}
          </div>
        </div>

        <button
          className="carousel-arrow right"
          style={{ right: `calc(50% - ${visibleHalfWidth + 48}px)` }}
          onClick={() => navigate(nextIdx)}
          aria-label="Next"
        >&#8594;</button>
      </div>
      <div className="carousel-dots">
        {movies.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => navigate(i)}
            aria-label={`Go to movie ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousel;