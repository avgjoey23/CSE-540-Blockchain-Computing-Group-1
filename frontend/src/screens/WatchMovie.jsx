import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

function WatchMovie() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const theme = state?.theme ?? 'theme-dark';

    if (!state?.movie) {
        return (
            <div className={`app ${theme}`}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No movie selected.</p>
                    <button className="btn btn-watch" onClick={() => navigate('/')}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`app ${theme}`}>
            <nav className="navbar">
                <button className="btn btn-watch" onClick={() => navigate('/')}>← Back to Browse</button>
            </nav>
            <main className="main">
                <h1>{state.movie.title}</h1>
                <img
                    src={state.movie.cover}
                    alt={state.movie.title}
                    style={{ width: '300px', borderRadius: '8px' }}
                />
            </main>
        </div>
    );
}

export default WatchMovie;