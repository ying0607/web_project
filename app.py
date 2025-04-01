# app.py
from flask import Flask, render_template, request, jsonify, redirect, url_for
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.llms import OpenAI
import os
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = "todoapp_secret_key"

# Initialize LangChain components for the chatbot
memory = ConversationBufferMemory(return_messages=True)
llm = OpenAI(temperature=0.7, openai_api_key=os.environ.get("OPENAI_API_KEY", "your-api-key-here"))
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# Load tasks from JSON file
def load_tasks():
    try:
        with open('tasks.json', 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Return default structure if file doesn't exist or is invalid
        return {
            "important_urgent": [],
            "important_not_urgent": [],
            "not_important_urgent": [],
            "not_important_not_urgent": []
        }

# Save tasks to JSON file
def save_tasks(tasks):
    with open('tasks.json', 'w') as f:
        json.dump(tasks, f)

@app.route('/')
def index():
    tasks = load_tasks()
    return render_template('index.html', tasks=tasks)

@app.route('/add_task', methods=['POST'])
def add_task():
    task_text = request.form.get('task')
    category = request.form.get('category')
    
    if not task_text or not category:
        return redirect(url_for('index'))
    
    tasks = load_tasks()
    
    new_task = {
        "id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "text": task_text,
        "completed": False,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    tasks[category].append(new_task)
    save_tasks(tasks)
    
    return redirect(url_for('index'))

@app.route('/toggle_task', methods=['POST'])
def toggle_task():
    task_id = request.form.get('task_id')
    category = request.form.get('category')
    
    if not task_id or not category:
        return jsonify({"success": False})
    
    tasks = load_tasks()
    
    for task in tasks[category]:
        if task["id"] == task_id:
            task["completed"] = not task["completed"]
            save_tasks(tasks)
            return jsonify({"success": True})
    
    return jsonify({"success": False})

@app.route('/delete_task', methods=['POST'])
def delete_task():
    task_id = request.form.get('task_id')
    category = request.form.get('category')
    
    if not task_id or not category:
        return jsonify({"success": False})
    
    tasks = load_tasks()
    
    tasks[category] = [task for task in tasks[category] if task["id"] != task_id]
    save_tasks(tasks)
    
    return jsonify({"success": True})

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    if not user_message:
        return jsonify({"response": "Please enter a message."})
    
    # Get response from LangChain conversation
    response = conversation.predict(input=user_message)
    
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(debug=True)