// static/js/script.js

document.addEventListener('DOMContentLoaded', function() {
    const rootStyles = getComputedStyle(document.documentElement);
    console.log('--sidebar-width:', rootStyles.getPropertyValue('--sidebar-width').trim());
    console.log('--sidebar-collapsed-width:', rootStyles.getPropertyValue('--sidebar-collapsed-width').trim());
    console.log('--transition-speed:', rootStyles.getPropertyValue('--transition-speed').trim());
    
    // Display current date
    const dateDisplay = document.getElementById('current-date');
    if (dateDisplay) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString(undefined, options);
    }
    
    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const showSidebarBtn = document.getElementById('show-sidebar');
    const mainContent = document.getElementById('main-content');
    
    // Toggle sidebar
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            console.log('Sidebar collapsed');
            
            // Store sidebar state in localStorage
            localStorage.setItem('sidebarCollapsed', 'true');
            console.log('Sidebar state saved to localStorage');
            console.log('Sidebar state:', localStorage.getItem('sidebarCollapsed'));
        });
    } else {
        console.error('Toggle sidebar button not found!');
    }
    
    // Show sidebar button
    if (showSidebarBtn) {
        showSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            
            // Store sidebar state in localStorage
            localStorage.setItem('sidebarCollapsed', 'false');
        });
    }
    
    // Check localStorage for saved state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
    
    // Task counters - update counts in headers
    function updateTaskCounts() {
        const categories = ['important_urgent', 'important_not_urgent', 'not_important_urgent', 'not_important_not_urgent'];
        
        categories.forEach(category => {
            const tasks = document.querySelectorAll(`[onchange*="${category}"]`);
            const countElement = document.querySelector(`.grid-item.${category.replace(/_/g, '.')} .task-count`);
            
            if (countElement) {
                countElement.textContent = tasks.length;
            }
        });
    }
    
    // Chat functionality
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        userInput.value = '';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot typing';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content';
        typingContent.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        
        typingIndicator.appendChild(typingContent);
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Send to server
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add bot response
            addMessage(data.response, 'bot');
        })
        .catch(error => {
            console.error('Error:', error);
            chatMessages.removeChild(typingIndicator);
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        });
    }
    
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

// Task management functionality
function toggleTask(taskId, category) {
    fetch('/toggle_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `task_id=${taskId}&category=${category}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const checkbox = document.querySelector(`input[onchange="toggleTask('${taskId}', '${category}')"]`);
            const taskItem = checkbox.parentElement;
            taskItem.classList.toggle('completed');
        }
    })
    .catch(error => console.error('Error:', error));
}

function deleteTask(taskId, category) {
    fetch('/delete_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `task_id=${taskId}&category=${category}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const taskItem = document.querySelector(`button[onclick="deleteTask('${taskId}', '${category}')"]`).parentElement;
            taskItem.remove();
        }
    })
    .catch(error => console.error('Error:', error));
}