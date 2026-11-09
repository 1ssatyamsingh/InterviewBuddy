import React from 'react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
function Timer({ timeLeft, totalTime }) {
    const percentage = (timeLeft/totalTime)*100

    // Semantic color: calm emerald while plenty of time remains,
    // amber as a gentle heads-up, red only when actually running out.
    let pathColor = "#10b981"
    let textColor = "#059669"
    if (percentage <= 20) {
      pathColor = "#ef4444"
      textColor = "#ef4444"
    } else if (percentage <= 50) {
      pathColor = "#f59e0b"
      textColor = "#d97706"
    }

  return (
    <div className='w-20 h-20'>
        <CircularProgressbar
        value={percentage}
        text={`${timeLeft}s`}
        styles={buildStyles({
          textSize: "26px",
          pathColor,
          textColor,
          trailColor: "#e5e7eb",
          pathTransitionDuration: 0.4,
        })}
        />
      
    </div>
  )
}

export default Timer
