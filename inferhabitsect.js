import React, { useEffect, useState, Suspense, lazy} from 'react';
//import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import '../App.css';
import {db,auth} from '../config/firebase.js';
import moment from 'moment';
import { AnimatePresence, motion } from "framer-motion";
import { Logout } from './logout.js';
import { Popup } from './popup.js';
import {getDocs,collection,addDoc,deleteDoc,updateDoc,doc, query, where} from 'firebase/firestore';
import axios from 'axios';
import { form } from 'framer-motion/m';

const Navigation = lazy(() => import('./navigation.js'));

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 1, 
        delay: 1,  // Add delay here (in seconds)
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

export const Inferhabitsect = () => {

    //databases
    const habitsref = collection(db, "habits");
    const habitattrref = collection(db, "habitattr");

    //states
    const [goaldescription, setGoaldescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [habits, setHabits] = useState([]);

    useEffect(() => {
      if(habits.length > 0) {
        AddHabitsToDb();
      }
    }, [habits]);

    const AddHabitsToDb = async () => {
      const habitSplit = habits

      console.log(habitSplit)

      if (!habitSplit || habitSplit.length === 0) return;
  
      //setLoading(true);
      try {
        //const habitCollection = collection(db, "habitAttributes");
        // Firestore "in" query limit is 10, so chunk the habits
        const chunkedHabitLists = [];
        for (let i = 0; i < habitSplit.length; i += 10) {
          chunkedHabitLists.push(habitSplit.slice(i, i + 10));
        }

        console.log(chunkedHabitLists)
  
        // Fetch all matching habits from Firestore
        const queries = chunkedHabitLists.map(async (chunk) => {
          const q = query(habitattrref, where("habitname", "in", chunk));
          const querySnapshot = await getDocs(q);
    
          // Convert .forEach() to .map() to allow async/await
          const addPromises = querySnapshot.docs.map(async (doc) => {
            const data = doc.data();

            const existq = query(habitsref, where("habitname", "==", data.habitname));
            const existquerySnapshot = await getDocs(existq);

            if (!existquerySnapshot.empty) {
              // A document with this habitname already exists
              console.log("Habit already exists!");
            }else{

              const daynum = parseInt(data.daynum, 10) || 1;
      
              // Generate day structure
              const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
              const selectedDays = daysOfWeek.slice(0, Math.min(daynum, 7));
              const dayStructure = selectedDays.map((day) => `{day:${day}-start:*-end:*}`).join("_");
      
              // Calculate start and end cycle
              const today = moment();
              const startOfWeek = today.startOf("isoWeek"); // Start of the current week (Monday)
              const startCycle = startOfWeek.format("DD/MM/YYYY");
              const endCycle = startOfWeek.add(daynum - 1, "days").format("DD/MM/YYYY");
      
              // Push data to Firestore (habits collection)
              await addDoc(habitsref, {
                habitname: data.habitname,
                maxduration: data.maxduration,
                updateinterval: data.updateinterval,
                dayattr: dayStructure,
                currentduration: 5,
                startcycle: startCycle,
                endcycle: endCycle,
                lastcompleted: "*",
                habitstreak: "*",
                userId: auth?.currentUser?.uid
              });
      
              console.log(`Habit ${data.habitname} added to Firestore!`);
            }
          });
    
          // Wait for all Firestore writes in this batch to complete
          return Promise.all(addPromises);
        });
    
        await Promise.all(queries); // Wait for all batch processing to finish
        console.log("All habits successfully added to Firestore.");
      } catch (error) {
        console.error("Error fetching and storing habits:", error);
      }
    };

    const handleDescriptionChange = (event) => {
      setGoaldescription(event.target.value);
    };

    const calculateHabits = async () => {
      //here I will do the api call

      setLoading(true);

      const postData = {
        goalmessage:goaldescription
      };

      axios.post('/api/inferhabits', postData)  // Flask POST API endpoint
      .then(response => {
        if(response.data.habits !== ""){
          setHabits(response.data.habits.split('|'));
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('Error posting data:', error);
      });
    }

    return(
        <Suspense fallback={<div class="wrapper"><div class="round"></div><div class="round"></div><div class="round"></div><div class="shadow"></div><div class="shadow"></div><div class="shadow"></div></div>}>
            <AnimatePresence mode="wait">
            <>
                <motion.div className='centered-container' {...pageVariants}>
                    <Navigation/>
                    <textarea
                      value={goaldescription} // Set the textarea value to state
                      onChange={handleDescriptionChange} // Handle user input
                      placeholder="Describe your goals and pain points etc. here"
                    />
                    <button onClick={calculateHabits} className="animated-button" width="140px">
                      <svg width="256px" height="256px" viewBox="0 0 64.00 64.00" class="arr-2" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#000000" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><circle cx="34.52" cy="11.43" r="5.82"></circle><circle cx="53.63" cy="31.6" r="5.82"></circle><circle cx="34.52" cy="50.57" r="5.82"></circle><circle cx="15.16" cy="42.03" r="5.82"></circle><circle cx="15.16" cy="19.27" r="5.82"></circle><circle cx="34.51" cy="29.27" r="4.7"></circle><line x1="20.17" y1="16.3" x2="28.9" y2="12.93"></line><line x1="38.6" y1="15.59" x2="49.48" y2="27.52"></line><line x1="50.07" y1="36.2" x2="38.67" y2="46.49"></line><line x1="18.36" y1="24.13" x2="30.91" y2="46.01"></line><line x1="20.31" y1="44.74" x2="28.7" y2="48.63"></line><line x1="17.34" y1="36.63" x2="31.37" y2="16.32"></line><line x1="20.52" y1="21.55" x2="30.34" y2="27.1"></line><line x1="39.22" y1="29.8" x2="47.81" y2="30.45"></line><line x1="34.51" y1="33.98" x2="34.52" y2="44.74"></line></g></svg>
                      <span class="text">Analyse</span>
                      <span class="circle"></span>
                      <svg width="256px" height="256px" viewBox="0 0 64.00 64.00" class="arr-1" xmlns="http://www.w3.org/2000/svg" stroke-width="3" stroke="#adff2f" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><circle cx="34.52" cy="11.43" r="5.82"></circle><circle cx="53.63" cy="31.6" r="5.82"></circle><circle cx="34.52" cy="50.57" r="5.82"></circle><circle cx="15.16" cy="42.03" r="5.82"></circle><circle cx="15.16" cy="19.27" r="5.82"></circle><circle cx="34.51" cy="29.27" r="4.7"></circle><line x1="20.17" y1="16.3" x2="28.9" y2="12.93"></line><line x1="38.6" y1="15.59" x2="49.48" y2="27.52"></line><line x1="50.07" y1="36.2" x2="38.67" y2="46.49"></line><line x1="18.36" y1="24.13" x2="30.91" y2="46.01"></line><line x1="20.31" y1="44.74" x2="28.7" y2="48.63"></line><line x1="17.34" y1="36.63" x2="31.37" y2="16.32"></line><line x1="20.52" y1="21.55" x2="30.34" y2="27.1"></line><line x1="39.22" y1="29.8" x2="47.81" y2="30.45"></line><line x1="34.51" y1="33.98" x2="34.52" y2="44.74"></line></g></svg>
                    </button>
                    
                    {loading &&
                    <div class="wrapper">
                      <div class="round"></div>
                      <div class="round"></div>
                      <div class="round"></div>
                      <div class="shadow"></div>
                      <div class="shadow"></div>
                      <div class="shadow"></div>
                    </div>
                    }
                    {habits.length > 0 &&
                      <>
                        <p>Habits inferred and saved:</p>
                        <ul>
                          {habits.map((habit, index) => (
                            <p key={index}>● {habit}</p>
                          ))}
                        </ul>
                      </>
                    }
                    <Logout/>
                </motion.div>
            </>
            </AnimatePresence>
        </Suspense>
    );
}
