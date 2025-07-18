# Habit Centred Todolist

Habit Centred Todolist is a productivity app that combines the power of a traditional todolist with habit tracking and habit inference. The app helps you not only manage your daily tasks, but also build and maintain habits that support your goals and address your pain points.

## Web App Link

You can try the app here:  
[https://habit-centred-todolist.web.app/](https://habit-centred-todolist.web.app/)

## Features

1. **Add Tasks**: Enter your tasks with optional start time, end time, and duration. The app prevents overlapping tasks.
2. **Infer Habits**: Use the "Infer" section to describe your goals or pain points. The app uses AI to suggest habits that can help you achieve your goals or overcome challenges.
3. **Create Habits**: Manually create habits, set their duration, interval, and schedule them on specific days.
4. **Edit Habits**: Adjust habit schedules and settings as your routine evolves.
5. **Schedule Optimisation**: The app combines your tasks and habits, checks for time clashes, and generates a recommended routine.
6. **Track Progress**: Mark tasks and habits as completed, and build streaks for your habits.

## How AI Functionalities Work

### Infer Habits
- User's goal/pain point descriptions is sent to a Flask API
- Llama Model (LLM) is used to output a list of goals based on the user's description
- Each goal in the list is passed into a vector database (PineconeDB) containing a tree of researched habits associated with a goal (root node of tree)
- Habits are returned after querying vector database
- Habits are sent back to the front end and saved as habit tasks

### Schedule Optimisation
- Flask API has section which does contraint satisfaction handling to slot tasks into appropriate times in the day

## Technologies Used

- **React** (Frontend)
- **Firebase** (Authentication & Database)
- **Python(Flask)** (AI API for habit inference and scheduling)
- **Pinecone** (Vector database for habit inference)
- **LangChain & Groq** (AI model integration)
- **Framer Motion** (Animations)
- **Day.js / Moment.js** (Date handling)

**Why Habit Centred Todolist?**  
By integrating habit formation with task management, this app helps you not only get things done, but also build the routines that make productivity sustainable.
