import React, { useState } from "react";
import { useMediaQuery } from 'react-responsive';
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import '../App.css';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 1, 
        delay: 2,  // Add delay here (in seconds)
        ease: "easeInOut"
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { 
        duration: 1, 
        ease: "easeInOut" 
      } 
    }
};

const Navigation = () => {
    const navigate = useNavigate();
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' });

    const YourTasks = () => {
        navigate("/home");
    }

    const FigureOutHabits = () => {
        navigate("/inferhabits");
    }

    const CreateOwnHabits = () => {
        navigate("/createhabits");
    }

    const EditHabits = () => {
        navigate("/edithabits");
    }

    return (

        <AnimatePresence mode="wait">
            <motion.div 
                className='arrange-horizontal-navbar'
                {...pageVariants}
            >
                <button onClick={YourTasks} className="animated-button">
                    {isMobile ? <svg class="arr-2"></svg> : <svg width="256px" height="256px" viewBox="0 0 24.00 24.00" fill="none" class="arr-2" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.096"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 11.25H16.5V12.75H10.5V11.25Z" fill="#000000"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 7.5H16.5V9H10.5V7.5Z" fill="#000000"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 15H16.5V16.5H10.5V15Z" fill="#000000"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 7.5H9V9H7.5V7.5Z" fill="#000000"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 11.25H9V12.75H7.5V11.25Z" fill="#000000"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 15H9V16.5H7.5V15Z" fill="#000000"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.75 4.5L4.5 3.75H19.5L20.25 4.5V19.5L19.5 20.25H4.5L3.75 19.5V4.5ZM5.25 5.25V18.75H18.75V5.25H5.25Z" fill="#000000"></path> </g></svg>}
                    <span class="text">Tasks</span>
                    <span class="circle"></span>
                    {isMobile ? <svg class="arr-1"></svg> : <svg width="256px" height="256px" viewBox="0 0 24.00 24.00" fill="none" class="arr-1" xmlns="http://www.w3.org/2000/svg" stroke="#adff2f" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.096"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 11.25H16.5V12.75H10.5V11.25Z" fill="#adff2f"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 7.5H16.5V9H10.5V7.5Z" fill="#adff2f"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 15H16.5V16.5H10.5V15Z" fill="#adff2f"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 7.5H9V9H7.5V7.5Z" fill="#adff2f"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 11.25H9V12.75H7.5V11.25Z" fill="#adff2f"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 15H9V16.5H7.5V15Z" fill="#adff2f"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.75 4.5L4.5 3.75H19.5L20.25 4.5V19.5L19.5 20.25H4.5L3.75 19.5V4.5ZM5.25 5.25V18.75H18.75V5.25H5.25Z" fill="#adff2f"></path> </g></svg>}
                </button>
                
                <button onClick={FigureOutHabits} className="animated-button">
                    {isMobile ? <svg class="arr-2"></svg> : <svg width="256px" height="256px" viewBox="0 0 64.00 64.00" class="arr-2" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#000000" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><circle cx="34.52" cy="11.43" r="5.82"></circle><circle cx="53.63" cy="31.6" r="5.82"></circle><circle cx="34.52" cy="50.57" r="5.82"></circle><circle cx="15.16" cy="42.03" r="5.82"></circle><circle cx="15.16" cy="19.27" r="5.82"></circle><circle cx="34.51" cy="29.27" r="4.7"></circle><line x1="20.17" y1="16.3" x2="28.9" y2="12.93"></line><line x1="38.6" y1="15.59" x2="49.48" y2="27.52"></line><line x1="50.07" y1="36.2" x2="38.67" y2="46.49"></line><line x1="18.36" y1="24.13" x2="30.91" y2="46.01"></line><line x1="20.31" y1="44.74" x2="28.7" y2="48.63"></line><line x1="17.34" y1="36.63" x2="31.37" y2="16.32"></line><line x1="20.52" y1="21.55" x2="30.34" y2="27.1"></line><line x1="39.22" y1="29.8" x2="47.81" y2="30.45"></line><line x1="34.51" y1="33.98" x2="34.52" y2="44.74"></line></g></svg>}
                    <span class="text">Infer</span>
                    <span class="circle"></span>
                    {isMobile ? <svg class="arr-1"></svg> : <svg width="256px" height="256px" viewBox="0 0 64.00 64.00" class="arr-1" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#adff2f" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><circle cx="34.52" cy="11.43" r="5.82"></circle><circle cx="53.63" cy="31.6" r="5.82"></circle><circle cx="34.52" cy="50.57" r="5.82"></circle><circle cx="15.16" cy="42.03" r="5.82"></circle><circle cx="15.16" cy="19.27" r="5.82"></circle><circle cx="34.51" cy="29.27" r="4.7"></circle><line x1="20.17" y1="16.3" x2="28.9" y2="12.93"></line><line x1="38.6" y1="15.59" x2="49.48" y2="27.52"></line><line x1="50.07" y1="36.2" x2="38.67" y2="46.49"></line><line x1="18.36" y1="24.13" x2="30.91" y2="46.01"></line><line x1="20.31" y1="44.74" x2="28.7" y2="48.63"></line><line x1="17.34" y1="36.63" x2="31.37" y2="16.32"></line><line x1="20.52" y1="21.55" x2="30.34" y2="27.1"></line><line x1="39.22" y1="29.8" x2="47.81" y2="30.45"></line><line x1="34.51" y1="33.98" x2="34.52" y2="44.74"></line></g></svg>}
                </button>

                <button onClick={CreateOwnHabits} className="animated-button">
                    {isMobile ? <svg class="arr-2"></svg> : <svg width="256px" height="256px" viewBox="0 0 24 24" class="arr-2" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect x="0" fill="none" width="24" height="24"></rect> <g> <path d="M21 14v5c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V5c0-1.105.895-2 2-2h5v2H5v14h14v-5h2z"></path> <path d="M21 7h-4V3h-2v4h-4v2h4v4h2V9h4"></path> </g> </g></svg>}
                    <span class="text">Add</span>
                    <span class="circle"></span>
                    {isMobile ? <svg class="arr-1"></svg> : <svg width="256px" height="256px" viewBox="0 0 24 24" class="arr-1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect x="0" fill="none" width="24" height="24"></rect> <g> <path d="M21 14v5c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V5c0-1.105.895-2 2-2h5v2H5v14h14v-5h2z"></path> <path d="M21 7h-4V3h-2v4h-4v2h4v4h2V9h4"></path> </g> </g></svg>}
                </button>

                <button onClick={EditHabits} className="animated-button">
                    {isMobile ? <svg class="arr-2"></svg> : <svg width="256px" height="256px" class="arr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="edit"> <g> <path d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <polygon fill="none" points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polygon> </g> </g> </g> </g></svg>}
                    <span class="text">Edit</span>
                    <span class="circle"></span>
                    {isMobile ? <svg class="arr-1"></svg> : <svg width="256px" height="256px" class="arr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="edit"> <g> <path d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8" fill="none" stroke="#adff2f" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <polygon fill="none" points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8" stroke="#adff2f" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polygon> </g> </g> </g> </g></svg>}
                </button>

                {isMobile ? <h1></h1> : <h1>Habit Centred Todolist</h1>}
            </motion.div>
        </AnimatePresence>
    );
}

export default Navigation;