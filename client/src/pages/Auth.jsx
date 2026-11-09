import React from 'react'
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
function Auth({isModel = false}) {
    const dispatch = useDispatch()

    const handleGoogleAuth = async () => {
        try {
            const response = await signInWithPopup(auth,provider)
            let User = response.user
            const name = User.displayName || User.email?.split("@")[0] || "User"
            let email = User.email
            const result = await axios.post(ServerUrl + "/api/auth/google" , {name , email} , {withCredentials:true})
            dispatch(setUserData(result.data))
            


            
        } catch (error) {
            console.log(error)
              dispatch(setUserData(null))
        }
    }
  return (
    <div className={`
      w-full 
      ${isModel ? "py-4" : "min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 py-20"}
    `}>
        <motion.div 
        initial={{opacity:0 , y:-16}} 
        animate={{opacity:1 , y:0}} 
        transition={{duration:0.4}}
        className={`
        w-full 
        ${isModel ? "max-w-md p-8 rounded-2xl" : "max-w-lg p-12 rounded-2xl"}
        bg-white shadow-sm border border-gray-200
      `}>
            <div className='flex items-center justify-center gap-3 mb-6'>
                <div className='bg-emerald-500 text-white p-2 rounded-lg'>
                    <BsRobot size={18}/>

                </div>
                <h2 className='font-semibold text-lg text-gray-900'>InterviewBuddy</h2>
            </div>

            <div className='text-center mb-4'>
                <h1 className='text-2xl md:text-3xl font-semibold leading-snug tracking-tight text-gray-900'>
                    Continue with
                </h1>
                <span className='mt-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full inline-flex items-center gap-2 text-base font-medium'>
                    <IoSparkles size={15}/>
                    AI Smart Interview
                </span>
            </div>

            <p className='text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8'>
                Sign in to start  mock interviews,
        track your progress, and unlock detailed performance insights.
            </p>


            <motion.button 
            onClick={handleGoogleAuth}
            whileTap={{scale:0.98}}
            className='w-full flex items-center justify-center gap-3 py-3 bg-neutral-900 text-white rounded-full shadow-sm hover:bg-neutral-800 transition-colors duration-150 font-medium text-sm'>
                <FcGoogle size={20}/>
                Continue with Google

   
            </motion.button>
        </motion.div>

      
    </div>
  )
}

export default Auth
