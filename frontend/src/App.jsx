import { useEffect, useState } from 'react'
import Streamer1 from './components/Streamer1';
import Streamer2 from './components/Streamer2';
import ff1 from './assets/img/ff1.jpeg';
import ff2 from './assets/img/ff2.jpg';
import ff3 from './assets/img/ff3.jpg';
import ff4 from './assets/img/ff4.jpg';
import ff5 from './assets/img/ff5.jpg';
import ff6 from './assets/img/ff6.jpg';
import ff7 from './assets/img/ff7.jpg';
import ff8 from './assets/img/ff8.jpg';
import ff9 from './assets/img/ff9.jpg';
import ff10 from './assets/img/ff10.jpg';
import './App.css'
import Carousel from './components/Carousel';

// We can replace this with a data file or store it serverside
// This is just filler content for the demo
const MOVIES = [
  { id: 1, title: "The Fast and the Furious", cover: ff1},
  { id: 2, title: "2 Fast 2 Furious", cover: ff2},
  { id: 3, title: "The Fast and the Furious: Tokyo Drift", cover: ff3},
  { id: 4, title: "Fast & Furious", cover: ff4},
  { id: 5, title: "Fast Five", cover: ff5},
  { id: 6, title: "Fast & Furious 6", cover: ff6},
  { id: 7, title: "Furious 7", cover: ff7},
  { id: 8, title: "The Fate of the Furious", cover: ff8},
  { id: 9, title: "F9: The Fast Saga", cover: ff9},
  { id: 10, title: "Fast X", cover: ff10},
]

function App() {
  const [isToggled, setIsToggled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const toggle = () => setIsToggled(!isToggled);

  useEffect(() => {
    if (isToggled) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isToggled])
  
  

  return (
    <div className={`app ${isToggled ? "theme-dark" : "theme-light"}`}>
      <nav className="navbar">
        <div className='streamer'>
          { isToggled ? <Streamer1 /> : <Streamer2 />}
        </div>
        <div className="profile-wrapper">
          <div className="profile-circle" />
          <span className="profile-tooltip">Your Wallet</span>
        </div>
      </nav>
      <main className="main">
        <Carousel movies={MOVIES} />
        <div className="movie-actions">
          <button className="btn btn-purchase">Purchase</button>
          <button className="btn btn-watch" onClick={() => setShowModal(true)}>Watch</button>
        </div>
        <div className='toggle-app'>
          <button className='btn btn-toggle' onClick={toggle}>Switch App</button>
        </div>
      </main>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p>Sorry, please purchase this movie to watch it!</p>
            <button className="btn btn-purchase" onClick={() => setShowModal(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );

}

export default App
