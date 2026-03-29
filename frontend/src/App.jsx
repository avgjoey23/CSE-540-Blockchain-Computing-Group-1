import { useEffect, useState } from 'react'
import Streamer1 from './components/Streamer1';
import Streamer2 from './components/Streamer2';
import './App.css'

function App() {
  const [isToggled, setIsToggled] = useState(false);

  useEffect(() => {
    if (isToggled) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isToggled])

  const toggle = () => setIsToggled(!isToggled);

  return (
    <>
      <section id="center">
        { isToggled ? <Streamer1 /> : <Streamer2/>}
        <div className='toggle'>
          <button className='toggle-btn' onClick={toggle}>Switch App</button>
        </div>
      </section>
    </>
  )

}

export default App
