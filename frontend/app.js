// Configuration
const API_URL = 'https://pdf-compression-test-production.up.railway.app/api'; // Change to your backend URL

// State
let uploadedFiles = [];
let currentMode = 'auto';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const optionsSection = document.getElementById('optionsSection');
const filesSection = document.getElementById('filesSection');
const progressSection = document.getElementById('progressSection');
const resultsSection = document.getElementById('resultsSection');
const compressBtn = document.getElementById('compressBtn');
const filesList = document.getElementById('filesList');
const resultsList = document.getElementById('resultsList');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressTitle = document.getElementById('progressTitle');

// Radio buttons
const radioButtons = document.querySelectorAll('input[name="compressionMode"]');
const targetInput = document.getElementById('targetInput');
const qualitySelect = document.getElementById('qualitySelect');

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
compressBtn.addEventListener('click', handleCompress);

radioButtons.forEach(radio => {
  radio.addEventListener('change', handleModeChange);
});

// Drag and Drop Handlers
function handleDragOver(e) {
  e.preventDefault();
  uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  
  const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
  
  if (files.length === 0) {
    alert('Please drop PDF files only');
    return;
  }
  
  if (files.length > 3) {
    alert('Maximum 3 files allowed');
    return;
  }
  
  handleFiles(files);
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  handleFiles(files);
}

function handleModeChange(e) {
  currentMode = e.target.value;
  
  // Hide all conditional inputs
  targetInput.classList.add('hidden');
  qualitySelect.classList.add('hidden');
  
  // Show relevant input
  if (currentMode === 'target') {
    targetInput.classList.remove('hidden');
  } else if (currentMode === 'quality') {
    qualitySelect.classList.remove('hidden');
  }
}

// File Handling
async function handleFiles(files) {
  showSection(progressSection);
  progressTitle.textContent = 'Uploading files...';
  setProgress(0);
  
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      uploadedFiles = data.files;
      displayFiles();
      showSection(optionsSection);
      showSection(filesSection);
      hideSection(uploadSection);
      hideSection(progressSection);
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed: ' + error.message);
    hideSection(progressSection);
  }
}

function displayFiles() {
  filesList.innerHTML = uploadedFiles.map(file => `
    <div class="file-item">
      <div class="file-info">
        <div class="file-icon">PDF</div>
        <div class="file-details">
          <h4>${file.originalName}</h4>
          <p>${file.sizeMB} MB (${file.sizeKB} KB)</p>
        </div>
      </div>
    </div>
  `).join('');
}

// Compression
async function handleCompress() {
  if (uploadedFiles.length === 0) return;
  
  compressBtn.disabled = true;
  hideSection(optionsSection);
  hideSection(filesSection);
  showSection(progressSection);
  progressTitle.textContent = 'Compressing files...';
  
  const results = [];
  const totalFiles = uploadedFiles.length;
  
  try {
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      setProgress(((i) / totalFiles) * 100);
      
      let result;
      
      if (currentMode === 'target') {
        const targetSize = document.getElementById('targetSize').value;
        if (!targetSize || targetSize < 10) {
          throw new Error('Please enter a valid target size (minimum 10 KB)');
        }
        result = await compressToTargetSize(file.id, parseInt(targetSize));
      } else if (currentMode === 'quality') {
        const quality = document.getElementById('qualityLevel').value;
        result = await compressWithQuality(file.id, quality);
      } else {
        result = await compressAuto(file.id);
      }
      
      results.push({
        ...file,
        ...result
      });
    }
    
    setProgress(100);
    
    setTimeout(() => {
      displayResults(results);
      hideSection(progressSection);
      showSection(resultsSection);
    }, 500);
    
  } catch (error) {
    console.error('Compression error:', error);
    alert('Compression failed: ' + error.message);
    compressBtn.disabled = false;
    hideSection(progressSection);
    showSection(optionsSection);
    showSection(filesSection);
  }
}

async function compressAuto(fileId) {
  const response = await fetch(`${API_URL}/compress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, quality: '/ebook' })
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

async function compressWithQuality(fileId, quality) {
  const response = await fetch(`${API_URL}/compress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, quality })
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

async function compressToTargetSize(fileId, targetKB) {
  const response = await fetch(`${API_URL}/compress/target-size`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, targetKB })
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

function displayResults(results) {
  resultsList.innerHTML = results.map(result => `
    <div class="result-card">
      <div class="result-header">
        <h4>${result.originalName}</h4>
        <div class="compression-badge">${result.compressionRatio} saved</div>
      </div>
      <div class="result-stats">
        <div class="stat">
          <div class="stat-label">Original</div>
          <div class="stat-value">${result.originalSizeKB || result.sizeKB} KB</div>
        </div>
        <div class="stat">
          <div class="stat-label">Compressed</div>
          <div class="stat-value">${result.compressedSizeKB || result.achievedKB} KB</div>
        </div>
      </div>
      <a href="${API_URL}${result.downloadUrl}" class="btn-download" download>
        ⬇ Download Compressed PDF
      </a>
    </div>
  `).join('');
}

// Utility Functions
function showSection(section) {
  section.classList.remove('hidden');
}

function hideSection(section) {
  section.classList.add('hidden');
}

function setProgress(percent) {
  progressFill.style.width = percent + '%';
  progressText.textContent = Math.round(percent) + '%';
          }
