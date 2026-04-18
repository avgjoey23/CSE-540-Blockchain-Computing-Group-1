import { Routes, Route, useNavigate } from 'react-router-dom';
import WatchMovie from './screens/WatchMovie.jsx';
import { useEffect, useState } from 'react'
import { ethers } from 'ethers';
import Blockazon from './components/Blockazon';
import ChainTv from './components/ChainTv';
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

const COVER_MAP = {
    1: ff1, 2: ff2, 3: ff3, 4: ff4, 5: ff5,
    6: ff6, 7: ff7, 8: ff8, 9: ff9, 10: ff10
};

function App() {
  const [isToggled, setIsToggled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [movies, setMovies] = useState([]);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [blockazonWallet, setBlockazonWallet] = useState(null);
  const [chainTvWallet, setChainTvWallet] = useState(null);

  const toggle = () => setIsToggled(!isToggled);
  const navigate = useNavigate();
  const walletAddress = isToggled ? blockazonWallet : chainTvWallet;

  useEffect(() => {
    fetch('http://localhost:3000/api/movies')
      .then(res => res.json())
      .then(data => {
        const covers = data.map(movie => ({
          ...movie,
          cover: COVER_MAP[movie.id]
        }));
        setMovies(covers);
        setCurrentMovie(covers[0]);
      })
      .catch(err => console.error('Failed to fetch movies: ', err));
  }, []);

  useEffect(() => {
    if (isToggled) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isToggled]);

  const connectWallet = async () => {
    if (!window.ethereum) {
        alert('MetaMask is not installed. Please install it to use this feature.');
        return;
    }
    try {
        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        if (isToggled) {
            setBlockazonWallet(accounts[0]);
        } else {
            setChainTvWallet(accounts[0]);
        }
    } catch (err) {
        console.error('Wallet connection failed: ', err);
    }
}

  const handlePurchase = async () => {
      if (!walletAddress) {
          alert('Please connect your wallet first.');
          return;
      }
      try {
          const res = await fetch('http://localhost:3000/api/purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress, movieId: currentMovie.id })
          });
          const data = await res.json();

          if (data.success) {
              setMovies(prev => prev.map(m =>
                  m.id === currentMovie.id ? { ...m, owned: true } : m
              ));
              setCurrentMovie(prev => ({ ...prev, owned: true }));
              alert(`You now own ${currentMovie.title}!`);
          } else if (data.error === 'AlreadyOwned') {
              alert('You already own this movie!');
          } else if (data.error === 'UserNotFound') {
              alert('Your wallet is not registered. Please register before purchasing.');
          } else {
              alert('Purchase failed, please try again.');
          }
      } catch (err) {
          console.error('Purchase failed:', err);
          alert('Purchase failed, please try again.');
      }
      setShowPurchaseModal(false);
  };

  const handleWatch = async () => {
    if (!walletAddress) {
        alert('Please connect your wallet first.');
        return;
    }
    try {
        const vcHash = ethers.keccak256(
            ethers.toUtf8Bytes(`${walletAddress}:movie:${currentMovie.id}`)
        );
        const res = await fetch('http://localhost:3000/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, vcHash })
        });
        const data = await res.json();
        if (data.verified) {
          navigate('/watch', { state: { movie: currentMovie, theme: isToggled ? 'theme-dark' : 'theme-light' } });
        } else {
          setShowModal(true);
        }
    } catch (err) {
        console.error('Verification failed:', err);
        alert('Verification failed, please try again.');
    }
  };

  if (!movies.length || !currentMovie) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/watch" element={<WatchMovie />} />
      <Route path="/" element={
        <div className={`app ${isToggled ? "theme-dark" : "theme-light"}`}>
          <nav className="navbar">
            <div className='streamer'>
              { isToggled ? <Blockazon /> : <ChainTv />}
            </div>
            <div className="profile-wrapper" onClick={connectWallet} style={{ cursor: 'pointer' }}>
            <div className={`profile-circle ${walletAddress ? 'connected' : ''}`} />
            <span className="profile-tooltip">
                {walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : 'Connect Wallet'
                }
            </span>
          </div>
          </nav>
          <main className="main">
            <Carousel
              movies={movies}
              onWatch={handleWatch}
              onPurchase={() => {
                if (!walletAddress) {
                  alert('Please connect your wallet first.');
                  return;
                }
                setShowPurchaseModal(true);
              }}
              onMovieChange={setCurrentMovie}
            />
            <div className='toggle-app'>
              <button className='btn btn-toggle' onClick={toggle}>Switch App</button>
            </div>
          </main>
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <p>{currentMovie.owned
                  ? 'Enjoy the movie!'
                  : 'Sorry, please purchase this movie to watch it!'
                }</p>
                <button className="btn btn-purchase" onClick={() => setShowModal(false)}>OK</button>
              </div>
            </div>
          )}
          {showPurchaseModal && (
            <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <p>Would you like to purchase {currentMovie.title}?</p>
                <div className="modal-buttons">
                  <button className="btn btn-purchase" onClick={handlePurchase}>Confirm</button>
                  <button className="btn btn-watch" onClick={() => setShowPurchaseModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      } />
    </Routes>
  );

}

export default App