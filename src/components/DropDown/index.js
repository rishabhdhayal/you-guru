import React from "react";

import { poseImages } from "../../utils/pose_images";
import down from '../../utils//images/index'
// import Testing from "../../pages/Testing/Testing";

import "./DropDown.css";

function drop() {
  if (document.getElementById('dropdown-menu').style.display === 'block') {
    document.getElementById('dropdown-menu').style.display = 'none';
    // document.getElementById('dropdown').style.marginTop = '0px';
  } else {
    document.getElementById('dropdown-menu').style.display = 'block';
    // document.getElementById('dropdown').style.marginTop = '250px';
  }
}

export default function DropDown({ poseList, currentPose, setCurrentPose }) {
  return (
    <div className="dropdown" id="dropdown">
      <button onClick={drop}>Pose 
      {/* {currentPose}  */}
      <img src={down} alt="" /> </button>
      <ul className="dropdown-menu" id="dropdown-menu">
        {poseList.map((pose) => (
          <li key={pose} onClick={() => {
            console.log('Clicked on pose:', pose);
            setCurrentPose(pose);
            // Testing.stopPose()
            drop()
          }}>
            <div className="dropdown-item-container">
              <img src={poseImages[pose]} className="dropdown-img" />
              <p className="dropdown-item-1">{pose}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>

  );
}


