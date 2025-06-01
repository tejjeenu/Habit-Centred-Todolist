import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {Auth} from "./components/auth.js";
import {Tasksect} from "./components/tasksect.js";
import {Createhabitsect} from "./components/createhabitsect.js";
import {Inferhabitsect} from "./components/inferhabitsect.js";
import {Edithabitsect} from "./components/edithabitsect.js";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Tasksect />} />
        <Route path="/inferhabits" element={<Inferhabitsect />} />
        <Route path="/createhabits" element={<Createhabitsect />} />
        <Route path="/edithabits" element={<Edithabitsect />} />
      </Routes>
    </Router>
  );
}

export default App;