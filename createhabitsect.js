import React, { useEffect, useState, Suspense, lazy} from 'react';
//import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import '../App.css';
import {db,auth} from '../config/firebase.js';
import { AnimatePresence, motion } from "framer-motion";
import { Logout } from './logout.js';
import { Popup } from './popup.js';
import {getDocs,collection,addDoc,deleteDoc,updateDoc,doc,query, where} from 'firebase/firestore';
import axios from 'axios';
import { form } from 'framer-motion/m';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

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

export const Createhabitsect = () => {

    const initialDays = [
      { day: "Monday", starttime: "", endtime: "" },
      { day: "Tuesday", starttime: "", endtime: "" },
      { day: "Wednesday", starttime: "", endtime: "" },
      { day: "Thursday", starttime: "", endtime: "" },
      { day: "Friday", starttime: "", endtime: "" },
      { day: "Saturday", starttime: "", endtime: "" },
      { day: "Sunday", starttime: "", endtime: "" }
    ];

    const [days, setDays] = useState(initialDays);
    const [selectedDays, setSelectedDays] = useState([]);

    const [habitname, setHabitname] = useState("");
    const [currentduration, setCurrentduration] = useState("");
    const [maxduration, setMaxduration] = useState("");
    const [habitinterval, setHabitinterval] = useState("");

    const [invalidtimepopup, setInvalidtimepopup] = useState(false);
    const [durationpopup, setDurationpopup] = useState(false);
    const [intervalpopup, setIntervalpopup] = useState(false);
    const [habitaddedpopup, setHabitaddedpopup] = useState(false);

    const habitsref = collection(db, "habits");

    useEffect(() => {
      setDays(initialDays);
    }, [currentduration]);
    
    const SelectDaytoEdit = (dayObj) => {
      const dayName = dayObj.day;
      const isSelected = selectedDays.includes(dayName);
      if (isSelected) {
        setSelectedDays(selectedDays.filter(day => day !== dayName));
      } else{
        setSelectedDays([...selectedDays, dayName]);
      }
    };

    const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

    const isPositiveInteger = (value) => {
    // Check if the string represents a positive integer
      return /^\d+$/.test(value) && parseInt(value) > 0;
    };
    
    const addMinutes = (timeStr, minsToAdd) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date(0, 0, 0, hours, minutes + minsToAdd);
      return date.toTimeString().slice(0, 5); // HH:MM
    };

    const subtractMinutes = (timeStr, minsToSubtract) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date(0, 0, 0, hours, minutes - minsToSubtract);
      return date.toTimeString().slice(0, 5); // HH:MM
    };
    

    const handleStartTimeChange = (index, value) => {
      const updatedDays = [...days];
      updatedDays[index].starttime = value;
    
      if (isValidTime(value) && parseInt(currentduration, 10) !== 0) {
        updatedDays[index].endtime = addMinutes(value, parseInt(currentduration, 10));
      }
    
      setDays(updatedDays);
    };
    
    const handleEndTimeChange = (index, value) => {
      const updatedDays = [...days];
      updatedDays[index].endtime = value;
    
      if (isValidTime(value) && parseInt(currentduration, 10) !== 0) {
        updatedDays[index].starttime = subtractMinutes(value, parseInt(currentduration, 10));
      }
    
      setDays(updatedDays);
    };


    const AddHabittoDb = async () => {
      if (!habitname) {
        //alert("Habit name is required.");
        return;
      }

      const correctformatting = selectedDays.every(dayName => {
        const day = days.find(d => d.day === dayName);
        if (!day) return true;

        const {day: dayNameFromState, starttime, endtime} = day;

        return (
          (!starttime || isValidTime(starttime)) &&
          (!endtime || isValidTime(endtime))
        );
      });

      if(correctformatting === false){
        setInvalidtimepopup(true);
        return;
      }

      if(!isPositiveInteger(currentduration) || !isPositiveInteger(maxduration) || (parseInt(maxduration) < parseInt(currentduration))){
        setDurationpopup(true);
        return;
      }

      if(!isPositiveInteger(habitinterval) || (parseInt(maxduration) < 1 )){
        setIntervalpopup(true);
        return;
      }
      //check maxduration and currentduration are both integers and maxduration > currentduration

      // Step 1: Check if habit with same name exists for this user
      const habitsQuery = query(
        habitsref,
        where("userId", "==", auth?.currentUser?.uid),
        where("habitname", "==", habitname)
      );

      try {
        const querySnapshot = await getDocs(habitsQuery);
        if (!querySnapshot.empty) {
          //alert("You already have a habit with this name.");
          return;
        }
      } catch (error) {
        console.error("Error checking for existing habit:", error);
        alert("Error checking habit. Try again.");
        return;
      }

      // Step 2: Construct dayattr string
      const DayAttrs = days
        .filter(d => selectedDays.includes(d.day))
        .map(d => {
          const start = d.starttime.trim() || "*";
          const end = d.endtime.trim() || "*";
          return `{day:${d.day}-start:${start}-end:${end}}`;
        });

      const DayAttrString = DayAttrs.join('_');

      // Step 3: Weekday calculation
      const dayNameToIsoNumber = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6
      };

      const selectedDayNumbers = selectedDays.map(day => dayNameToIsoNumber[day]);
      if (selectedDayNumbers.length === 0) {
        //alert("Please select at least one day.");
        return;
      }

      const minDay = Math.min(...selectedDayNumbers);
      const maxDay = Math.max(...selectedDayNumbers);

      const now = dayjs();
      const weekStart = now.startOf('isoWeek'); // Monday
      const startOfWeek = weekStart.add(minDay, 'day').startOf('day');
      const endOfWeek = weekStart.add(maxDay, 'day').startOf('day');

      const startCycle = startOfWeek.format("DD/MM/YYYY");
      const endCycle = endOfWeek.format("DD/MM/YYYY");

      // Step 4: Save to DB
      try {
        await addDoc(habitsref, {
          habitname: habitname.trim(),
          maxduration: parseInt(maxduration.trim()),
          updateinterval: parseInt(habitinterval.trim()),
          dayattr: DayAttrString,
          currentduration: parseInt(currentduration.trim()),
          startcycle: startCycle,
          endcycle: endCycle,
          lastcompleted: "*",
          habitstreak: "*",
          userId: auth?.currentUser?.uid
        });
        setHabitaddedpopup(true);
      } catch (err) {
        console.error("Error adding habit:", err);
        alert("Failed to add habit.");
      }
    };


    return(
        <Suspense fallback={<div class="wrapper"><div class="round"></div><div class="round"></div><div class="round"></div><div class="shadow"></div><div class="shadow"></div><div class="shadow"></div></div>}>
            <AnimatePresence mode="wait">
            <>
                <motion.div className={(durationpopup || intervalpopup || invalidtimepopup || habitaddedpopup) ? 'centered-container-new' : 'centered-container'} {...pageVariants}>
                    <Popup 
                      isOpen={invalidtimepopup} 
                      onClose={() => setInvalidtimepopup(false)} 
                      heading={'Incorrect Time Format'}
                      subheading={'times are in the wrong format'}
                    />
                    <Popup 
                      isOpen={durationpopup} 
                      onClose={() => setDurationpopup(false)} 
                      heading={'Duration Error'}
                      subheading={'incorrect formats or maximum duration < current duration'}
                    />
                    <Popup 
                      isOpen={intervalpopup} 
                      onClose={() => setIntervalpopup(false)} 
                      heading={'Interval Error'}
                      subheading={'habit interval has to be greater than or equal to 1'}
                    />
                    <Popup 
                      isOpen={habitaddedpopup} 
                      onClose={() => setHabitaddedpopup(false)} 
                      heading={'Habit Added'}
                      subheading={'check edit section to see and/or change habit settings'}
                    />
                    <Navigation/>
                    <p></p>
                    <div className="arrange-horizontal-grid">
      
                      <div className="form-control">
                        <input 
                            type="text"
                            value={habitname}
                            onChange={(e) => setHabitname(e.target.value)}
                            required
                        />
                        <label>
                            <span style={{transitionDelay: '0ms'}} >H</span>
                            <span style={{transitionDelay: '50ms'}}>a</span>
                            <span style={{transitionDelay: '100ms'}}>b</span>
                            <span style={{transitionDelay: '150ms'}}>i</span>
                            <span style={{transitionDelay: '200ms'}}>t</span>
                            <span style={{transitionDelay: '250ms'}}> </span>
                            <span style={{transitionDelay: '300ms'}}>n</span>
                            <span style={{transitionDelay: '350ms'}}>a</span>
                            <span style={{transitionDelay: '400ms'}}>m</span>
                            <span style={{transitionDelay: '450ms'}}>e</span>
                        </label>
                      </div>

                      <div className="form-control">
                        <input 
                            type="text"
                            value={currentduration}
                            onChange={(e) => setCurrentduration(e.target.value)}
                            required
                        />
                        <label>
                            <span style={{transitionDelay: '0ms'}} >D</span>
                            <span style={{transitionDelay: '50ms'}}>u</span>
                            <span style={{transitionDelay: '100ms'}}>r</span>
                            <span style={{transitionDelay: '150ms'}}>a</span>
                            <span style={{transitionDelay: '200ms'}}>t</span>
                            <span style={{transitionDelay: '250ms'}}>i</span>
                            <span style={{transitionDelay: '300ms'}}>o</span>
                            <span style={{transitionDelay: '350ms'}}>n</span>
                            <span style={{transitionDelay: '400ms'}}> </span>
                            <span style={{transitionDelay: '450ms'}}>m</span>
                            <span style={{transitionDelay: '500ms'}}>i</span>
                            <span style={{transitionDelay: '550ms'}}>n</span>
                        </label>
                      </div>

                      <div className="form-control">
                        <input 
                            type="text"
                            value={maxduration}
                            onChange={(e) => setMaxduration(e.target.value)}
                            required
                        />
                        <label>
                            <span style={{transitionDelay: '0ms'}} >M</span>
                            <span style={{transitionDelay: '50ms'}}>a</span>
                            <span style={{transitionDelay: '100ms'}}>x</span>
                            <span style={{transitionDelay: '150ms'}}> </span>
                            <span style={{transitionDelay: '200ms'}}>d</span>
                            <span style={{transitionDelay: '250ms'}}>u</span>
                            <span style={{transitionDelay: '300ms'}}>r</span>
                            <span style={{transitionDelay: '350ms'}}>a</span>
                            <span style={{transitionDelay: '400ms'}}>t</span>
                            <span style={{transitionDelay: '450ms'}}>i</span>
                            <span style={{transitionDelay: '500ms'}}>o</span>
                            <span style={{transitionDelay: '550ms'}}>n</span>
                            <span style={{transitionDelay: '600ms'}}> </span>
                            <span style={{transitionDelay: '650ms'}}>m</span>
                            <span style={{transitionDelay: '650ms'}}>i</span>
                            <span style={{transitionDelay: '650ms'}}>n</span>
                        </label>
                      </div>

                      <div className="form-control">
                        <input 
                            type="text"
                            value={habitinterval}
                            onChange={(e) => setHabitinterval(e.target.value)}
                            required
                        />
                        <label>
                            <span style={{transitionDelay: '0ms'}}>I</span>
                            <span style={{transitionDelay: '50ms'}}>n</span>
                            <span style={{transitionDelay: '100ms'}}>t</span>
                            <span style={{transitionDelay: '150ms'}}>e</span>
                            <span style={{transitionDelay: '200ms'}}>r</span>
                            <span style={{transitionDelay: '250ms'}}>v</span>
                            <span style={{transitionDelay: '300ms'}}>a</span>
                            <span style={{transitionDelay: '350ms'}}>l</span>
                            <span style={{transitionDelay: '400ms'}}> </span>
                            <span style={{transitionDelay: '450ms'}}>d</span>
                            <span style={{transitionDelay: '500ms'}}>a</span>
                            <span style={{transitionDelay: '550ms'}}>y</span>
                            <span style={{transitionDelay: '600ms'}}>s</span>
                        </label>
                      </div>

                      <button onClick={AddHabittoDb} className="animated-button" width="140px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke="currentColor" height="24" fill="none" class="arr-2">
                            <line y2="19" y1="5" x2="12" x1="12"></line>
                            <line y2="12" y1="12" x2="19" x1="5"></line>
                        </svg>
                        <span class="text">Save it</span>
                        <span class="circle"></span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke="currentColor" height="24" fill="none" class="arr-1">
                            <line y2="19" y1="5" x2="12" x1="12"></line>
                            <line y2="12" y1="12" x2="19" x1="5"></line>
                        </svg>
                      </button>

                    </div>
                    <motion.ul
                      key={currentduration}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <AnimatePresence mode='wait'>
                        {days.map((theday, index) => (
                          //here we just use whatever fields you put in the data<span class="text">Add Task</span>
                          //code for an input to update a specific index <input placeholder='new name' value={newtask[thedbtask.id] || ""} onChange={(e) => handleInputChange(thedbtask.id, e.target.value)}/>
                          //code to update the actual task from the input field <button onClick={() => handleUpdate(thedbtask.id)}>Update</button>
                          <motion.li
                            key={index}
                            className="habitfeatures"
                            initial={{ opacity: 0, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 0 }}
                            transition={{ duration: 0.7 }}
                          >
                            <label class="container">
                              <input
                                type="checkbox"
                                checked={selectedDays.includes(theday.day)}
                                onChange={() => SelectDaytoEdit(theday)}
                              />
                              <svg viewBox="0 0 64 64" height="2em" width="2em">
                                <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
                              </svg>
                            </label>
                            <p>{theday.day}</p>
                            <div className="form-control">
                              <input 
                                  type="text"
                                  value={theday.starttime}
                                  onChange={(e) => handleStartTimeChange(index, e.target.value)}
                                  required
                              />
                              <label>
                                <span style={{transitionDelay: '0ms'}} >S</span>
                                <span style={{transitionDelay: '50ms'}}>t</span>
                                <span style={{transitionDelay: '100ms'}}>a</span>
                                <span style={{transitionDelay: '150ms'}}>r</span>
                                <span style={{transitionDelay: '200ms'}}>t</span>
                                <span style={{transitionDelay: '250ms'}}> </span>
                                <span style={{transitionDelay: '300ms'}}>t</span>
                                <span style={{transitionDelay: '350ms'}}>i</span>
                                <span style={{transitionDelay: '400ms'}}>m</span>
                                <span style={{transitionDelay: '450ms'}}>e</span>
                                <span style={{transitionDelay: '500ms'}}> </span>
                                <span style={{transitionDelay: '550ms'}}>H</span>
                                <span style={{transitionDelay: '600ms'}}>H</span>
                                <span style={{transitionDelay: '650ms'}}>:</span>
                                <span style={{transitionDelay: '700ms'}}>M</span>
                                <span style={{transitionDelay: '750ms'}}>M</span>
                              </label>
                            </div>

                            <div className="form-control">
                              <input 
                                  type="text"
                                  value={theday.endtime}
                                  onChange={(e) => handleEndTimeChange(index, e.target.value)}
                                  required
                              />
                              <label>
                                  <span style={{transitionDelay: '0ms'}} >E</span>
                                  <span style={{transitionDelay: '50ms'}}>n</span>
                                  <span style={{transitionDelay: '100ms'}}>d</span>
                                  <span style={{transitionDelay: '150ms'}}> </span>
                                  <span style={{transitionDelay: '200ms'}}>t</span>
                                  <span style={{transitionDelay: '250ms'}}>i</span>
                                  <span style={{transitionDelay: '300ms'}}>m</span>
                                  <span style={{transitionDelay: '350ms'}}>e</span>
                                  <span style={{transitionDelay: '400ms'}}> </span>
                                  <span style={{transitionDelay: '450ms'}}>H</span>
                                  <span style={{transitionDelay: '500ms'}}>H</span>
                                  <span style={{transitionDelay: '550ms'}}>:</span>
                                  <span style={{transitionDelay: '600ms'}}>M</span>
                                  <span style={{transitionDelay: '650ms'}}>M</span>
                              </label>
                            </div>

                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </motion.ul>
                    <Logout />
                </motion.div>
            </>
            </AnimatePresence>
        </Suspense>
    );
}

