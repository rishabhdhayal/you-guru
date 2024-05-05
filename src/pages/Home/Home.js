import React from 'react'
import { Link } from 'react-router-dom'

import './Home.css'
const Home = () => {
  return (
    <div className='home-container'>
            <div className='home-header'>
                <h1 className='home-heading'>Yog Guru</h1>
            </div>


            <div className="home-main">
                <div className='img'>
                    

                </div>
                <div className="btn-section">
                    <Link to='/testing'>
                        <button
                            className="hbtn start-btn"
                        >Let's Start</button>
                    </Link>

                </div>
            </div>
        </div>
    
  )
}

export default Home