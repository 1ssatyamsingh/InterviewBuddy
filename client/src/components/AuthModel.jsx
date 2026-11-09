import React from 'react'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { FaTimes } from "react-icons/fa";
import Auth from '../pages/Auth';

function AuthModel({onClose}) {
    const {userData} = useSelector((state)=>state.user)

    useEffect(()=>{
        if(userData){
            onClose()
        }

    },[userData , onClose])

  return (
    <div className='fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-sm px-4'>
        <div className='relative w-full max-w-md'>
            <button onClick={onClose} className='absolute -top-2 -right-2 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 shadow-sm transition-colors duration-150 z-10'>
             <FaTimes size={14}/>
            </button>
            <Auth isModel={true}/>


        </div>

      
    </div>
  )
}

export default AuthModel
