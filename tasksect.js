import React, { useEffect, useState, useRef, Suspense, lazy} from 'react';
//import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import '../App.css';
import {db,auth} from '../config/firebase.js';
import moment from 'moment';
import { AnimatePresence, motion } from "framer-motion";
import { Logout } from './logout.js';
import { Popup } from './popup.js';
import {getDocs,getDoc,collection,addDoc,deleteDoc,updateDoc,doc,query,where,setDoc} from 'firebase/firestore';
import axios from 'axios';
import { form } from 'framer-motion/m';
import { parse, format, addDays, isBefore, isWithinInterval} from "date-fns";

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

export const Tasksect = () => {
  //const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [time, setTime] = useState('');

  const [waketime, setWaketime] = useState("*");
  const [sleeptime, setSleeptime] = useState("*");

  const [newtask, setNewtask] = useState({});
  const [taskCompletion, setTaskCompletion] = useState({}); 

  const dbcollectionref = collection(db, "taskstore");
  const todaycollectionref = collection(db, "todayhabitstatus");
  const currenthabitcollectionref = collection(db, "habits");
  const sleepcollection = collection(db, "sleepschedule");
  //const habitattrcollectionref = collection(db, "habitattr");

  const [dbtasks, setDbtasks] = useState([]);
  const [habittasks, setHabittasks] = useState([]);
  
  const [calendar, setCalendar] = useState([]);
  const [adjustschedule, setAdjustschedule] = useState(false);

  //popup states control
  const [juststarttimepopup, setJuststarttimepopup] = useState(false);
  const [justendtimepopup, setJustendtimepopup] = useState(false);
  const [invalidtimepopup, setInvalidtimepopup] = useState(false);
  const [invaliddurationpopup, setInvaliddurationpopup] = useState(false);
  const [endbelowstartpopup, setEndbelowstartpopup] = useState(false);

  const formattedDate = new Date().toLocaleDateString("en-GB");

  const formattedCalendar = calendar.map(item => {
    const [taskname, times] = item.split("~");
    return { taskname, times };
  });

  const handleCheckboxChange = async (taskId, currentStatus) => {
    try {
      const taskDoc = doc(db, "taskstore", taskId);
      await updateDoc(taskDoc, { ischecked: !currentStatus }); // Toggle status in Firestore
      getDbtaskList();
    } catch (err) {
      console.error("Error updating checkbox:", err);
    }
  };

  const handleCheckboxChangeHabit = async (habitname) => {
    const updatedHabits = habittasks.map(habit =>
      habit.habitname === habitname ? { ...habit, completed: !habit.completed } : habit
    );

    const updatedHabit = updatedHabits.find(h => h.habitname === habitname);

    const q = query(
      todaycollectionref,
      where("habitname", "==", habitname),
      where("userId", "==", auth?.currentUser?.uid)
    );
  
    const querySnapshot = await getDocs(q);
  
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
  
      await updateDoc(docRef, {
        completed: updatedHabit?.completed,
      });
  
    } else {
      console.log("No matching document found");
    }
  
    setHabittasks(updatedHabits);
  };

  const handleInputChange = (id, value) => {
    setNewtask((prevState) => ({
      ...prevState,
      [id]: value, // Update the specific task's input value
    }));
  };

  const handleUpdate = (id) => {
    const newTaskName = newtask[id]; // Get the specific task's new name
    if (newTaskName) {
      updateTask(id, newTaskName); // Call updateTask with the new name
      setNewtask((prevState) => ({
        ...prevState,
        [id]: "", // Clear the input field for this task
      }));
    }
  };

  //this below is a function to read a particular 'table/collection' in your database
  //database GET
  const getDbtaskList = async () => {
    //Read data from database
    //set the dbtasklist state to equal the data
    //setCalendar([]);
    try{
      const data = await getDocs(dbcollectionref);
      const filteredData = data.docs.map((doc) => ({...doc.data(), id: doc.id,}));
      setDbtasks(filteredData);
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

  const normalizeDate = (date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0); // Set time to 00:00:00.000
    return normalizedDate;
  };  

  const updatehabits = async () => {

    // Step 1: Get all habits for the current user
    const habitQuery = query(currenthabitcollectionref, where("userId", "==", auth?.currentUser?.uid));
    const habitSnapshot = await getDocs(habitQuery);

    const habits = habitSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (let habit of habits) {
      //if (!habit.startcycle || !habit.endcycle || !habit.habitname) continue;
    
      const startDate = normalizeDate(parse(habit.startcycle, "dd/MM/yyyy", new Date()));
      const endDate = normalizeDate(parse(habit.endcycle, "dd/MM/yyyy", new Date()));
      const today = normalizeDate(new Date());
    
      // Step 2: Check if both dates are in the past
      const shouldUpdateCycle = isBefore(startDate, today) && isBefore(endDate, today);
    
      // Step 3: Get related habitattr document
      //const attrQuery = query(habitattrcollectionref, where("habitname", "==", habit.habitname));
      //const attrSnapshot = await getDocs(attrQuery);
    
      //if (attrSnapshot.empty) continue;
    
      //const attrDoc = attrSnapshot.docs[0];
      //const attrData = attrDoc.data();
      const updateinterval = habit.updateinterval;
      const maxduration = habit.maxduration;
    
      const updates = {};
    
      // If both cycles are in the past, update them
      if (shouldUpdateCycle && typeof updateinterval === "number") {
        const newStartDate = addDays(startDate, updateinterval);
        const newEndDate = addDays(endDate, updateinterval);
    
        updates.startcycle = format(newStartDate, "dd/MM/yyyy");
        updates.endcycle = format(newEndDate, "dd/MM/yyyy");
      }
    
      // Step 4: Check habitstreak logic
      const parsedStreak = Number(habit.habitstreak);
      const parsedCurrentDuration = Number(habit.currentduration);
    
      if (!isNaN(parsedStreak) && parsedStreak === 7 && typeof maxduration === "number") {
        const newDuration = parsedCurrentDuration + 5;
    
        if (newDuration <= maxduration) {
          updates.currentduration = newDuration;
          updates.habitstreak = "0"; // reset to string "0"
        }
      }
    
      // Step 5: Apply updates if any
      if (Object.keys(updates).length > 0 && habit.id) {
        const habitDocRef = doc(db, "habits", habit.id);
        await updateDoc(habitDocRef, updates);
      }
    }
    
  };

  //need to change up this function a bit
  const parseDays = (dayattr) => {
    const days = [];
    const entries = dayattr.split('}_');
  
    for (const entry of entries) {
      try {
        const clean = entry.replace(/[{}]/g, '');
        const day = clean.split(':')[1].split('-')[0];
        days.push(day);
      } catch (e) {
        continue;
      }
    }
  
    return days;
  };
  
  const dayDifference = (day1, day2, days) => {
    const idx1 = days.indexOf(day1);
    const idx2 = days.indexOf(day2);
  
    if (idx1 === -1 || idx2 === -1) return false;
    return Math.abs(idx1 - idx2) <= 1;
  };
  

  const checkStreak = async (habitName, completedDate) => {
    //here I will also delete the document because if it was missed then whats the point of showing it again
    // Create a query to find the habit document where habitname == habitName and userId == userId
    const habitQuery = query(
      currenthabitcollectionref,
      where("habitname", "==", habitName),
      where("userId", "==", auth?.currentUser?.uid)
    );

    // Fetch the documents based on the query
    const habitQuerySnapshot = await getDocs(habitQuery);

    if (habitQuerySnapshot.empty) return; // If no matching habit is found, exit

    // Assuming habitname is unique, get the first document from the query snapshot
    const habitSnap = habitQuerySnapshot.docs[0];
    const data = habitSnap.data();

    const dayattr = data.dayattr;
    const lastCompleted = data.lastcompleted || "*";
    const habitStreak = data.habitstreak || "*";

    const days = parseDays(dayattr);

    // Convert completedDate to a day name
    const completedDayName = new Date(
      completedDate.split("/").reverse().join("-")
    ).toLocaleDateString("en-GB", { weekday: "long" });

    let lastCompletedDayName = "*";
    if (lastCompleted !== "*") {
      lastCompletedDayName = new Date(
        lastCompleted.split("/").reverse().join("-")
      ).toLocaleDateString("en-GB", { weekday: "long" });
    }

    // Check if the streak is valid
    const isStreakable =
      days.includes(completedDayName) &&
      (lastCompletedDayName === "*" ||
        (days.includes(lastCompletedDayName) &&
          dayDifference(completedDayName, lastCompletedDayName, days)));

    if (isStreakable) {
      let newStreak = 1;
      if (habitStreak !== "*") {
        newStreak = parseInt(habitStreak) + 1;
      }

      // Update the document with the new streak and lastcompleted date
      await updateDoc(habitSnap.ref, {
        lastcompleted: completedDate,
        habitstreak: String(newStreak),
      });
    }
  };

  const UpdateandGetHabitsForToday = async () => {
    try {
      const today = normalizeDate(new Date());
      const differentformattedDate = format(today, "dd-MM-yyyy");
      console.log(differentformattedDate);
      const todayName = today.toLocaleString('en-US', { weekday: 'long' });
      const formattedDate = format(today, "dd/MM/yyyy"); // Ensure this line exists
      const userId = auth?.currentUser?.uid;
  
      if (!userId) {
        console.error("User is not authenticated");
        return;
      }
  
      const [todaySnapshot, allHabitsSnapshot] = await Promise.all([
        getDocs(query(todaycollectionref, where("userId", "==", userId))),
        getDocs(query(currenthabitcollectionref, where("userId", "==", userId))),
      ]);
  
      const allHabitsMap = new Map();
      allHabitsSnapshot.docs.forEach(doc => {
        const habit = doc.data();
        allHabitsMap.set(habit.habitname, habit);
      });
  
      const habitTasks = [];
  
      // Step 1: Clean up or reuse today's tasks
      for (const docSnap of todaySnapshot.docs) {
        const habitData = docSnap.data();
        if (habitData.userId !== userId) continue;
  
        const isToday = habitData.date === formattedDate;
        const habit = allHabitsMap.get(habitData.habitname);
  
        if (habit) {
          if (isToday) {
            habitTasks.push({ completed: habitData.completed, ...habit });
          } else {
            if (habitData.completed === true) {
              await checkStreak(habit.habitname, habitData.date);
            }
            await deleteDoc(docSnap.ref);
          }
        }
      }
  
      // Step 2: Add missing habits for today using deterministic document IDs
      const addPromises = [];
  
      for (const habit of allHabitsMap.values()) {
        const startDate = normalizeDate(parse(habit.startcycle, "dd/MM/yyyy", new Date()));
        const endDate = normalizeDate(parse(habit.endcycle, "dd/MM/yyyy", new Date()));
        const inRange = isWithinInterval(today, { start: startDate, end: endDate });
        const dayMatch = parseDays(habit.dayattr).includes(todayName);
        const alreadyInList = habitTasks.some(item => item.habitname === habit.habitname);
  
        if (inRange && dayMatch && !alreadyInList) {
          habitTasks.push({ ...habit, completed: false });
  
          const docId = `${userId}_${habit.habitname}_${differentformattedDate}`;
          const habitDocRef = doc(todaycollectionref, docId);
  
          addPromises.push(setDoc(habitDocRef, {
            completed: false,
            date: formattedDate,
            habitname: habit.habitname,
            userId: userId,
          }, { merge: false }));
        }
      }
  
      await Promise.all(addPromises);
  
      setHabittasks(habitTasks);
      console.log("Updated habit tasks:", habitTasks);
  
    } catch (error) {
      console.error("Error updating habits:", error);
    }
  };

  function stripFromAttr(scheduleString) {
    const daysOfWeek = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];

    const today = daysOfWeek[new Date().getDay()];
  
    const entries = scheduleString.split("}_").map(entry => entry.replace(/[{}]/g, ""));
    const todayEntry = entries.find(entry => entry.includes(`day:${today}`));
    if (!todayEntry) return { start: null, end: null };
  
    const startMatch = todayEntry.match(/start:([^-\s]*)/);
    const endMatch = todayEntry.match(/end:([^-\s]*)/);
  
    return {
      start: startMatch ? startMatch[1] : null,
      end: endMatch ? endMatch[1] : null
    };
  }
  
  const createschedule = () => {

    const userTasks = dbtasks.filter(thedbtask => thedbtask.userId === auth?.currentUser?.uid);

    let tn = userTasks.map(task => task.taskname || "*").join("|");
    let st = userTasks.map(task => task.starttime || "*").join("|");
    let et = userTasks.map(task => task.endtime || "*").join("|");
    let dur = userTasks.map(task => task.duration || "*").join("|");

    //converting habit tasks to task formatting for the sake of scheduling
    const habittasksSchedformat = habittasks.map(task => {
      const { start, end } = stripFromAttr(task.dayattr); // 🛠️ use actual key name
      return {
        taskname: task.habitname,
        starttime: start,
        endtime: end,
        duration: task.currentduration,
      };
    });

    const htn = habittasksSchedformat.map(task => task.taskname || "*").join("|");
    const hst = habittasksSchedformat.map(task => task.starttime || "*").join("|");
    const het = habittasksSchedformat.map(task => task.endtime || "*").join("|");
    const hdur = habittasksSchedformat.map(task => task.duration || "*").join("|");

    //tn += '|' + htn;
    //st += '|' + hst;
    //et += '|' + het;
    //dur += '|' + hdur;

    tn = [tn, htn].filter(Boolean).join("|");
    st = [st, hst].filter(Boolean).join("|");
    et = [et, het].filter(Boolean).join("|");
    dur = [dur, hdur].filter(Boolean).join("|");

    //this will be a post request of the dbtasks to then get the optomized schedule from the python api
    const postData = {
      tasknames:tn,
      starttimes:st,
      endtimes:et,
      durations:dur,
      waketime:waketime,
      sleeptime:sleeptime
    };

    //previous route for localhost testing 'http://192.168.1.105:5000/api/scheduletasks'
    //usual route is https://tej16-api.onrender.com/api/scheduletasks

    axios.post('http://192.168.1.83:5000/api/scheduletasks', postData)  // Flask POST API endpoint
      .then(response => {
        if(response.data.schedule !== ""){
          setCalendar(response.data.schedule.split("|"));
        }
        setAdjustschedule(false);
      })
      .catch(error => {
        console.error('Error posting data:', error);
      });
  };

  //useEffect(() => {
  //  if (habittasks.length > 0) {
  //    const fetchtodayData = async () => {
  //      await getHabitsfortoday();
  //    };
  //    fetchtodayData();
  //  }
  //}, [habittasks]);

  useEffect(() => {
    if(adjustschedule)
    {
      createschedule();
    }
  }, [adjustschedule]);

  useEffect(() => {
    const fetchData = async () => { //here I would make a function to updatehabits
      await updatehabits();
      await UpdateandGetHabitsForToday();
      await getDbtaskList();
      await getSleepschedule();
      setCalendar([]); 
      setAdjustschedule(true); // Provide the appropriate value
    };
    fetchData();
  }, []);

  const isValidTime = (time) => {
    const regex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    return regex.test(time);
  };

  const isValidDuration = (value) => {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
  };

  const isEarlier = (t1, t2) => {
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    return toMinutes(t1) < toMinutes(t2);
  };
  //this function has code to add data to a database (add a task for context)
  //database CREATE
  const addTask = async () => {
    if(task.trim() === ''){
      return;
    } 

    if(start.trim() !== '' && end.trim() === '' && time.trim() === ''){
      setJuststarttimepopup(true);
      return;
    }

    if(end.trim() !== '' && start.trim() === '' && time.trim() === ''){
      setJustendtimepopup(true);
      return;
    }
    
    if(end.trim() !== '' && start.trim() !== ''){
      if(isValidTime(start.trim()) === false || isValidTime(end.trim()) === false){
        setInvalidtimepopup(true);
        return;
      }
    }

    if(end.trim() !== '' && start.trim() !== '' && time.trim() === ''){
      if(isEarlier(start.trim(),end.trim()) === false){
        setEndbelowstartpopup(true);
        setStart('');
        setEnd('');
        return;
      }
    }

    if(time.trim() !== '' && isValidDuration(time.trim()) === false){
      setInvaliddurationpopup(true);
      return;
    }

    //may need to ignore above code, will see
    try{
      await addDoc(dbcollectionref,{
        ischecked: false,
        taskname: task.trim(),
        starttime: start.trim(),
        endtime: end.trim(),
        duration: time.trim(),
        userId: auth?.currentUser?.uid,
      });
      setTask('');
      setStart('');
      setEnd('');
      setTime('');
      await getDbtaskList();
      setCalendar([]);
      setAdjustschedule(true);
    }
    catch(err){
      console.error(err);
    }
  };

  //const deleteTask = (index) => {
  //database DELETE
  const deleteTask = async (id) => {
    //setTasks(tasks.filter((_, i) => i !== index));
    const taskDoc = doc(db, "taskstore", id)
    await deleteDoc(taskDoc);
    await getDbtaskList();
    setCalendar([]);
    setAdjustschedule(true);
  };
  
  //database UPDATE
  const updateTask = async (id) => {
    //setTasks(tasks.filter((_, i) => i !== index));
    const taskDoc = doc(db, "taskstore", id)
    await updateDoc(taskDoc, {taskname: newtask[id]});
    setNewtask('');
    getDbtaskList();
  };

  return (
    <Suspense fallback={<div class="wrapper"><div class="round"></div><div class="round"></div><div class="round"></div><div class="shadow"></div><div class="shadow"></div><div class="shadow"></div></div>}>
    <AnimatePresence mode="wait">
    <>
    <motion.div className={(juststarttimepopup || justendtimepopup || invalidtimepopup || endbelowstartpopup || invaliddurationpopup) ? 'centered-container-new' : 'centered-container'} {...pageVariants}>
      <Popup 
        isOpen={juststarttimepopup} 
        onClose={() => setJuststarttimepopup(false)} 
        heading={'Missing Constraints'}
        subheading={'missing end time and/or duration constraints'}
      />
      <Popup 
        isOpen={justendtimepopup} 
        onClose={() => setJustendtimepopup(false)} 
        heading={'Missing Constraints'}
        subheading={'missing start time and/or duration constraints'}
      />
      <Popup 
        isOpen={invalidtimepopup} 
        onClose={() => setInvalidtimepopup(false)} 
        heading={'Format Error'}
        subheading={'start or end time in wrong format'}
      />
      <Popup 
        isOpen={endbelowstartpopup} 
        onClose={() => setEndbelowstartpopup(false)} 
        heading={'End Before Start'}
        subheading={'end time has to be later than start time'}
      />
      <Popup 
        isOpen={invaliddurationpopup} 
        onClose={() => setInvaliddurationpopup(false)} 
        heading={'Format Error'}
        subheading={'duration has to be a number in minutes > 0'}
      />
      <Navigation />
      <p></p>
      <div className="arrange-horizontal-grid">
      
        <div className="form-control">
          <input 
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
          />
          <label>
              <span style={{transitionDelay: '0ms'}} >T</span>
              <span style={{transitionDelay: '50ms'}}>a</span>
              <span style={{transitionDelay: '100ms'}}>s</span>
              <span style={{transitionDelay: '150ms'}}>k</span>
              <span style={{transitionDelay: '200ms'}}> </span>
              <span style={{transitionDelay: '250ms'}}>n</span>
              <span style={{transitionDelay: '300ms'}}>a</span>
              <span style={{transitionDelay: '350ms'}}>m</span>
              <span style={{transitionDelay: '350ms'}}>e</span>
          </label>
        </div>

        <div className="form-control">
          <input 
              type="text"
              value={start}
              onChange={(e) => setStart(e.target.value)}
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
              value={end}
              onChange={(e) => setEnd(e.target.value)}
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

        <div className="form-control">
          <input 
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
          />
          <label>
              <span style={{transitionDelay: '0ms'}} >T</span>
              <span style={{transitionDelay: '50ms'}}>i</span>
              <span style={{transitionDelay: '100ms'}}>m</span>
              <span style={{transitionDelay: '150ms'}}>e</span>
              <span style={{transitionDelay: '200ms'}}> </span>
              <span style={{transitionDelay: '250ms'}}>m</span>
              <span style={{transitionDelay: '300ms'}}>i</span>
              <span style={{transitionDelay: '350ms'}}>n</span>
          </label>
        </div>
        
        <button onClick={addTask} className="animated-button" width="140px">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke="currentColor" height="24" fill="none" class="arr-2">
              <line y2="19" y1="5" x2="12" x1="12"></line>
              <line y2="12" y1="12" x2="19" x1="5"></line>
          </svg>
          <span class="text">Add Task</span>
          <span class="circle"></span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke="currentColor" height="24" fill="none" class="arr-1">
              <line y2="19" y1="5" x2="12" x1="12"></line>
              <line y2="12" y1="12" x2="19" x1="5"></line>
          </svg>
        </button>
      </div>

      <motion.ul
        key={dbtasks.length} // Ensures re-animation when a task is added
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode='wait'>
          {dbtasks.filter((thedbtask) => thedbtask.userId === auth?.currentUser?.uid)
          .map((thedbtask, index) => (
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
                  checked={thedbtask.ischecked} // Bind state
                  onChange={() => handleCheckboxChange(thedbtask.id, thedbtask.ischecked)} // Update state on change
                />
                <svg viewBox="0 0 64 64" height="2em" width="2em">
                  <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
                </svg>
              </label>
              <p>{thedbtask.taskname}</p>
              <button onClick={() => deleteTask(thedbtask.id)} className="animated-button">
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

      <motion.ul
        key={habittasks.length} // Ensures re-animation when a task is added
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode='wait'>
          {habittasks.map((thehabittask, index) => (
            //here we just use whatever fields you put in the data<span class="text">Add Task</span>
            //code for an input to update a specific index <input placeholder='new name' value={newtask[thedbtask.id] || ""} onChange={(e) => handleInputChange(thedbtask.id, e.target.value)}/>
            //code to update the actual task from the input field <button onClick={() => handleUpdate(thedbtask.id)}>Update</button>
            <motion.li
              key={thehabittask.taskname}
              className="task-item"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <label class="container">
                <input
                  type="checkbox"
                  checked={thehabittask.completed} // Bind state
                  onChange={() => handleCheckboxChangeHabit(thehabittask.habitname)}
                />
                <svg viewBox="0 0 64 64" height="2em" width="2em">
                  <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
                </svg>
              </label>
              <p>{thehabittask.habitname}</p>
              <p style={{ color: 'greenyellow' }}>(habit task)</p>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      
      {calendar.length > 0 && (
          <motion.div 
            className="schedcard"
            transition={{ duration: 1 }} // Duration of hover animation
            initial={{ opacity: 0 }} // Optional: Set initial state for Framer Motion
            animate={{ opacity: 1 }}  //• 
            exit={{ opacity: 0 }}
          >
            <h1>recommended routine</h1>
            <ul>
              {formattedCalendar.map((calendartask, index) => (
                <>
                  <p>---------------------------------------</p>
                  <li key={index}>
                    <p></p>
                    <p>{calendartask.taskname}</p>
                    <p>➜</p>
                    <p>{calendartask.times}</p>
                  </li>
                  <p>---------------------------------------</p>
                </>
              ))}
            </ul>
          </motion.div>
      )}
      
      <Logout />
    </motion.div>
    </>
    </AnimatePresence>
    </Suspense>
  );
}