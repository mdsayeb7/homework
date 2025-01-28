// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    loadSubjects();
    loadSavedData();
});

function initializeSettings() {
    // Initialize dark mode toggle
    initializeThemeToggle();

    // Initialize notification settings
    document.getElementById('taskReminders').checked = 
        localStorage.getItem('taskReminders') !== 'false';
    document.getElementById('dailyDigest').checked = 
        localStorage.getItem('dailyDigest') === 'true';

    // Add event listeners for notification toggles
    document.getElementById('taskReminders').addEventListener('change', handleNotificationChange);
    document.getElementById('dailyDigest').addEventListener('change', handleNotificationChange);
}

// Theme Management
function initializeThemeToggle() {
    const darkModeToggle = document.getElementById('darkMode');
    darkModeToggle.checked = localStorage.getItem('theme') === 'dark';
    
    darkModeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        setTheme(theme);
    });
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
}

// Profile Management
function changeProfilePicture() {
    document.getElementById('profileImageInput').click();
}

document.getElementById('profileImageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const profileImage = document.getElementById('profileImage');
            const defaultIcon = document.getElementById('defaultProfileIcon');
            
            profileImage.src = e.target.result;
            profileImage.style.display = 'block';
            defaultIcon.style.display = 'none';
            
            localStorage.setItem('profileImage', e.target.result);
            showToast('প্রোফাইল ছবি আপডেট করা হয়েছে।');
        }
        reader.readAsDataURL(file);
    }
});

function editName() {
    const nameElement = document.getElementById('userName');
    const currentName = nameElement.textContent;
    const newName = prompt('আপনার নাম সম্পাদনা করুন:', currentName);
    
    if (newName && newName.trim()) {
        nameElement.textContent = newName.trim();
        localStorage.setItem('userName', newName.trim());
        showToast('নাম আপডেট করা হয়েছে।');
    }
}

// Default subjects
const DEFAULT_SUBJECTS = [
    'বাংলা',
    'ইংরেজি',
    'গণিত',
    'বিজ্ঞান',
    'সামাজিক বিজ্ঞান'
];

// Initialize default subjects if none exist
function initializeDefaultSubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    if (subjects.length === 0) {
        localStorage.setItem('subjects', JSON.stringify(DEFAULT_SUBJECTS));
    }
}

