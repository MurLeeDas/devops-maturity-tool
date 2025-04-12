// DOM Elements
const form = document.getElementById('assessment-form');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const resultsSection = document.getElementById('results-section');
const levelBadge = document.getElementById('level-badge');
const scoreCircle = document.getElementById('score-circle');
const strengthsList = document.getElementById('strengths-list');
const recommendationsList = document.getElementById('recommendations-list');
const pdfButton = document.getElementById('pdf-button');

// Configuration
const DOMAIN_WEIGHTS = {
    'ci-cd': 0.25,
    'iac': 0.2,
    'monitoring': 0.15,
    'security': 0.15,
    'culture': 0.15,
    'automation': 0.1
};

const MATURITY_LEVELS = [
    {
        name: 'Chaotic',
        threshold: 20,
        colorClass: 'level-0',
        strengths: [
            'Basic version control in place',
            'Manual deployment processes documented'
        ],
        recommendations: [
            'Implement basic CI pipeline (Jenkins/GitHub Actions)',
            'Establish incident response process',
            'Start infrastructure documentation'
        ]
    },
    {
        name: 'Initial',
        threshold: 40,
        colorClass: 'level-1',
        strengths: [
            'Some automated testing exists',
            'Basic monitoring for servers'
        ],
        recommendations: [
            'Standardize CI/CD across all projects',
            'Adopt Infrastructure as Code (Terraform)',
            'Implement centralized logging'
        ]
    },
    {
        name: 'Defined',
        threshold: 60,
        colorClass: 'level-2',
        strengths: [
            'Automated deployments for most services',
            'Infrastructure changes through code'
        ],
        recommendations: [
            'Implement canary deployments',
            'Add security scanning to pipelines',
            'Conduct blameless postmortems'
        ]
    },
    {
        name: 'Managed',
        threshold: 80,
        colorClass: 'level-3',
        strengths: [
            'Full CI/CD with rollback capability',
            'Proactive monitoring alerts'
        ],
        recommendations: [
            'Adopt GitOps practices',
            'Implement service mesh (Istio/Linkerd)',
            'Run chaos engineering experiments'
        ]
    },
    {
        name: 'Optimized',
        threshold: 100,
        colorClass: 'level-4',
        strengths: [
            'Self-healing systems',
            'Predictive analytics in use'
        ],
        recommendations: [
            'Implement AIOps for anomaly detection',
            'Optimize cloud costs with FinOps',
            'Share success stories as case studies'
        ]
    }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            const responses = gatherResponses();
            const { overallScore, domainScores } = calculateScores(responses);
            displayResults(overallScore, domainScores);
        }
    });

    // Progress tracking
    document.querySelectorAll('.mandatory').forEach(select => {
        select.addEventListener('change', updateProgress);
    });

    let pdfGenerationInProgress = false;

    pdfButton.addEventListener('click', function(e) {
        e.preventDefault();
    
        if (!pdfGenerationInProgress) {
            pdfGenerationInProgress = true;
            try {
                generatePDFReport();
            } finally {
                pdfGenerationInProgress = false;
            }
        }
    });
});

// Update progress bar
function updateProgress() {
    const totalQuestions = document.querySelectorAll('.mandatory').length;
    const answered = Array.from(document.querySelectorAll('.mandatory'))
        .filter(select => select.value !== "").length;
    const progress = Math.round((answered / totalQuestions) * 100);
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}% Complete`;
}

// Validate form
function validateForm() {
    let isValid = true;
    document.querySelectorAll('.mandatory').forEach(select => {
        if (!select.value) {
            select.style.borderColor = '#ef4444';
            isValid = false;
        } else {
            select.style.borderColor = '#cbd5e1';
        }
    });
    
    if (!isValid) {
        alert('Please answer all questions before submitting.');
    }
    return isValid;
}

// Gather responses
function gatherResponses() {
    const responses = {};
    document.querySelectorAll('.mandatory').forEach(select => {
        const domain = select.dataset.domain;
        responses[domain] = responses[domain] || [];
        responses[domain].push(parseInt(select.value));
    });
    return responses;
}

// Calculate scores
function calculateScores(responses) {
    let weightedTotal = 0;
    const domainScores = {};
    
    Object.entries(responses).forEach(([domain, scores]) => {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        domainScores[domain] = avgScore;
        weightedTotal += avgScore * DOMAIN_WEIGHTS[domain];
    });
    
    const overallScore = Math.round((weightedTotal / 4) * 100); // 4 is max score per question
    return { overallScore, domainScores };
}

function displayResults(score, domainScores) {
    const level = MATURITY_LEVELS.find(lvl => score <= lvl.threshold) || MATURITY_LEVELS[MATURITY_LEVELS.length - 1];
    
    // Update UI
    form.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    levelBadge.textContent = `Level ${MATURITY_LEVELS.indexOf(level)}: ${level.name}`;
    levelBadge.className = `level-badge ${level.colorClass}`;
    
    // Update score circle
    scoreCircle.style.background = `conic-gradient(#4CAF50 0% ${score}%, #e0e0e0 ${score}% 100%)`;
    scoreCircle.setAttribute('data-percent', `${score}%`);
    
    // Populate strengths (modified to show actual strengths)
    strengthsList.innerHTML = '';
    level.strengths.forEach(strength => {
        const li = document.createElement('li');
        li.innerHTML = strength; // Removed bullet since CSS adds it
        strengthsList.appendChild(li);
    });
    
    // Populate recommendations (fixed double arrows)
    recommendationsList.innerHTML = '';
    level.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec; // Removed manual arrow since CSS adds it
        recommendationsList.appendChild(li);
    });
}

function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('DevOps Maturity Report', 105, 20, { align: 'center' });
    
    // Score and Level
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Maturity Score: ${scoreCircle.getAttribute('data-percent')}`, 20, 40);
    doc.text(`Maturity Level: ${levelBadge.textContent}`, 20, 50);
    
    // Strengths
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text('Your Strengths:', 20, 70);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    let yPos = 80;
    const currentLevel = MATURITY_LEVELS.find(lvl => 
        levelBadge.textContent.includes(lvl.name)
    );
    
    currentLevel.strengths.forEach(strength => {
        doc.text(`• ${strength}`, 20, yPos);
        yPos += 10;
    });
    
    // Recommendations
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Recommended Improvements:', 20, yPos + 15);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    yPos += 25;
    
    currentLevel.recommendations.forEach(rec => {
        doc.text(`- ${rec}`, 20, yPos);
        yPos += 10;
    });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated by DevOps Maturity Assessment Tool', 105, 280, { align: 'center' });
    
    // Save PDF (fixed download)
    try {
        doc.save('devops-maturity-report.pdf');
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
    }
}
