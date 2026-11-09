import React from 'react'
import { BsRobot } from 'react-icons/bs'

function Footer() {
  return (
    <div className='bg-[#FAFAFA] flex justify-center px-4 pb-10 pt-4'>
      <div className='w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 py-8 px-3 text-center'>
        <div className='flex justify-center items-center gap-3 mb-3'>
            <div className='bg-emerald-500 text-white p-2 rounded-lg'><BsRobot size={16}/></div>
            <h2 className='font-semibold text-gray-900'>InterviewBuddy</h2>
        </div>
        <p className='text-gray-500 text-sm max-w-xl mx-auto leading-relaxed'>
          AI-powered interview preparation platform designed to improve
          communication skills, technical depth and professional confidence.
        </p>


      </div>
    </div>
  )
}

export default Footer