// Modify your existing loadSubjects function
function loadSubjects() {
    // Initialize default subjects if needed
    initializeDefaultSubjects();
    
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const subjectList = document.querySelector('.subject-list');
    
    subjectList.innerHTML = subjects.map((subject, index) => `
        <div class="subject-item">
            <span class="subject-name">${subject}</span>
            <div class="subject-actions">
                <button class="subject-btn edit" onclick="editSubject(${index})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="subject-btn delete" onclick="deleteSubject(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function addSubject() {
    const newSubject = prompt('নতুন বিষয়ের নাম লিখুন:');
    if (newSubject && newSubject.trim()) {
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        subjects.push(newSubject.trim());
        localStorage.setItem('subjects', JSON.stringify(subjects));
        loadSubjects();
        showToast('নতুন বিষয় যোগ করা হয়েছে।');
    }
}

function editSubject(index) {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const newName = prompt('বিষয়ের নাম সম্পাদনা করুন:', subjects[index]);
    
    if (newName && newName.trim()) {
        subjects[index] = newName.trim();
        localStorage.setItem('subjects', JSON.stringify(subjects));
        loadSubjects();
        showToast('বিষয় আপডেট করা হয়েছে।');
    }
}

function deleteSubject(index) {
    showConfirmDialog(
        'বিষয় মুছে ফেলা',
        'আপনি কি এই বিষয়টি মুছে ফেলতে চান?',
        () => {
            const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
            subjects.splice(index, 1);
            localStorage.setItem('subjects', JSON.stringify(subjects));
            loadSubjects();
            showToast('বিষয় মুছে ফেলা হয়েছে।');
        }
    );
}

// Notification Settings
function handleNotificationChange(event) {
    const setting = event.target.id;
    localStorage.setItem(setting, event.target.checked);
}

// Data Management
function exportData() {
    const data = {
        tasks: Storage.getTasks(),
        settings: {
            theme: localStorage.getItem('theme'),
            taskReminders: document.getElementById('taskReminders').checked,
            dailyDigest: document.getElementById('dailyDigest').checked,
            subjects: JSON.parse(localStorage.getItem('subjects') || '[]'),
            userName: localStorage.getItem('userName'),
            profileImage: localStorage.getItem('profileImage')
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = formatExportTimestamp(new Date());
    
    a.href = url;
    a.download = `homework-tracker-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatExportTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}`;
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                
                // Validate data structure
                if (!data.tasks || !Array.isArray(data.tasks)) {
                    throw new Error('অবৈধ ডাটা ফরম্যাট');
                }

                // Import tasks
                Storage.saveTasks(data.tasks);

                // Import settings
                if (data.settings) {
                    if (data.settings.theme) {
                        setTheme(data.settings.theme);
                        document.getElementById('darkMode').checked = data.settings.theme === 'dark';
                    }
                    if (typeof data.settings.taskReminders === 'boolean') {
                        document.getElementById('taskReminders').checked = data.settings.taskReminders;
                        localStorage.setItem('taskReminders', data.settings.taskReminders);
                    }
                    if (typeof data.settings.dailyDigest === 'boolean') {
                        document.getElementById('dailyDigest').checked = data.settings.dailyDigest;
                        localStorage.setItem('dailyDigest', data.settings.dailyDigest);
                    }
                    if (Array.isArray(data.settings.subjects)) {
                        localStorage.setItem('subjects', JSON.stringify(data.settings.subjects));
                        loadSubjects();
                    }
                    if (data.settings.userName) {
                        localStorage.setItem('userName', data.settings.userName);
                        document.getElementById('userName').textContent = data.settings.userName;
                    }
                    if (data.settings.profileImage) {
                        localStorage.setItem('profileImage', data.settings.profileImage);
                        const profileImage = document.getElementById('profileImage');
                        const defaultIcon = document.getElementById('defaultProfileIcon');
                        profileImage.src = data.settings.profileImage;
                        profileImage.style.display = 'block';
                        defaultIcon.style.display = 'none';
                    }
                }

                showToast('ডাটা সফলভাবে ইমপোর্ট করা হয়েছে।');
                setTimeout(() => location.reload(), 2000);
            } catch (error) {
                showToast('ডাটা ইমপোর্ট করতে সমস্যা হয়েছে: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

function clearData() {
    showConfirmDialog(
        'নিশ্চিতকরণ',
        'আপনি কি নিশ্চিত যে আপনি সমস্ত ডাটা মুছে ফেলতে চান? এই কাজটি অপরিবর্তনীয়।',
        () => {
            Storage.saveTasks([]);
            localStorage.setItem('theme', 'light');
            localStorage.setItem('taskReminders', 'true');
            localStorage.setItem('dailyDigest', 'false');
            localStorage.setItem('subjects', '[]');
            localStorage.removeItem('userName');
            localStorage.removeItem('profileImage');
            
            showToast('সমস্ত ডাটা মুছে ফেলা হয়েছে।');
            setTimeout(() => location.reload(), 2000);
        }
    );
}

// Dialog and Toast Utilities
function showConfirmDialog(title, message, onConfirm) {
    const dialog = document.querySelector('.dialog-overlay');
    const dialogTitle = document.querySelector('.confirm-dialog-title');
    const dialogMessage = document.querySelector('.confirm-dialog-message');
    const cancelBtn = document.querySelector('.confirm-btn-cancel');
    const deleteBtn = document.querySelector('.confirm-btn-delete');

    dialogTitle.textContent = title;
    dialogMessage.textContent = message;
    dialog.style.display = 'flex';

    cancelBtn.onclick = () => {
        dialog.style.display = 'none';
    }

    deleteBtn.onclick = () => {
        dialog.style.display = 'none';
        onConfirm();
    }
}

function showToast(message, duration = 3000) {
    const toast = document.querySelector('.toast');
    toast.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

// Load saved data when page loads
function loadSavedData() {
    // Load profile image
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
        const profileImage = document.getElementById('profileImage');
        const defaultIcon = document.getElementById('defaultProfileIcon');
        profileImage.src = savedImage;
        profileImage.style.display = 'block';
        defaultIcon.style.display = 'none';
    }
    
    // Load name
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        document.getElementById('userName').textContent = savedName;
    }
}