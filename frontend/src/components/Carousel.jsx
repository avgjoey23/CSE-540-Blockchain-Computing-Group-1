import { useState, useRef, useEffect } from 'react';
import './Carousel.css';
import MovieCard from './MovieCard';

const BASE_CENTER_WIDTH = 340;
const GAP = 12;
const ARROW_SPACE = 96;

function Carousel({ movies, onWatch, onPurchase, onMovieChange }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [sidesVisible, setSidesVisible] = useState(3);
  const [centerWidth, setCenterWidth] = useState(BASE_CENTER_WIDTH);
  const wrapperRef = useRef(null);

  const getSideWidth = (offset, cw = centerWidth) => {
    const scale = 1 - Math.abs(offset) * 0.07;
    return Math.round(cw * scale);
  };

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const vw = entry.contentRect.width;
      const cw = Math.min(BASE_CENTER_WIDTH, Math.max(240, vw * 0.28));
      setCenterWidth(cw);

      const widths = [1, 2, 3].map(i => getSideWidth(i, cw));
      let available = (vw - ARROW_SPACE - cw) / 2;
      let count = 0;
      for (let i = 0; i < 3; i++) {
        available -= widths[i] + GAP;
        if (available >= 0) count = i + 1;
        else break;
      }
      setSidesVisible(Math.max(1, count));
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const navigate = (newIdx) => {
    if (animating || newIdx === current) return;
    setAnimating(true);
    setCurrent(newIdx);
    onMovieChange && onMovieChange(movies[newIdx]);
    setTimeout(() => setAnimating(false), 400);
  };

  const prevIdx = (current - 1 + movies.length) % movies.length;
  const nextIdx = (current + 1) % movies.length;

  const getOffset = (i) => {
    let offset = i - current;
    if (offset > movies.length / 2) offset -= movies.length;
    if (offset < -movies.length / 2) offset += movies.length;
    return offset;
  };

  const getX = (offset) => {
    if (offset === 0) return 0;
    const sign = Math.sign(offset);
    let x = centerWidth / 2 + GAP + getSideWidth(1) / 2;
    for (let i = 2; i <= Math.abs(offset); i++) {
      x += getSideWidth(i - 1) / 2 + GAP + getSideWidth(i) / 2;
    }
    return sign * x;
  };

  const visibleHalfWidth = (() => {
    let hw = centerWidth / 2;
    for (let i = 1; i <= sidesVisible; i++) {
      hw += GAP + getSideWidth(i);
    }
    return hw;
  })();

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
                  sideWidth={isCenter ? null : getSideWidth(offset)}
                  centerWidth={centerWidth}
                  onWatch={onWatch}
                  onPurchase={onPurchase}
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