import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from "motion/react"
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ServerUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import AuthModel from './AuthModel';
function Navbar() {
    const {userData} = useSelector((state)=>state.user)
    const userName = typeof userData?.name === "string" ? userData.name.trim() : ""
    const userLabel = userName || userData?.email || "Account"
    const [showCreditPopup,setShowCreditPopup] = useState(false)
    const [showUserPopup,setShowUserPopup] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [showAuth, setShowAuth] = useState(false);

    const handleLogout = async () => {
        try {
            await axios.get(ServerUrl + "/api/auth/logout" , {withCredentials:true})
            dispatch(setUserData(null))
            setShowCreditPopup(false)
            setShowUserPopup(false)
            navigate("/")

        } catch (error) {
            console.log(error)
        }
    }
  return (
    <div className='bg-[#FAFAFA] flex justify-center px-4 pt-6'>
        <motion.div 
        initial={{opacity:0 , y:-16}}
        animate={{opacity:1 , y:0}}
        transition={{duration: 0.3, ease: "easeOut"}}
        className='w-full max-w-6xl bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 px-6 md:px-8 py-3.5 flex justify-between items-center relative'>
            <div className='flex items-center gap-3 cursor-pointer'>
                <div className='bg-emerald-500 text-white p-2 rounded-lg'>
                    <BsRobot size={18}/>

                </div>
                <h1 className='font-semibold hidden md:block text-lg text-white tracking-tight'>InterviewBuddy</h1>
            </div>

            <div className='flex items-center gap-3 relative'>
                <div className='relative'>
                    <button onClick={()=>{
                        if(!userData){
                            setShowAuth(true)
                            return;
                        }
                        setShowCreditPopup(!showCreditPopup);
                        setShowUserPopup(false)
                    }} className='flex items-center gap-2 bg-white/10 text-neutral-100 px-3.5 py-2 rounded-full text-sm font-medium hover:bg-white/[0.15] transition-colors duration-150'>
                        <BsCoin size={16} className="text-emerald-400"/>
                        {userData?.credits || 0}
                    </button>

                    {showCreditPopup && (
                        <div className='absolute right-[-50px] mt-3 w-64 bg-white shadow-lg border border-gray-200 rounded-xl p-5 z-50'>
                            <p className='text-sm text-gray-600 mb-4'>Need more credits to continue interviews?</p>
                            <button onClick={()=>navigate("/pricing")} className='w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors duration-150'>Buy more credits</button>

                        </div>
                    )}
                </div>

                <div className='relative'>
                    <button
                    onClick={()=>{
                         if(!userData){
                            setShowAuth(true)
                            return;
                        }
                        setShowUserPopup(!showUserPopup);
                        setShowCreditPopup(false)
                    }} className='w-9 h-9 bg-emerald-500 text-white rounded-full flex items-center justify-center font-semibold text-sm hover:bg-emerald-400 transition-colors duration-150'>
                        {userName ? userName.slice(0,1).toUpperCase() : <FaUserAstronaut size={16}/>}
                        
                    </button>

                    {showUserPopup && (
                        <div className='absolute right-0 mt-3 w-48 bg-white shadow-lg border border-gray-200 rounded-xl p-4 z-50'>
                            <p className='text-sm text-gray-900 font-medium mb-2 truncate'>{userLabel}</p>

                            <button onClick={()=>navigate("/history")} className='w-full text-left text-sm py-2 text-gray-600 hover:text-gray-900 transition-colors duration-150'>Interview History</button>
                            <button onClick={handleLogout} 
                            className='w-full text-left text-sm py-2 flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors duration-150'>
                                <HiOutlineLogout size={16}/>
                                Logout</button>
                        </div>
                    )}
                </div>

            </div>



        </motion.div>

        {showAuth && <AuthModel onClose={()=>setShowAuth(false)}/>}
      
    </div>
  )
}

export default Navbar
