import React, { useEffect, useState, Suspense, lazy} from 'react';
//import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import '../App.css';
import {db,auth} from '../config/firebase.js';
import { AnimatePresence, motion } from "framer-motion";
import { Logout } from './logout.js';
import { Popup } from './popup.js';
import {getDocs,getDoc,collection,addDoc,deleteDoc,updateDoc,doc, query, where} from 'firebase/firestore';
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

export const Edithabitsect = () => {
    const initialDays = [
      { day: "Monday", starttime: "", endtime: "" },
      { day: "Tuesday", starttime: "", endtime: "" },
      { day: "Wednesday", starttime: "", endtime: "" },
      { day: "Thursday", starttime: "", endtime: "" },
      { day: "Friday", starttime: "", endtime: "" },
      { day: "Saturday", starttime: "", endtime: "" },
      { day: "Sunday", starttime: "", endtime: "" }
    ];

    const currenthabitcollectionref = collection(db, "habits");
    const todaycollectionref = collection(db, "todayhabitstatus");
    const sleepcollection = collection(db, "sleepschedule");

    const [dbhabits, setDbhabits] = useState([]);
    const [days, setDays] = useState(initialDays);
    const examplecheckboolean = true;
    const [selectedHabits, setSelectedHabits] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);
    const [currentDuration, setCurrentDuration] = useState(0);
    const MAX_SELECTION = 1;

    const [MAX_DAY_SELECTION, setMaxDaySelection] = useState(1);

    const [sleeptime, setSleeptime] = useState("");
    const [waketime, setWaketime] = useState("");

    const [invalidtimepopup, setInvalidtimepopup] = useState(false);
    const [habitselectionpopup, setHabitselectionpopup] = useState(false);
    const [enoughdayspopup, setEnoughdayspopup] = useState(false);
    const [editaddedpopup, setEditaddedpopup] = useState(false);
    const [sleepamountpopup, setSleepamountpopup] = useState(false);

    useEffect(() => {
        const fetchData = async () => { //here I would make a function to updatehabits
          await getDbhabits();
          await getSleepschedule();
        };
        fetchData();
    }, []);

    const getDbhabits = async () => {
        //Read data from database
        //set the dbtasklist state to equal the data
        //setCalendar([]);
        try{
          const data = await getDocs(currenthabitcollectionref);
          const filteredData = data.docs.map((doc) => ({...doc.data(), id: doc.id,}));
          setDbhabits(filteredData);
          //setCalendar([]);
          //setAdjustschedule(true);
        }
        catch(err){
          console.error(err);
        }
    
    };

    const getSleepschedule = async () => {
      const q = query(sleepcollection, where("userId", "==", auth?.currentUser?.uid));

      try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setSleeptime(data.sleeptime);
          setWaketime(data.waketime);
        }

      } catch (error) {
        console.error("Error fetching sleep schedule:", error);
      }
    }

    const deleteHabit = async (id) => {
      try {
        const habitDocRef = doc(db, "habits", id);
        const habitDocSnap = await getDoc(habitDocRef);
    
        if (!habitDocSnap.exists()) {
          console.warn("Habit not found.");
          return;
        }
    
        const habitData = habitDocSnap.data();
        const habitname = habitData.habitname;
    
        if (!habitname) {
          console.error("Habit data is missing the habitname field.");
          return;
        }
    
        await deleteDoc(habitDocRef);
    
        const todayQuery = query(
          todaycollectionref,
          where("habitname", "==", habitname),
          where("userId", "==", auth?.currentUser?.uid)
        );
    
        const todaySnapshot = await getDocs(todayQuery);
    
        await Promise.all(todaySnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
    
        await getDbhabits();
      } catch (error) {
        console.error("Error deleting habit and related today entry:", error);
      }
    };    

    const SelectDaytoEdit = (dayObj) => {
      const dayName = dayObj.day;
      const isSelected = selectedDays.includes(dayName);
      if (isSelected) {
        setSelectedDays(selectedDays.filter(day => day !== dayName));
      } else if (selectedDays.length < MAX_DAY_SELECTION) {
        setSelectedDays([...selectedDays, dayName]);
      }
    };

    const SelectHabittoEdit = (habitId) => {
      const isSelected = selectedHabits.includes(habitId);
    
      if (isSelected) {
        //setSelectedHabits(selectedHabits.filter(id => id !== habitId));
        setSelectedHabits([]);
        setSelectedDays([]);
        setDays(initialDays); // Reset days
        setMaxDaySelection(1);
        setCurrentDuration(0);
      } else{
        const selectedHabit = dbhabits.find(habit => habit.id === habitId);
    
        if (selectedHabit) {
          const parsed = parseDayAttr(selectedHabit.dayattr);
          const updatedDays = initialDays.map(day => {
            const match = parsed.find(p => p.day === day.day);
            return match ? { ...day, starttime: match.starttime, endtime: match.endtime } : day;
          });
    
          const newSelectedDays = parsed.map(p => p.day);
    
          //setSelectedHabits([...selectedHabits, habitId]);
          setSelectedHabits([habitId]);
          setCurrentDuration(selectedHabit?.currentduration || 0);
          setDays(updatedDays);
          setSelectedDays(newSelectedDays);
          setMaxDaySelection(newSelectedDays.length);
        }
      }
    };

    const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

    const isValidSleepSchedule = () => {

      const [sleepHour, sleepMinute] = sleeptime.split(":").map(Number);
      const [wakeHour, wakeMinute] = waketime.split(":").map(Number);

      // Base date — arbitrary, just for calculation
      const today = new Date();
      const sleepTimeDate = new Date(today);
      sleepTimeDate.setHours(sleepHour, sleepMinute, 0, 0);

      const wakeTimeDate = new Date(today);
      wakeTimeDate.setHours(wakeHour, wakeMinute, 0, 0);

      // If wake time is earlier than or equal to sleep time, it's the next day
      if (wakeTimeDate <= sleepTimeDate) {
        wakeTimeDate.setDate(wakeTimeDate.getDate() + 1);
      }

      const diffMs = wakeTimeDate - sleepTimeDate;
      const diffHours = diffMs / (1000 * 60 * 60);

      return diffHours >= 8;
    }

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
    
      if (isValidTime(value) && currentDuration !== 0) {
        updatedDays[index].endtime = addMinutes(value, currentDuration);
      }
    
      setDays(updatedDays);
    };
    
    const handleEndTimeChange = (index, value) => {
      const updatedDays = [...days];
      updatedDays[index].endtime = value;
    
      if (isValidTime(value) && currentDuration !== 0) {
        updatedDays[index].starttime = subtractMinutes(value, currentDuration);
      }
    
      setDays(updatedDays);
    };

    const parseDayAttr = (dayattr) => {
      const parsed = [];
    
      const dayChunks = dayattr.split('_');
      for (const chunk of dayChunks) {
        const match = chunk.match(/\{day:(.*?)-start:(.*?)-end:(.*?)\}/);
        if (match) {
          const [, day, start, end] = match;
          parsed.push({day, starttime: start.replace(/\*/g, ""), endtime: end.replace(/\*/g, "")});
        }
      }
    
      return parsed;
    };

    const saveSleepData = async() => {

      if(!isValidTime(waketime) || !isValidTime(sleeptime)){
        setInvalidtimepopup(true);
        return;
      }

      if(!isValidSleepSchedule()){
        setSleepamountpopup(true);
        return;
      }

      try {
        const q = query(sleepcollection, where("userId", "==", auth?.currentUser?.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Document exists, update the first match
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, {
            sleeptime: sleeptime,
            waketime: waketime
          });
          console.log("Document updated");
        } else {
          // Document does not exist, create a new one
          await addDoc(sleepcollection, {
            userId: auth?.currentUser?.uid,
            sleeptime: sleeptime,
            waketime: waketime
          });
          console.log("Document created");
        }
        setEditaddedpopup(true);
      } catch (error) {
        console.error("Error saving sleep data:", error);
      }
    };

    const SaveSelections = async () => {

      if (selectedHabits.length === 0) {
        setHabitselectionpopup(true);
        return;
      }

      if(selectedDays.length < MAX_DAY_SELECTION){
        setEnoughdayspopup(true);
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

      const habitId = selectedHabits[0];
      const habitDocRef = doc(db, "habits", habitId);
    
      // Filter days based on selectedDays
      const updatedDayAttrs = days
        .filter(d => selectedDays.includes(d.day))
        .map(d => {
          const start = d.starttime.trim() || "*";
          const end = d.endtime.trim() || "*";
          return `{day:${d.day}-start:${start}-end:${end}}`;
        });
    
      const updatedDayAttrString = updatedDayAttrs.join('_');

      //also need to change the dates
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
    
      try {
        await updateDoc(habitDocRef, {
          dayattr: updatedDayAttrString,
          startcycle: startCycle,
          endcycle: endCycle
        });
        setEditaddedpopup(true);
        await getDbhabits();
      } catch (err) {
        console.error("Error updating habit:", err);
        alert("Failed to update habit.");
      }
    };    

    return (
        <Suspense fallback={<div class="wrapper"><div class="round"></div><div class="round"></div><div class="round"></div><div class="shadow"></div><div class="shadow"></div><div class="shadow"></div></div>}>
            <AnimatePresence mode="wait">
            <>
              <motion.div className={(habitselectionpopup || enoughdayspopup || invalidtimepopup || editaddedpopup || sleepamountpopup) ? 'centered-container-new' : 'centered-container'} {...pageVariants}>
                <Popup 
                  isOpen={habitselectionpopup} 
                  onClose={() => setHabitselectionpopup(false)} 
                  heading={'Missing Selection'}
                  subheading={'a habit was not selected'}
                />
                <Popup 
                  isOpen={enoughdayspopup} 
                  onClose={() => setEnoughdayspopup(false)} 
                  heading={'Not Enough Days'}
                  subheading={'same amount of days not selected'}
                />
                <Popup 
                  isOpen={invalidtimepopup} 
                  onClose={() => setInvalidtimepopup(false)} 
                  heading={'Incorrect Time Format'}
                  subheading={'times are in the wrong format'}
                />
                <Popup 
                  isOpen={sleepamountpopup} 
                  onClose={() => setSleepamountpopup(false)} 
                  heading={'Not Enough Sleep'}
                  subheading={'minimum of 8 hours of sleep needed'}
                />
                <Popup 
                  isOpen={editaddedpopup} 
                  onClose={() => setEditaddedpopup(false)} 
                  heading={'Changes Saved Successfully'}
                  subheading={'your changes have been committed'}
                />
                <Navigation/>
                <p></p>
                <p>Your Habits</p>
                <motion.ul
                  key={dbhabits} // Ensures re-animation when a task is added
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {dbhabits.filter((thedbhabit) => thedbhabit.userId === auth?.currentUser?.uid).length === 0 && (
                    <p>(You haven't added any habits!)</p>
                  )}
                  <AnimatePresence mode='wait'>
                    {dbhabits.filter((thedbhabit) => thedbhabit.userId === auth?.currentUser?.uid)
                    .map((thedbhabit, index) => (
                      //here we just use whatever fields you put in the data<span class="text">Add Task</span>
                      //code for an input to update a specific index <input placeholder='new name' value={newtask[thedbtask.id] || ""} onChange={(e) => handleInputChange(thedbtask.id, e.target.value)}/>
                      //code to update the actual task from the input field <button onClick={() => handleUpdate(thedbtask.id)}>Update</button>
                      <motion.li
                        key={index}
                        className="task-item"
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ duration: 0.7 }}
                      >
                        <label class="container">
                          <input
                            type="checkbox"
                            checked={selectedHabits.includes(thedbhabit.id)}
                            onChange={() => SelectHabittoEdit(thedbhabit.id)}
                            disabled={
                                !selectedHabits.includes(thedbhabit.id) &&
                                selectedHabits.length >= MAX_SELECTION
                            }
                          />
                          <svg viewBox="0 0 64 64" height="2em" width="2em">
                            <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
                          </svg>
                        </label>
                        <p>{thedbhabit.habitname}</p>
                        <button onClick={() => deleteHabit(thedbhabit.id)} className="animated-button">
                          <svg viewBox="0 0 448 512" class="arr-2">
                            <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                          </svg>
                          <span class="text">Delete</span>
                          <span class="circle"></span>
                          <svg viewBox="0 0 448 512" class="arr-1">
                            <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                          </svg>
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
                <p>Habit Settings</p>
                <motion.ul
                  key={dbhabits.length} // Ensures re-animation when a task is added
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
                            disabled={
                                !selectedDays.includes(theday.day) &&
                                selectedDays.length >= MAX_DAY_SELECTION
                            }
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
                <button onClick={SaveSelections} className="animated-button">
                  <svg width="256px" height="256px" class="arr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="edit"> <g> <path d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <polygon fill="none" points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polygon> </g> </g> </g> </g></svg>
                  <span class="text">Save</span>
                  <span class="circle"></span>
                  <svg width="256px" height="256px" class="arr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="edit"> <g> <path d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8" fill="none" stroke="#adff2f" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <polygon fill="none" points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8" stroke="#adff2f" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polygon> </g> </g> </g> </g></svg>
                </button>
                <p>Sleep Schedule Settings</p>
                <div>
                  <div className="form-control">
                    <input 
                        type="text"
                        value={waketime}
                        onChange={(e) => setWaketime(e.target.value)}
                        required
                    />
                    <label>
                      <span style={{transitionDelay: '0ms'}} >W</span>
                      <span style={{transitionDelay: '50ms'}}>a</span>
                      <span style={{transitionDelay: '100ms'}}>k</span>
                      <span style={{transitionDelay: '150ms'}}>e</span>
                      <span style={{transitionDelay: '200ms'}}> </span>
                      <span style={{transitionDelay: '250ms'}}>u</span>
                      <span style={{transitionDelay: '300ms'}}>p</span>
                      <span style={{transitionDelay: '350ms'}}> </span>
                      <span style={{transitionDelay: '400ms'}}>H</span>
                      <span style={{transitionDelay: '450ms'}}>H</span>
                      <span style={{transitionDelay: '500ms'}}>:</span>
                      <span style={{transitionDelay: '550ms'}}>M</span>
                      <span style={{transitionDelay: '600ms'}}>M</span>
                    </label>
                  </div>
                  <div className="form-control">
                    <input 
                        type="text"
                        value={sleeptime}
                        onChange={(e) => setSleeptime(e.target.value)}
                        required
                    />
                    <label>
                      <span style={{transitionDelay: '0ms'}} >B</span>
                      <span style={{transitionDelay: '50ms'}}>e</span>
                      <span style={{transitionDelay: '100ms'}}>d</span>
                      <span style={{transitionDelay: '150ms'}}>t</span>
                      <span style={{transitionDelay: '200ms'}}>i</span>
                      <span style={{transitionDelay: '250ms'}}>m</span>
                      <span style={{transitionDelay: '300ms'}}>e</span>
                      <span style={{transitionDelay: '350ms'}}> </span>
                      <span style={{transitionDelay: '400ms'}}>H</span>
                      <span style={{transitionDelay: '450ms'}}>H</span>
                      <span style={{transitionDelay: '500ms'}}>:</span>
                      <span style={{transitionDelay: '550ms'}}>M</span>
                      <span style={{transitionDelay: '600ms'}}>M</span>
                    </label>
                  </div>
                </div>
                <button onClick={saveSleepData} className="animated-button">
                  <svg width="256px" height="256px" class="arr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="edit"> <g> <path d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <polygon fill="none" points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polygon> </g> </g> </g> </g></svg>
                  <span class="text">save</span>
                  <span class="circle"></span>
                  <svg width="256px" height="256px" class="arr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="edit"> <g> <path d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8" fill="none" stroke="#adff2f" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <polygon fill="none" points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8" stroke="#adff2f" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polygon> </g> </g> </g> </g></svg>
                </button>
                <Logout/>
              </motion.div>
            </>
            </AnimatePresence>
        </Suspense>
    );
}