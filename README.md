# ✅ Habit Centred Todolist  

**Habit Centred Todolist** is a productivity app that goes beyond task management.  
It combines a traditional to-do list with **habit tracking** and **AI-powered habit inference**, helping you not only complete tasks but also build sustainable routines that support your long-term goals.  

---

## 🌍 Problem  

Most productivity apps focus only on **tasks**, leaving out the deeper challenge:  
- Building **consistent habits** that drive long-term success.  
- Understanding **which habits matter** for achieving specific goals.  
- Avoiding **schedule clashes** that make routines unmanageable.  

This gap often leads to burnout, ineffective routines, and difficulty maintaining progress over time.  

---

## 💡 Solution  

**Habit Centred Todolist** addresses these issues by integrating:  
- **Task Management** – Organize your day with start/end times and durations.  
- **Habit Tracking** – Create, track, and build streaks for meaningful habits, increasing and decreasing the habit duration accordingly
- **AI Habit Inference** – Describe your goals/pain points, and the app suggests research-backed habits to help you succeed.  
- **Schedule Optimisation** – Automatically merges tasks and habits into a conflict-free routine.  

The result: **Productivity with purpose** — not just finishing tasks, but building a lifestyle that aligns with your goals.  

---

## 🌐 Web App  

Try it here:  
👉 [Habit Centred Todolist](https://habit-centred-todolist.web.app/)  

---

## ✨ Features  

1. **Add Tasks** – Create tasks with time and duration; overlapping tasks are prevented.  
2. **Infer Habits (AI-powered)** – Enter goals or pain points, and get suggested habits.  
3. **Create Habits** – Manually add habits with intervals, durations, and schedules.  
4. **Edit Habits** – Adjust as routines evolve.  
5. **Schedule Optimisation** – Smartly combines tasks + habits into a routine.  
6. **Track Progress** – Mark tasks/habits as complete and maintain streaks.  

---

## 🧠 How AI Works  

### 🔍 Habit Inference  
1. User submits a **goal/pain point**.  
2. Flask API sends it to an **LLM (Llama via LangChain & Groq)**.  
3. The model generates possible goals.  
4. Each goal is queried against a **Pinecone vector database** of researched habits.  
5. Relevant habits are returned to the frontend and saved as habit tasks.  

### 🗓️ Schedule Optimisation  
- Flask API applies **constraint satisfaction** to automatically assign tasks + habits into available time slots without clashes.  

---

## 🛠️ Technologies Used  

- **React** – Frontend  
- **Firebase** – Authentication & Database  
- **Python (Flask)** – AI API for habit inference & scheduling (located in seperate repo)
- **Pinecone** – Vector database for habit inference  
- **LangChain & Groq** – AI model integration  
- **Framer Motion** – UI animations  
- **Day.js / Moment.js** – Date handling  

---

## 🌟 Why Habit Centred Todolist?  

Unlike traditional productivity tools, this app:  
- Helps you **manage tasks AND form habits**.  
- Aligns productivity with **personal goals**.  
- Provides **AI-driven recommendations** for sustainable growth.  

👉 With Habit Centred Todolist, productivity becomes not just about finishing tasks — but about **building a better you**.  

